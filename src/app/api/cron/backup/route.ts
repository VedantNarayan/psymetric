import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // 1. Verify Vercel Cron Authorization Header
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Create standard server supabase client with service key (bypasses RLS for backups)
  const supabase = createServerSupabase();

  try {
    // 2. Fetch data from all 14 tables concurrently
    const [
      { data: profiles },
      { data: schools },
      { data: schoolClasses },
      { data: studentRoster },
      { data: scenarios },
      { data: questions },
      { data: options },
      { data: teacherAccess },
      { data: parentLinks },
      { data: studentTags },
      { data: assessmentCredits },
      { data: assessmentPlans },
      { data: assessmentSessions },
      { data: candidateResponses }
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('schools').select('*'),
      supabase.from('school_classes').select('*'),
      supabase.from('student_roster').select('*'),
      supabase.from('scenarios').select('*'),
      supabase.from('questions').select('*'),
      supabase.from('options').select('*'),
      supabase.from('teacher_class_access').select('*'),
      supabase.from('parent_student_links').select('*'),
      supabase.from('student_tags').select('*'),
      supabase.from('assessment_credits').select('*'),
      supabase.from('assessment_plans').select('*'),
      supabase.from('assessment_sessions').select('*'),
      supabase.from('candidate_responses').select('*')
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      profiles: profiles || [],
      schools: schools || [],
      school_classes: schoolClasses || [],
      student_roster: studentRoster || [],
      scenarios: scenarios || [],
      questions: questions || [],
      options: options || [],
      teacher_class_access: teacherAccess || [],
      parent_student_links: parentLinks || [],
      student_tags: studentTags || [],
      assessment_credits: assessmentCredits || [],
      assessment_plans: assessmentPlans || [],
      assessment_sessions: assessmentSessions || [],
      candidate_responses: candidateResponses || []
    };

    const backupName = `backup_scheduled_${Date.now()}.json`;
    const jsonString = JSON.stringify(backupData, null, 2);

    // 3. Upload JSON backup to the private 'backups' storage bucket
    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(backupName, jsonString, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. Log the backup run in public.system_backups
    const { error: logError } = await supabase.from('system_backups').insert({
      backup_name: backupName,
      backup_type: 'Scheduled',
      status: 'Success',
      file_path: backupName,
      profiles_count: profiles?.length || 0,
      schools_count: schools?.length || 0,
      roster_count: studentRoster?.length || 0,
      scenarios_count: scenarios?.length || 0,
      questions_count: questions?.length || 0
    });

    if (logError) throw logError;

    return NextResponse.json({ success: true, file: backupName });
  } catch (err: any) {
    console.error('Cron backup failure:', err);
    
    // Log failure in public.system_backups
    try {
      await supabase.from('system_backups').insert({
        backup_name: `failed_scheduled_${Date.now()}.json`,
        backup_type: 'Scheduled',
        status: 'Failed',
        file_path: null,
        profiles_count: 0,
        schools_count: 0,
        roster_count: 0,
        scenarios_count: 0,
        questions_count: 0
      });
    } catch (dbErr) {
      console.error('Failed to log backup failure in DB:', dbErr);
    }
    
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
