import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Helper to authenticate the user and assert super admin status
async function assertSuperAdmin(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const clientSupabase = createServerSupabase(); // Initialize without header to avoid conflicts
  
  // Set the session explicitly so that all subsequent DB/Postgrest requests are authenticated
  const { data: { user }, error: sessionError } = await clientSupabase.auth.setSession({
    access_token: token,
    refresh_token: ''
  });

  if (sessionError || !user) {
    throw new Error(`Invalid user token: ${sessionError?.message || 'No user found'}`);
  }

  // Query database profiles securely using the verified user token client
  const { data: profile, error: profileError } = await clientSupabase
    .from('profiles')
    .select('user_type, is_admin')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new Error(`Forbidden: Super Admin privileges required (Profile Query Error: ${profileError.message}, Code: ${profileError.code})`);
  }

  if (!profile) {
    throw new Error(`Forbidden: Super Admin privileges required (Profile row not found for user ${user.id})`);
  }

  if (profile.user_type !== 'super_admin' && !profile.is_admin) {
    throw new Error(`Forbidden: Super Admin privileges required (User type: ${profile.user_type}, is_admin: ${profile.is_admin})`);
  }

  return { user, clientSupabase };
}

// GET: Trigger manual backup immediately
export async function GET(request: Request) {
  try {
    const { clientSupabase } = await assertSuperAdmin(request);

    // 1. Fetch data from all 14 tables
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
      clientSupabase.from('profiles').select('*'),
      clientSupabase.from('schools').select('*'),
      clientSupabase.from('school_classes').select('*'),
      clientSupabase.from('student_roster').select('*'),
      clientSupabase.from('scenarios').select('*'),
      clientSupabase.from('questions').select('*'),
      clientSupabase.from('options').select('*'),
      clientSupabase.from('teacher_class_access').select('*'),
      clientSupabase.from('parent_student_links').select('*'),
      clientSupabase.from('student_tags').select('*'),
      clientSupabase.from('assessment_credits').select('*'),
      clientSupabase.from('assessment_plans').select('*'),
      clientSupabase.from('assessment_sessions').select('*'),
      clientSupabase.from('candidate_responses').select('*')
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

    const backupName = `backup_manual_${Date.now()}.json`;
    const jsonString = JSON.stringify(backupData, null, 2);

    // 2. Upload JSON to private storage bucket 'backups'
    const { error: uploadError } = await clientSupabase.storage
      .from('backups')
      .upload(backupName, jsonString, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Log the backup
    const { error: logError } = await clientSupabase.from('system_backups').insert({
      backup_name: backupName,
      backup_type: 'Manual',
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
    console.error('Manual backup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Restore system from a backup file
export async function POST(request: Request) {
  try {
    const { clientSupabase } = await assertSuperAdmin(request);
    const { filePath } = await request.json();
    if (!filePath) {
      return NextResponse.json({ error: 'Missing filePath parameter' }, { status: 400 });
    }

    // 1. Download backup JSON file from the bucket
    const { data: fileData, error: downloadError } = await clientSupabase.storage
      .from('backups')
      .download(filePath);

    if (downloadError || !fileData) {
      throw new Error(downloadError?.message || 'Failed to download backup file');
    }

    const fileText = await fileData.text();
    const backup = JSON.parse(fileText);

    // 2. Clear existing records in correct order of dependency (child to parent)
    await clientSupabase.from('candidate_responses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('assessment_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('assessment_credits').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('assessment_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('student_tags').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('parent_student_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('teacher_class_access').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('student_roster').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('school_classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('questions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('scenarios').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await clientSupabase.from('schools').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 3. Restore records sequentially (parent to child to avoid foreign key errors)
    if (backup.schools?.length > 0) {
      const { error } = await clientSupabase.from('schools').insert(backup.schools);
      if (error) throw new Error(`Schools restore: ${error.message}`);
    }
    if (backup.profiles?.length > 0) {
      const { error } = await clientSupabase.from('profiles').insert(backup.profiles);
      if (error) throw new Error(`Profiles restore: ${error.message}`);
    }
    if (backup.scenarios?.length > 0) {
      const { error } = await clientSupabase.from('scenarios').insert(backup.scenarios);
      if (error) throw new Error(`Scenarios restore: ${error.message}`);
    }
    if (backup.questions?.length > 0) {
      const { error } = await clientSupabase.from('questions').insert(backup.questions);
      if (error) throw new Error(`Questions restore: ${error.message}`);
    }
    if (backup.options?.length > 0) {
      const { error } = await clientSupabase.from('options').insert(backup.options);
      if (error) throw new Error(`Options restore: ${error.message}`);
    }
    if (backup.school_classes?.length > 0) {
      const { error } = await clientSupabase.from('school_classes').insert(backup.school_classes);
      if (error) throw new Error(`School Classes restore: ${error.message}`);
    }
    if (backup.student_roster?.length > 0) {
      const { error } = await clientSupabase.from('student_roster').insert(backup.student_roster);
      if (error) throw new Error(`Student Roster restore: ${error.message}`);
    }
    if (backup.teacher_class_access?.length > 0) {
      const { error } = await clientSupabase.from('teacher_class_access').insert(backup.teacher_class_access);
      if (error) throw new Error(`Teacher Class Access restore: ${error.message}`);
    }
    if (backup.parent_student_links?.length > 0) {
      const { error } = await clientSupabase.from('parent_student_links').insert(backup.parent_student_links);
      if (error) throw new Error(`Parent Links restore: ${error.message}`);
    }
    if (backup.student_tags?.length > 0) {
      const { error } = await clientSupabase.from('student_tags').insert(backup.student_tags);
      if (error) throw new Error(`Student Tags restore: ${error.message}`);
    }
    if (backup.assessment_plans?.length > 0) {
      const { error } = await clientSupabase.from('assessment_plans').insert(backup.assessment_plans);
      if (error) throw new Error(`Plans restore: ${error.message}`);
    }
    if (backup.assessment_credits?.length > 0) {
      const { error } = await clientSupabase.from('assessment_credits').insert(backup.assessment_credits);
      if (error) throw new Error(`Credits restore: ${error.message}`);
    }
    if (backup.assessment_sessions?.length > 0) {
      const { error } = await clientSupabase.from('assessment_sessions').insert(backup.assessment_sessions);
      if (error) throw new Error(`Sessions restore: ${error.message}`);
    }
    if (backup.candidate_responses?.length > 0) {
      const { error } = await clientSupabase.from('candidate_responses').insert(backup.candidate_responses);
      if (error) throw new Error(`Responses restore: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('System restore error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Delete a backup record and its storage file
export async function DELETE(request: Request) {
  try {
    const { clientSupabase } = await assertSuperAdmin(request);
    const { id, filePath } = await request.json();

    if (!id || !filePath) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Delete file from storage bucket
    const { error: storageError } = await clientSupabase.storage
      .from('backups')
      .remove([filePath]);

    if (storageError) {
      console.warn('Storage file remove error (continuing DB delete):', storageError);
    }

    // 2. Delete database log entry
    const { error: dbError } = await clientSupabase
      .from('system_backups')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete backup error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
