import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabase();
    const body = await req.json();
    const { session_id, question_id, selected_option_id, response_time_ms } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // 1. Record Response & Update Profile Vector (if an answer was submitted)
    if (selected_option_id && question_id) {
      // Check response time
      const timeMs = Number(response_time_ms) || 0;

      // Save the candidate's response
      const { error: responseError } = await supabase
        .from('candidate_responses')
        .insert({
          session_id,
          question_id,
          selected_option_id,
          response_time_ms: timeMs
        });

      if (responseError && responseError.code !== '23505') { // Ignore duplicate key (if re-submitting)
        console.error('Error inserting candidate response:', responseError);
        return NextResponse.json({ error: 'Failed to record response' }, { status: 500 });
      }

      // Fetch option dimensions to update user's profile state
      const { data: option, error: optionError } = await supabase
        .from('options')
        .select('target_dimension, intensity_weight')
        .eq('id', selected_option_id)
        .single();

      if (optionError || !option) {
        console.error('Error fetching selected option details:', optionError);
        return NextResponse.json({ error: 'Selected option not found' }, { status: 404 });
      }

      // Retrieve current session to update theta vector
      const { data: session, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (sessionError || !session) {
        console.error('Error fetching assessment session:', sessionError);
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      // Map dimension names to their Holland Code single letter
      const dimensionMap: Record<string, string> = {
        'Realistic': 'R',
        'Investigative': 'I',
        'Artistic': 'A',
        'Social': 'S',
        'Enterprising': 'E',
        'Conventional': 'C'
      };

      const dimLetter = dimensionMap[option.target_dimension];
      if (dimLetter) {
        const theta = session.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
        
        // Ensure structure is correct
        if (!theta.counts) {
          theta.counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        }

        theta[dimLetter] = (theta[dimLetter] || 0) + option.intensity_weight;
        theta.counts[dimLetter] = (theta.counts[dimLetter] || 0) + 1;

        // Save updated theta vector back to the session
        const { error: updateError } = await supabase
          .from('assessment_sessions')
          .update({ theta_vector: theta })
          .eq('id', session_id);

        if (updateError) {
          console.error('Error updating session theta vector:', updateError);
        }
      }
    }

    // 2. Determine Progress & Next Question
    // Fetch all active scenarios, questions, and options
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

    // Fetch all candidate responses in this session
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

    // 3. Trigger Data Integrity Engine (At 12 completed scenarios)
    if (completedScenariosCount === 12 && !is_completed && !is_extended) {
      // Evaluate response quality:
      // A. Speed-click check (>30% of answers under 1500ms)
      const speedClicksCount = responses.filter(r => r.response_time_ms < 1500).length;
      const speedClickRatio = responses.length > 0 ? speedClicksCount / responses.length : 0;
      const speedClickFlag = speedClickRatio > 0.30;

      // B. Statistical Contradiction check:
      // If average intensities for opposing RIASEC traits are both high
      // RIASEC Opposites: R-S, I-E, A-C
      const theta = currentSession.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
      const counts = theta.counts || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      
      const avg = (val: number, count: number) => count > 0 ? val / count : 0;
      const avgR = avg(theta.R || 0, counts.R || 0);
      const avgS = avg(theta.S || 0, counts.S || 0);
      const avgI = avg(theta.I || 0, counts.I || 0);
      const avgE = avg(theta.E || 0, counts.E || 0);
      const avgA = avg(theta.A || 0, counts.A || 0);
      const avgC = avg(theta.C || 0, counts.C || 0);

      // Checking if both opposing dimensions have high intensities (> 0.55 out of 1.0)
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
        reasons.push(`Statistical contradiction: user selected high intensities for opposite traits: ${pairs.join(', ')}.`);
      }

      if (reasons.length > 0) {
        // Flag cheat and activate extension block of 6 backup scenarios
        is_cheat_flagged = true;
        cheat_reason = reasons.join(' | ');
        is_extended = true;
        total_extended_scenarios = 6; // Router will route student through 6 additional backup scenarios

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

    // 4. Session termination checks
    const targetScenariosCount = is_extended ? (12 + total_extended_scenarios) : 12;
    if (completedScenariosCount >= targetScenariosCount || completedScenariosCount >= 18) {
      // Completed! Mark session as completed
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

    // 5. Select Next Question
    // Is there a scenario currently in progress?
    let nextScenario = scenarioQuestionStatus.find(s => s.isInProgress);
    let nextQuestion = null;

    if (nextScenario) {
      // Find the first unanswered question in this scenario
      nextQuestion = nextScenario.questions
        .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
        .find((q: any) => !answeredQuestionIds.has(q.id));
    } else {
      // Find the next unstarted scenario
      // If we are in the extension phase, we MUST pull from backup scenarios
      if (is_extended && completedScenariosCount >= 12) {
        nextScenario = scenarioQuestionStatus.find(s => s.is_backup && !s.isCompleted && !s.isInProgress);
      } else {
        // Otherwise pull from baseline scenarios
        nextScenario = scenarioQuestionStatus.find(s => !s.is_backup && !s.isCompleted && !s.isInProgress);
      }

      if (nextScenario) {
        nextQuestion = nextScenario.questions.sort((a: any, b: any) => a.sequence_order - b.sequence_order)[0];
      }
    }

    // If no scenario or question is found but session isn't completed, fallback to complete it
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

    // Format the response payload
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
