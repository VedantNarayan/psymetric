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
    
    // 1. Record Response & Update Profile Vector
    if (selected_option_id && question_id) {
      const timeMs = Number(response_time_ms) || 0;

      const { error: responseError } = await supabase
        .from('candidate_responses')
        .insert({
          session_id,
          question_id,
          selected_option_id,
          response_time_ms: timeMs
        });

      if (responseError && responseError.code !== '23505') {
        console.error('Error inserting candidate response:', responseError);
        return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
      }

      const { data: option, error: optionError } = await supabase
        .from('options')
        .select('target_dimension, intensity_weight')
        .eq('id', selected_option_id)
        .single();

      if (optionError || !option) {
        console.error('Error fetching selected option details:', optionError);
        return NextResponse.json({ error: 'Selected option not found' }, { status: 404 });
      }

      const { data: session, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching assessment session:', sessionError);
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
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

      const theta = session.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
      
      if (!theta.counts) {
        theta.counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      }

      let updated = false;
      for (const rawDim of dimensions) {
        const dimLetter = dimensionMap[rawDim];
        if (dimLetter) {
          theta[dimLetter] = (theta[dimLetter] || 0) + option.intensity_weight;
          theta.counts[dimLetter] = (theta.counts[dimLetter] || 0) + 1;
          updated = true;
        }
      }

      if (updated) {
        await supabase
          .from('assessment_sessions')
          .update({ theta_vector: theta })
          .eq('id', session_id);
      }
    }

    // Fetch all active scenarios
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select(`
        id, title, video_url, is_backup, target_age_group,
        questions (
          id, sequence_order, question_text,
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

    // Map questions to scenarios
    const scenarioQuestionStatus = scenarios.map(sc => {
      const qs = sc.questions || [];
      const totalQs = qs.length;
      const answeredQs = qs.filter(q => answeredQuestionIds.has(q.id));
      const isCompleted = totalQs > 0 && answeredQs.length === totalQs;
      const isInProgress = answeredQs.length > 0 && answeredQs.length < totalQs;
      
      return {
        ...sc,
        totalQs,
        answeredQsCount: answeredQs.length,
        isCompleted,
        isInProgress
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

    let nextScenario = scenarioQuestionStatus.find(s => s.isInProgress);
    let nextQuestion = null;

    if (nextScenario) {
      nextQuestion = nextScenario.questions
        .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
        .find((q: any) => !answeredQuestionIds.has(q.id));
    } else {
      if (is_extended && completedScenariosCount >= 12) {
        nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted && !s.isInProgress);
      } else {
        nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted && !s.isInProgress);
      }

      if (nextScenario) {
        nextQuestion = nextScenario.questions.sort((a: any, b: any) => a.sequence_order - b.sequence_order)[0];
      }
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
      total_extended_scenarios: 0
    };
    inMemoryResponses[session_id] = [];
  }

  const session = inMemorySessions[session_id];
  const responses = inMemoryResponses[session_id];

  // 1. Process Response
  if (selected_option_id && question_id) {
    // Check if response already exists (avoid duplicate submission bugs)
    if (!responses.some(r => r.question_id === question_id)) {
      responses.push({
        question_id,
        selected_option_id,
        response_time_ms: response_time_ms || 1800
      });

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
    }
  }

  // 2. Compute completed scenarios count
  const answeredQuestionIds = new Set(responses.map(r => r.question_id));

  const scenarioQuestionStatus = fallbackScenarios.map(sc => {
    const qs = sc.questions || [];
    const totalQs = qs.length;
    const answeredQs = qs.filter(q => answeredQuestionIds.has(q.id));
    const isCompleted = totalQs > 0 && answeredQs.length === totalQs;
    const isInProgress = answeredQs.length > 0 && answeredQs.length < totalQs;
    
    return {
      ...sc,
      totalQs,
      answeredQsCount: answeredQs.length,
      isCompleted,
      isInProgress
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
  let nextScenario = scenarioQuestionStatus.find(s => s.isInProgress);
  let nextQuestion = null;

  if (nextScenario) {
    nextQuestion = nextScenario.questions
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .find(q => !answeredQuestionIds.has(q.id));
  } else {
    if (session.is_extended && completedScenariosCount >= 12) {
      nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted && !s.isInProgress);
    } else {
      nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted && !s.isInProgress);
    }

    if (nextScenario) {
      nextQuestion = nextScenario.questions.sort((a, b) => a.sequence_order - b.sequence_order)[0];
    }
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
