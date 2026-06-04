import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  fallbackScenarios, 
  inMemorySessions, 
  inMemoryResponses, 
  inMemoryProfiles 
} from '@/lib/supabase/fallbackData';

export async function POST(req: NextRequest) {
  let isDatabaseOffline = false;

  try {
    const supabase = createServerSupabase();
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Check if database is online
    try {
      const { error: probeError } = await supabase.from('assessment_sessions').select('id').limit(1);
      if (probeError) throw new Error('DB offline');
    } catch (dbErr) {
      isDatabaseOffline = true;
    }

    let profile: any = null;
    let theta: any = null;
    let isCheat = false;
    let responseSummary: any[] = [];
    let avgResponseTime = 0;
    let fastClickPercentage = 0;

    if (isDatabaseOffline) {
      // ─── RUN IN-MEMORY RETRIEVAL ───
      const session = inMemorySessions[session_id];
      if (!session) {
        return NextResponse.json({ error: 'Session not found in memory' }, { status: 404 });
      }

      profile = inMemoryProfiles[session.user_id] || inMemoryProfiles['mock-user-id'];
      theta = session.theta_vector || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0, counts: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 } };
      isCheat = session.is_cheat_flagged;

      const responses = inMemoryResponses[session_id] || [];
      
      // Calculate times
      const totalTime = responses.reduce((sum, r) => sum + r.response_time_ms, 0);
      avgResponseTime = responses.length > 0 ? Math.round(totalTime / responses.length) : 0;
      
      const fastClicks = responses.filter(r => r.response_time_ms < 1500).length;
      fastClickPercentage = responses.length > 0 ? Math.round((fastClicks / responses.length) * 100) : 0;

      // Compile response summaries
      responseSummary = responses.map(r => {
        let foundScenario: any = null;
        let foundQuestion: any = null;
        let foundOption: any = null;

        for (const sc of fallbackScenarios) {
          const q = sc.questions.find(qy => qy.id === r.question_id);
          if (q) {
            foundScenario = sc;
            foundQuestion = q;
            foundOption = q.options.find(o => o.id === r.selected_option_id);
            break;
          }
        }

        return {
          scenario: foundScenario?.title || 'Alternative Field Operation',
          question: foundQuestion?.question_text || 'Standard Question',
          selected_option: foundOption ? `${foundOption.option_letter}: ${foundOption.option_text}` : 'Choice Selected',
          dimension: foundOption?.target_dimension || 'Investigative',
          weight: foundOption?.intensity_weight || 0.8,
          response_time_ms: r.response_time_ms
        };
      });

    } else {
      // ─── STANDARD DATABASE RETRIEVAL ───
      const { data: sessionData, error: sessionError } = await supabase
        .from('assessment_sessions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            age_tier,
            institution_type
          )
        `)
        .eq('id', session_id)
        .single();

      if (sessionError || !sessionData) {
        console.error('Error fetching session:', sessionError);
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      profile = sessionData.profiles;
      theta = sessionData.theta_vector;
      isCheat = sessionData.is_cheat_flagged;

      const { data: responses, error: responsesError } = await supabase
        .from('candidate_responses')
        .select(`
          id,
          response_time_ms,
          questions:question_id (
            question_text,
            scenarios:scenario_id (
              title
            )
          ),
          options:selected_option_id (
            option_letter,
            option_text,
            target_dimension,
            intensity_weight
          )
        `)
        .eq('session_id', session_id);

      if (responsesError || !responses) {
        console.error('Error fetching responses:', responsesError);
        return NextResponse.json({ error: 'Failed to fetch candidate responses' }, { status: 500 });
      }

      avgResponseTime = responses.length > 0 
        ? Math.round(responses.reduce((sum, r) => sum + r.response_time_ms, 0) / responses.length)
        : 0;

      const fastClicksCount = responses.filter(r => r.response_time_ms < 1500).length;
      fastClickPercentage = responses.length > 0 ? Math.round((fastClicksCount / responses.length) * 100) : 0;

      responseSummary = responses.map((r: any) => ({
        scenario: r.questions?.scenarios?.title || 'Unknown Scenario',
        question: r.questions?.question_text || 'Unknown Question',
        selected_option: `${r.options?.option_letter}: ${r.options?.option_text}`,
        dimension: r.options?.target_dimension || 'Unknown',
        weight: r.options?.intensity_weight || 0,
        response_time_ms: r.response_time_ms
      }));
    }

    // 3. Compute RIASEC score distribution
    const totalIntensity = (theta.R || 0) + (theta.I || 0) + (theta.A || 0) + (theta.S || 0) + (theta.E || 0) + (theta.C || 0);

    const calcPercentage = (val: number) => {
      if (totalIntensity === 0) return 16.67;
      return Math.round((val / totalIntensity) * 10000) / 100;
    };

    const percentages = {
      Realistic: calcPercentage(theta.R || 0),
      Investigative: calcPercentage(theta.I || 0),
      Artistic: calcPercentage(theta.A || 0),
      Social: calcPercentage(theta.S || 0),
      Enterprising: calcPercentage(theta.E || 0),
      Conventional: calcPercentage(theta.C || 0)
    };

    // 4. Generate Report via Google Gemini API
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY is missing or set to placeholder. Generating fallback mock report.');
      const fallbackReport = generateFallbackReport(profile, percentages, responseSummary, avgResponseTime, isCheat);
      return NextResponse.json(fallbackReport);
    }

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
You are a Senior Elite Educational Psychologist and Vocational Director specializing in the Holland Codes (RIASEC) framework.
Your task is to analyze a student's psychometric profile, response speed telemetry, and assessment logs to construct a highly personalized, industry-ready career guidance report.

STUDENT PROFILE:
- Full Name: ${profile.full_name}
- Age Tier: ${profile.age_tier}
- Institution Type: ${profile.institution_type}
- Test Reliability (Anti-Cheat Flagged): ${isCheat ? 'YES (Noisy/Speed-clicked dataset)' : 'NO (High Integrity Data)'}
- Average Response Time: ${avgResponseTime}ms
- Rapid Click Ratio (<1.5s): ${fastClickPercentage}%

CALCULATED HOLLAND SCORING DIMENSIONS:
- Realistic (R): ${percentages.Realistic}%
- Investigative (I): ${percentages.Investigative}%
- Artistic (A): ${percentages.Artistic}%
- Social (S): ${percentages.Social}%
- Enterprising (E): ${percentages.Enterprising}%
- Conventional (C): ${percentages.Conventional}%

ASSESSMENT TRAILING LOGS (Scenario details and student choices):
${JSON.stringify(responseSummary, null, 2)}

INSTRUCTIONS:
1. Review the Holland dimension percentages. Determine the dominant Holland Code combination (typically the top 2-3 traits).
2. Calculate the "Operational Mode Breakdown":
   - Hands-on (R & C weighted)
   - Analytical (I & C weighted)
   - Creative (A & E/S weighted)
   Ensure these three sum to 100%.
3. Recommend 3 highly-personalized, futuristic/modern high-growth career roles tailored specifically for this student (e.g. "Autonomous Drone Architect", "Applied AI Systems Engineer", "UI/UX Storyteller", "Quantum Crypto Specialist", "Robotic Care Coordinator").
4. Provide a Senior Psychologist's Diagnostic Summary (3 paragraphs) reviewing their personality profile, cognitive strengths, and how their response speed (average ${avgResponseTime}ms) reflects their decision-making instincts.

You must respond with a STRICT JSON payload matching this interface:
{
  "holland_percentages": {
    "Realistic": number,
    "Investigative": number,
    "Artistic": number,
    "Social": number,
    "Enterprising": number,
    "Conventional": number
  },
  "operational_modes": {
    "hands_on": number,
    "analytical": number,
    "creative": number
  },
  "career_recommendations": [
    {
      "title": string,
      "field": string,
      "description": string,
      "suitability_score": number,
      "growth_rate": string,
      "education_path": string,
      "matching_skills": string[]
    }
  ],
  "psychologist_summary": string
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const reportData = JSON.parse(text);
    return NextResponse.json(reportData);

  } catch (err: any) {
    console.error('Error in generate-report API route:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}

function generateFallbackReport(profile: any, percentages: any, responses: any[], avgResponseTime: number, isCheat: boolean) {
  const sorted = Object.entries(percentages)
    .sort((a: any, b: any) => b[1] - a[1])
    .map(entry => entry[0]);

  const top1 = sorted[0];
  const top2 = sorted[1];

  let careers = [];
  let hands_on = 30;
  let analytical = 40;
  let creative = 30;

  if (top1 === 'Realistic' || top2 === 'Realistic') {
    hands_on = 60;
    analytical = 25;
    creative = 15;
    careers.push({
      title: 'Autonomous Drone Architect',
      field: 'Realistic & Investigative',
      description: 'Designing high-end physical UAV structures coupled with automated navigation scripting.',
      suitability_score: 94,
      growth_rate: 'High (Forecasted +28% by 2030)',
      education_path: 'B.S. in Aerospace or Robotics Engineering, certified drone flight paths',
      matching_skills: ['UAV Mechanics', 'CAD Assembly', 'Sensor Calibration', 'Python Programming']
    });
  }

  if (top1 === 'Investigative' || top2 === 'Investigative') {
    analytical = 60;
    hands_on = 20;
    creative = 20;
    careers.push({
      title: 'Applied AI Systems Engineer',
      field: 'Investigative & Conventional',
      description: 'Developing and optimizing deep learning model integration pipelines within enterprise databases.',
      suitability_score: 91,
      growth_rate: 'Very High (+35% growth by 2028)',
      education_path: 'B.S. in Computer Science, Machine Learning focus, PyTorch credentials',
      matching_skills: ['Neural Networks', 'Python scripts', 'Database indexing', 'Matrix math']
    });
  }

  if (top1 === 'Artistic' || top2 === 'Artistic') {
    creative = 60;
    analytical = 20;
    hands_on = 20;
    careers.push({
      title: 'Immersive UI/UX Storyteller',
      field: 'Artistic & Social',
      description: 'Crafting responsive glassmorphic interfaces and spatial VR flows focused on user interaction.',
      suitability_score: 89,
      growth_rate: 'Medium-High (+22% Growth)',
      education_path: 'Degree in Interaction Design, UI Portfolios, Psychology credits',
      matching_skills: ['Figma Layouts', 'Framer Motion UI', 'Active Listening', 'Visual Design']
    });
  }

  if (careers.length < 3) {
    careers.push({
      title: 'Creative Technical Producer',
      field: 'Enterprising & Artistic',
      description: 'Directing complex digital game audio synthesizers and coordinating design sprints.',
      suitability_score: 85,
      growth_rate: 'High (+15% Growth)',
      education_path: 'Business Admin Minor, Sound Design certification',
      matching_skills: ['Team organization', 'Framer layout', 'Synthesizer wave shape']
    });
  }
  if (careers.length < 3) {
    careers.push({
      title: 'Systems Compliance Manager',
      field: 'Conventional & Investigative',
      description: 'Structuring massive ledger transactions and auditing system frameworks for security compliance.',
      suitability_score: 82,
      growth_rate: 'Stable (+8% Growth)',
      education_path: 'Information Systems auditing, CISSP',
      matching_skills: ['Compliance checklists', 'Ledger tracing', 'ISO-27001 standards']
    });
  }

  careers = careers.slice(0, 3);

  const totalMode = hands_on + analytical + creative;
  hands_on = Math.round((hands_on / totalMode) * 100);
  analytical = Math.round((analytical / totalMode) * 100);
  creative = 100 - (hands_on + analytical);

  let statusMsg = isCheat
    ? 'The data points show some indicators of rapid response selection or inconsistency. While this can reflect highly flexible cognitive styles or swift intuitive processing, we recommend interpreting the structured scores with guidance.'
    : 'The assessment logs show high integrity patterns, with a reflective response pacing indicating a deliberate and thoughtful approach to resolving environmental scenarios.';

  const name = profile?.full_name || 'Student';
  const summary = `Based on our psychoanalysis, ${name} exhibits a primary alignment with the "${top1}" and "${top2}" domains of interest. This suggests a profile that flourishes in environments combining ${top1.toLowerCase()} capabilities with ${top2.toLowerCase()} methodologies. ${statusMsg}

On the behavioral side, ${name}'s average response latency of ${avgResponseTime}ms indicates a cognitive operational style that balances execution speed with decision-making confidence.

We recommend pursuing modern high-growth vocational routes where they can apply their strongest dimensions natively. Specialized career options such as ${careers.map(c => c.title).join(', ')} align closely with these natural behavioral instincts.`;

  return {
    holland_percentages: percentages,
    operational_modes: {
      hands_on,
      analytical,
      creative
    },
    career_recommendations: careers,
    psychologist_summary: summary
  };
}
