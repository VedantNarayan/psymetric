import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { 
  fallbackScenarios, 
  inMemorySessions, 
  inMemoryResponses,
  inMemoryProfiles 
} from '@/lib/supabase/fallbackData';

export async function POST(req: NextRequest) {
  let isDatabaseOffline = false;
  
  try {
    const authHeader = req.headers.get('Authorization');
    const supabase = createServerSupabase(authHeader);
    const body = await req.json();
    const { session_id, question_id, selected_option_id, response_time_ms } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Attempt database check
    try {
      // Run a lightweight probe to see if Supabase DB is online
      const { error: probeError } = await supabase.from('scenarios').select('id').limit(1);
      if (probeError) {
        throw new Error('Database offline or unmigrated');
      }
    } catch (dbErr) {
      isDatabaseOffline = true;
      console.warn('Database is offline, routing through in-memory fallback engine.');
    }

    // ─── IF DATABASE IS OFFLINE, RUN IN-MEMORY ENGINE ───
    if (isDatabaseOffline) {
      return handleInMemoryFallback(session_id, question_id, selected_option_id, response_time_ms);
    }

    // ─── STANDARD DATABASE CODE ───
    
    // Fetch the session first (always needed)
    const { data: session, error: sessionError } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      console.error('Error fetching assessment session:', sessionError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ─── ACTIVE SET NUMBER CALCULATION (YEARLY SPACING / FALLBACK) ───
    const thetaVector = session.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
    let set_number = thetaVector.set_number;

    if (!set_number) {
      // Fetch completed sessions for user to determine set spacing
      const { data: pastSessions } = await supabase
        .from('assessment_sessions')
        .select('created_at, theta_vector')
        .eq('user_id', session.user_id)
        .eq('is_completed', true)
        .order('created_at', { ascending: false });

      const pastCount = pastSessions?.length || 0;

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const recentSets = (pastSessions || [])
        .filter(s => new Date(s.created_at) >= oneYearAgo)
        .map(s => s.theta_vector?.set_number)
        .filter(Boolean);

      const uniqueRecentSets = Array.from(new Set(recentSets));

      if (!uniqueRecentSets.includes(1)) {
        set_number = 1;
      } else if (!uniqueRecentSets.includes(2)) {
        set_number = 2;
      } else if (!uniqueRecentSets.includes(3)) {
        set_number = 3;
      } else {
        set_number = (pastCount % 3) + 1;
      }

      thetaVector.set_number = set_number;
      await supabase
        .from('assessment_sessions')
        .update({ theta_vector: thetaVector })
        .eq('id', session_id);
    }

    // 1. Record Response & Update Profile Vector
    if (question_id) {
      const timeMs = Number(response_time_ms) || 0;

      const { error: responseError } = await supabase
        .from('candidate_responses')
        .insert({
          session_id,
          question_id,
          selected_option_id: selected_option_id || null,
          response_time_ms: timeMs
        });

      if (responseError && responseError.code !== '23505') {
        console.error('Error inserting candidate response:', responseError);
        return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
      }

      if (selected_option_id) {
        const { data: option, error: optionError } = await supabase
          .from('options')
          .select('target_dimension, intensity_weight')
          .eq('id', selected_option_id)
          .single();

        if (optionError || !option) {
          console.error('Error fetching selected option details:', optionError);
          return NextResponse.json({ error: 'Selected option not found' }, { status: 404 });
        }

        const dimensionMap: Record<string, string> = {
          'Realistic': 'R',
          'Investigative': 'I',
          'Artistic': 'A',
          'Social': 'S',
          'Enterprising': 'E',
          'Conventional': 'C'
        };

        const dimensions = (option.target_dimension || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);

        if (!thetaVector.counts) {
          thetaVector.counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        }

        let updated = false;
        for (const rawDim of dimensions) {
          const dimLetter = dimensionMap[rawDim];
          if (dimLetter) {
            thetaVector[dimLetter] = (thetaVector[dimLetter] || 0) + option.intensity_weight;
            thetaVector.counts[dimLetter] = (thetaVector.counts[dimLetter] || 0) + 1;
            updated = true;
          }
        }

        if (updated) {
          await supabase
            .from('assessment_sessions')
            .update({ theta_vector: thetaVector })
            .eq('id', session_id);
        }
      } else {
        // Unanswered: extend test session dynamically to serve replacement items
        await supabase
          .from('assessment_sessions')
          .update({
            is_extended: true,
            total_extended_scenarios: (session.total_extended_scenarios || 0) + 1
          })
          .eq('id', session_id);
      }
    }

    // Fetch all active scenarios
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        id, title, video_url, is_backup, target_age_group,
        questions (
          id, sequence_order, question_text, show_at_seconds,
          options (
            id, option_letter, option_text
          )
        )
      `)
      .eq('is_active', true);

    if (scenariosError || !scenarios) {
      console.error('Error fetching scenarios:', scenariosError);
      return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
    }

    // Fetch all candidate responses
    const { data: responses, error: responsesError } = await supabase
      .from('candidate_responses')
      .select('question_id, response_time_ms')
      .eq('session_id', session_id);

    if (responsesError) {
      console.error('Error fetching responses:', responsesError);
      return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
    }

    const answeredQuestionIds = new Set(responses.map(r => r.question_id));

    // Map questions to scenarios (filtering by set_number and ensuring scenario uniqueness)
    const scenarioQuestionStatus = scenarios.map(sc => {
      const qs = sc.questions || [];
      
      // Select the active question for this set_number. If missing, fall back to the first.
      let activeQ = qs.find(q => q.sequence_order === set_number);
      if (!activeQ && qs.length > 0) {
        activeQ = qs.sort((a: any, b: any) => a.sequence_order - b.sequence_order)[0];
      }

      const isCompleted = activeQ ? answeredQuestionIds.has(activeQ.id) : false;
      
      return {
        ...sc,
        activeQuestion: activeQ,
        isCompleted,
        isInProgress: false // scenario has exactly 1 question per session, so it is never in-progress
      };
    });

    const completedBaselineScenarios = scenarioQuestionStatus.filter(s => !s.is_backup && s.isCompleted);
    const completedBackupScenarios = scenarioQuestionStatus.filter(s => s.is_backup && s.isCompleted);
    const completedScenariosCount = completedBaselineScenarios.length + completedBackupScenarios.length;

    // Fetch session parameters
    const { data: currentSession, error: sessionFetchError } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', session_id)
      .single();

    if (sessionFetchError || !currentSession) {
      console.error('Error fetching session:', sessionFetchError);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    let { is_cheat_flagged, cheat_reason, is_extended, total_extended_scenarios, is_completed } = currentSession;

    // Trigger Data Integrity Engine (At 12 completed scenarios)
    if (completedScenariosCount === 12 && !is_completed && !is_extended) {
      const speedClicksCount = responses.filter(r => r.response_time_ms < 1500).length;
      const speedClickRatio = responses.length > 0 ? speedClicksCount / responses.length : 0;
      const speedClickFlag = speedClickRatio > 0.30;

      const theta = currentSession.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
      const counts = theta.counts || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      
      const avg = (val: number, count: number) => count > 0 ? val / count : 0;
      const avgR = avg(theta.R || 0, counts.R || 0);
      const avgS = avg(theta.S || 0, counts.S || 0);
      const avgI = avg(theta.I || 0, counts.I || 0);
      const avgE = avg(theta.E || 0, counts.E || 0);
      const avgA = avg(theta.A || 0, counts.A || 0);
      const avgC = avg(theta.C || 0, counts.C || 0);

      const contradictionRS = avgR > 0.55 && avgS > 0.55;
      const contradictionIE = avgI > 0.55 && avgE > 0.55;
      const contradictionAC = avgA > 0.55 && avgC > 0.55;
      const contradictionFlag = contradictionRS || contradictionIE || contradictionAC;

      let reasons: string[] = [];
      if (speedClickFlag) {
        reasons.push(`Speed click threshold exceeded: ${(speedClickRatio * 100).toFixed(1)}% of clicks were < 1500ms.`);
      }
      if (contradictionFlag) {
        let pairs = [];
        if (contradictionRS) pairs.push('Realistic-Social');
        if (contradictionIE) pairs.push('Investigative-Enterprising');
        if (contradictionAC) pairs.push('Artistic-Conventional');
        reasons.push(`Statistical contradiction: user selected opposite dimensions: ${pairs.join(', ')}.`);
      }

      if (reasons.length > 0) {
        is_cheat_flagged = true;
        cheat_reason = reasons.join(' | ');
        is_extended = true;
        total_extended_scenarios = 6;

        await supabase
          .from('assessment_sessions')
          .update({
            is_cheat_flagged: true,
            cheat_reason: cheat_reason,
            is_extended: true,
            total_extended_scenarios: 6
          })
          .eq('id', session_id);
      }
    }

    const targetScenariosCount = is_extended ? (12 + total_extended_scenarios) : 12;
    if (completedScenariosCount >= targetScenariosCount || completedScenariosCount >= 18) {
      await supabase
        .from('assessment_sessions')
        .update({ is_completed: true })
        .eq('id', session_id);

      return NextResponse.json({
        is_completed: true,
        is_cheat_flagged,
        is_extended,
        progress: {
          answered_scenarios: completedScenariosCount,
          total_scenarios: targetScenariosCount
        }
      });
    }

    let nextScenario = null;
    let nextQuestion = null;

    if (is_extended && completedScenariosCount >= 12) {
      nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted);
    } else {
      nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted);
    }

    if (nextScenario && nextScenario.activeQuestion) {
      nextQuestion = nextScenario.activeQuestion;
    }

    if (!nextScenario || !nextQuestion) {
      await supabase
        .from('assessment_sessions')
        .update({ is_completed: true })
        .eq('id', session_id);

      return NextResponse.json({
        is_completed: true,
        is_cheat_flagged,
        is_extended,
        progress: {
          answered_scenarios: completedScenariosCount,
          total_scenarios: completedScenariosCount
        }
      });
    }

    const formattedScenario = {
      id: nextScenario.id,
      title: nextScenario.title,
      video_url: nextScenario.video_url
    };

    const sortedOptions = (nextQuestion.options || []).sort((a: any, b: any) => a.option_letter.localeCompare(b.option_letter));
    const formattedQuestion = {
      id: nextQuestion.id,
      question_text: nextQuestion.question_text,
      sequence_order: nextQuestion.sequence_order,
      show_at_seconds: nextQuestion.show_at_seconds || 0,
      options: sortedOptions.map((opt: any) => ({
        id: opt.id,
        option_letter: opt.option_letter,
        option_text: opt.option_text
      }))
    };

    return NextResponse.json({
      is_completed: false,
      is_cheat_flagged,
      is_extended,
      current_scenario: formattedScenario,
      current_question: formattedQuestion,
      progress: {
        answered_scenarios: completedScenariosCount,
        total_scenarios: targetScenariosCount
      }
    });

  } catch (err: any) {
    console.error('Error in next-item API route:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

// ─── IN-MEMORY SIMULATION ENGINE ───
function handleInMemoryFallback(
  session_id: string, 
  question_id: string | null, 
  selected_option_id: string | null, 
  response_time_ms: number | null
) {
  // Initialize local session state
  if (!inMemorySessions[session_id]) {
    inMemorySessions[session_id] = {
      id: session_id,
      user_id: 'mock-user-id',
      is_completed: false,
      theta_vector: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } },
      is_cheat_flagged: false,
      cheat_reason: '',
      is_extended: false,
      total_extended_scenarios: 0,
      created_at: new Date().toISOString()
    };
    inMemoryResponses[session_id] = [];
  }

  const session = inMemorySessions[session_id];
  const responses = inMemoryResponses[session_id];

  const thetaVector = session.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
  let set_number = thetaVector.set_number;

  if (!set_number) {
    // Determine active set number based on past completed sessions for this mock user
    const pastSessions = Object.values(inMemorySessions).filter(
      (s: any) => s.user_id === session.user_id && s.is_completed
    );
    const pastCount = pastSessions.length;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentSets = pastSessions
      .filter((s: any) => !s.created_at || new Date(s.created_at) >= oneYearAgo)
      .map((s: any) => s.theta_vector?.set_number)
      .filter(Boolean);

    const uniqueRecentSets = Array.from(new Set(recentSets));

    if (!uniqueRecentSets.includes(1)) {
      set_number = 1;
    } else if (!uniqueRecentSets.includes(2)) {
      set_number = 2;
    } else if (!uniqueRecentSets.includes(3)) {
      set_number = 3;
    } else {
      set_number = (pastCount % 3) + 1;
    }

    thetaVector.set_number = set_number;
    session.theta_vector = thetaVector;
  }

  // 1. Process Response
  if (question_id) {
    // Check if response already exists (avoid duplicate submission bugs)
    if (!responses.some(r => r.question_id === question_id)) {
      responses.push({
        question_id,
        selected_option_id: selected_option_id || null,
        response_time_ms: response_time_ms || 12000
      });

      if (selected_option_id) {
        // Find selected option traits to update theta vector
        let foundOption: any = null;
        for (const sc of fallbackScenarios) {
          for (const q of sc.questions) {
            const opt = q.options.find(o => o.id === selected_option_id);
            if (opt) {
              foundOption = opt;
              break;
            }
          }
          if (foundOption) break;
        }

        if (foundOption) {
          const dimensionMap: Record<string, string> = {
            'Realistic': 'R',
            'Investigative': 'I',
            'Artistic': 'A',
            'Social': 'S',
            'Enterprising': 'E',
            'Conventional': 'C'
          };

          const dimensions = (foundOption.target_dimension || '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);

          const theta = session.theta_vector;
          if (!theta.counts) {
            theta.counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
          }

          for (const rawDim of dimensions) {
            const dimLetter = dimensionMap[rawDim];
            if (dimLetter) {
              theta[dimLetter] = (theta[dimLetter] || 0) + foundOption.intensity_weight;
              theta.counts[dimLetter] = (theta.counts[dimLetter] || 0) + 1;
            }
          }
        }
      } else {
        // Unanswered fallback extension
        session.is_extended = true;
        session.total_extended_scenarios = (session.total_extended_scenarios || 0) + 1;
      }
    }
  }

  // 2. Compute completed scenarios count
  const answeredQuestionIds = new Set(responses.map(r => r.question_id));

  // Map questions to scenarios (filtering by set_number and ensuring scenario uniqueness)
  const scenarioQuestionStatus = fallbackScenarios.map(sc => {
    const qs = sc.questions || [];
    
    // Select the active question for this set_number. If missing, fall back to the first.
    let activeQ = qs.find(q => q.sequence_order === set_number);
    if (!activeQ && qs.length > 0) {
      activeQ = qs.sort((a, b) => a.sequence_order - b.sequence_order)[0];
    }

    const isCompleted = activeQ ? answeredQuestionIds.has(activeQ.id) : false;
    
    return {
      ...sc,
      activeQuestion: activeQ,
      isCompleted,
      isInProgress: false // scenario has exactly 1 question per session, so it is never in-progress
    };
  });

  const completedBaselineScenarios = scenarioQuestionStatus.filter(s => !s.is_backup && s.isCompleted);
  const completedBackupScenarios = scenarioQuestionStatus.filter(s => s.is_backup && s.isCompleted);
  const completedScenariosCount = completedBaselineScenarios.length + completedBackupScenarios.length;

  // 3. Evaluate Anti-Cheat (at 12 scenarios)
  if (completedScenariosCount === 12 && !session.is_completed && !session.is_extended) {
    // A. Speed check
    const speedClicksCount = responses.filter(r => r.response_time_ms < 1500).length;
    const speedClickRatio = responses.length > 0 ? speedClicksCount / responses.length : 0;
    const speedClickFlag = speedClickRatio > 0.30;

    // B. Contradiction check
    const theta = session.theta_vector;
    const counts = theta.counts;
    const avg = (val: number, count: number) => count > 0 ? val / count : 0;
    const avgR = avg(theta.R, counts.R);
    const avgS = avg(theta.S, counts.S);
    const avgI = avg(theta.I, counts.I);
    const avgE = avg(theta.E, counts.E);
    const avgA = avg(theta.A, counts.A);
    const avgC = avg(theta.C, counts.C);

    const contradictionRS = avgR > 0.55 && avgS > 0.55;
    const contradictionIE = avgI > 0.55 && avgE > 0.55;
    const contradictionAC = avgA > 0.55 && avgC > 0.55;
    const contradictionFlag = contradictionRS || contradictionIE || contradictionAC;

    let reasons = [];
    if (speedClickFlag) {
      reasons.push(`Speed click: ${(speedClickRatio * 100).toFixed(0)}% of answers under 1500ms.`);
    }
    if (contradictionFlag) {
      reasons.push('Contradictory selections in opposites.');
    }

    if (reasons.length > 0) {
      session.is_cheat_flagged = true;
      session.cheat_reason = reasons.join(' | ');
      session.is_extended = true;
      session.total_extended_scenarios = 6;
    }
  }

  // Check termination
  const targetScenariosCount = session.is_extended ? (12 + session.total_extended_scenarios) : 12;
  if (completedScenariosCount >= targetScenariosCount || completedScenariosCount >= 18) {
    session.is_completed = true;
    return NextResponse.json({
      is_completed: true,
      is_cheat_flagged: session.is_cheat_flagged,
      is_extended: session.is_extended,
      progress: {
        answered_scenarios: completedScenariosCount,
        total_scenarios: targetScenariosCount
      }
    });
  }

  // 4. Select Next Question
  let nextScenario = null;
  let nextQuestion = null;

  if (session.is_extended && completedScenariosCount >= 12) {
    nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted);
  } else {
    nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted);
  }

  if (nextScenario && nextScenario.activeQuestion) {
    nextQuestion = nextScenario.activeQuestion;
  }

  if (!nextScenario || !nextQuestion) {
    session.is_completed = true;
    return NextResponse.json({
      is_completed: true,
      is_cheat_flagged: session.is_cheat_flagged,
      is_extended: session.is_extended,
      progress: {
        answered_scenarios: completedScenariosCount,
        total_scenarios: completedScenariosCount
      }
    });
  }

  return NextResponse.json({
    is_completed: false,
    is_cheat_flagged: session.is_cheat_flagged,
    is_extended: session.is_extended,
    current_scenario: {
      id: nextScenario.id,
      title: nextScenario.title,
      video_url: nextScenario.video_url
    },
    current_question: {
      id: nextQuestion.id,
      question_text: nextQuestion.question_text,
      sequence_order: nextQuestion.sequence_order,
      show_at_seconds: nextQuestion.show_at_seconds || 6,
      options: nextQuestion.options.map(opt => ({
        id: opt.id,
        option_letter: opt.option_letter,
        option_text: opt.option_text
      }))
    },
    progress: {
      answered_scenarios: completedScenariosCount,
      total_scenarios: targetScenariosCount
    }
  });
}
