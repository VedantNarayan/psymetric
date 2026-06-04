'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  BarChart3, Settings, Video, Upload, Shield, 
  Trash2, Plus, Sparkles, Sliders, Users, 
  Activity, Clock, ShieldAlert, GraduationCap, Building, Loader2, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminConsole() {
  const router = useRouter();
  
  // Auth & UI States
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'scenarios'>('analytics');

  // Editing Questions State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editShowAtSeconds, setEditShowAtSeconds] = useState<number>(6);
  const [editOptions, setEditOptions] = useState<any[]>([]);

  // Analytics States
  const [stats, setStats] = useState({
    totalStudents: 0,
    cheatingSessions: 0,
    activeSchools: 0,
    activeColleges: 0,
    avgResponseTime: 0,
    totalScenarios: 0
  });

  // Scenarios State
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  
  // Form states for Scenario Creator
  const [newTitle, setNewTitle] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [targetAge, setTargetAge] = useState('All');
  const [isBackup, setIsBackup] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Question & Option Form States
  interface OptionDraft {
    letter: string;
    text: string;
    dimensions: string[];
    weight: number;
  }
  interface QuestionOverlayDraft {
    questionText: string;
    showAtSeconds: number;
    options: OptionDraft[];
  }

  const [questionOverlays, setQuestionOverlays] = useState<QuestionOverlayDraft[]>([
    {
      questionText: '',
      showAtSeconds: 6,
      options: [
        { letter: 'A', text: '', dimensions: ['Realistic'], weight: 0.8 },
        { letter: 'B', text: '', dimensions: ['Investigative'], weight: 0.8 },
        { letter: 'C', text: '', dimensions: ['Artistic'], weight: 0.8 },
        { letter: 'D', text: '', dimensions: ['Social'], weight: 0.8 }
      ]
    }
  ]);

  // Auth & Permission check
  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profile || !profile.is_admin) {
          alert('Unauthorized. Admin privilege is required.');
          router.push('/assessment');
          return;
        }

        setIsAdmin(true);
        await loadAnalytics();
        await loadScenarios();
      } catch (err) {
        console.error('Admin check failed:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, [router]);

  const loadAnalytics = async () => {
    try {
      // 1. Total students count
      const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', false);

      // 2. Cheating sessions flagged count
      const { count: cheatCount } = await supabase
        .from('assessment_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_cheat_flagged', true);

      // 3. School vs College counts
      const { data: schools } = await supabase.from('profiles').select('id').eq('institution_type', 'School').eq('is_admin', false);
      const { data: colleges } = await supabase.from('profiles').select('id').eq('institution_type', 'College').eq('is_admin', false);

      // 4. Average response time from responses
      const { data: times } = await supabase.from('candidate_responses').select('response_time_ms');
      const avgTime = times && times.length > 0
        ? Math.round(times.reduce((sum, r) => sum + r.response_time_ms, 0) / times.length)
        : 0;

      // 5. Total scenarios count
      const { count: scCount } = await supabase.from('scenarios').select('*', { count: 'exact', head: true });

      setStats({
        totalStudents: studentCount || 0,
        cheatingSessions: cheatCount || 0,
        activeSchools: schools?.length || 0,
        activeColleges: colleges?.length || 0,
        avgResponseTime: avgTime,
        totalScenarios: scCount || 0
      });
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select(`
          *,
          questions (
            id, sequence_order, question_text, show_at_seconds,
            options (
              id, option_letter, option_text, target_dimension, intensity_weight
            )
          )
        `)
        .order('is_backup', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      setScenarios(data || []);
      if (data && data.length > 0 && !selectedScenarioId) {
        setSelectedScenarioId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  // Video File Uploader to Supabase psy-videos storage bucket
  const handleFileUpload = async () => {
    if (!videoFile) return null;
    setUploading(true);
    try {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `scenarios/${fileName}`;

      // Upload to 'psy-videos' bucket. Create bucket if missing fallback check.
      const { error: uploadError } = await supabase.storage
        .from('psy-videos')
        .upload(filePath, videoFile);

      if (uploadError) {
        // Attempt to create bucket dynamically
        await supabase.storage.createBucket('psy-videos', { public: true });
        const { error: retryError } = await supabase.storage
          .from('psy-videos')
          .upload(filePath, videoFile);
        if (retryError) throw retryError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('psy-videos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      alert('Video upload failed: ' + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Create Scenario Handler
  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let finalVideoUrl = newVideoUrl.trim();
    
    if (videoFile) {
      const uploadedUrl = await handleFileUpload();
      if (!uploadedUrl) return;
      finalVideoUrl = uploadedUrl;
    }

    if (!finalVideoUrl) {
      alert('Please specify a video URL or upload an MP4 file.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scenarios')
        .insert({
          title: newTitle,
          video_url: finalVideoUrl,
          target_age_group: targetAge,
          is_backup: isBackup
        })
        .select()
        .single();

      if (error) throw error;

      alert('Scenario created successfully!');
      setNewTitle('');
      setNewVideoUrl('');
      setVideoFile(null);
      await loadScenarios();
      if (data) setSelectedScenarioId(data.id);
    } catch (err: any) {
      alert('Failed to create scenario: ' + err.message);
    }
  };

  // Card management functions
  const handleAddCardDraft = () => {
    setQuestionOverlays(prev => [
      ...prev,
      {
        questionText: '',
        showAtSeconds: 6 + prev.length * 3,
        options: [
          { letter: 'A', text: '', dimensions: ['Realistic'], weight: 0.8 },
          { letter: 'B', text: '', dimensions: ['Investigative'], weight: 0.8 },
          { letter: 'C', text: '', dimensions: ['Artistic'], weight: 0.8 },
          { letter: 'D', text: '', dimensions: ['Social'], weight: 0.8 }
        ]
      }
    ]);
  };

  const handleRemoveCardDraft = (index: number) => {
    if (questionOverlays.length <= 1) return;
    setQuestionOverlays(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestionOverlays(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], questionText: text };
      return updated;
    });
  };

  const handleQuestionNumChange = (qIndex: number, key: keyof QuestionOverlayDraft, value: number) => {
    setQuestionOverlays(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], [key]: value } as any;
      return updated;
    });
  };

  const handleOptionChangeForCard = (qIndex: number, optIndex: number, key: string, value: any) => {
    setQuestionOverlays(prev => {
      const updated = [...prev];
      const updatedOptions = [...updated[qIndex].options];
      updatedOptions[optIndex] = { ...updatedOptions[optIndex], [key]: value };
      updated[qIndex] = { ...updated[qIndex], options: updatedOptions };
      return updated;
    });
  };

  const toggleDimension = (qIndex: number, optIndex: number, dimension: string) => {
    setQuestionOverlays(prev => {
      const updated = [...prev];
      const updatedOptions = [...updated[qIndex].options];
      const currentDims = updatedOptions[optIndex].dimensions;
      let newDims;
      if (currentDims.includes(dimension)) {
        newDims = currentDims.filter(d => d !== dimension);
      } else {
        newDims = [...currentDims, dimension];
      }
      updatedOptions[optIndex] = { ...updatedOptions[optIndex], dimensions: newDims };
      updated[qIndex] = { ...updated[qIndex], options: updatedOptions };
      return updated;
    });
  };

  // Append multiple Question Overlays Handler
  const handleAddQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScenarioId) return;

    // Validation
    for (let qIdx = 0; qIdx < questionOverlays.length; qIdx++) {
      const qDraft = questionOverlays[qIdx];
      if (!qDraft.questionText.trim()) {
        alert(`Please fill in the Question Prompt for card #${qIdx + 1}.`);
        return;
      }
      for (const opt of qDraft.options) {
        if (!opt.text.trim()) {
          alert(`Please fill in the text for Choice ${opt.letter} on question card #${qIdx + 1}.`);
          return;
        }
        if (opt.dimensions.length === 0) {
          alert(`Please select at least one RIASEC dimension for Choice ${opt.letter} on question card #${qIdx + 1}.`);
          return;
        }
      }
    }

    try {
      const scenario = scenarios.find(s => s.id === selectedScenarioId);
      let currentSeq = (scenario?.questions?.length || 0) + 1;

      for (let i = 0; i < questionOverlays.length; i++) {
        const qDraft = questionOverlays[i];

        // 1. Insert Question
        const { data: newQ, error: qError } = await supabase
          .from('questions')
          .insert({
            scenario_id: selectedScenarioId,
            sequence_order: currentSeq + i,
            question_text: qDraft.questionText.trim(),
            show_at_seconds: Number(qDraft.showAtSeconds) || 0
          })
          .select()
          .single();

        if (qError) throw qError;

        // 2. Insert Options
        const optionsData = qDraft.options.map(opt => ({
          question_id: newQ.id,
          option_letter: opt.letter,
          option_text: opt.text.trim(),
          target_dimension: opt.dimensions.join(', '),
          intensity_weight: Number(opt.weight)
        }));

        const { error: optError } = await supabase
          .from('options')
          .insert(optionsData);

        if (optError) throw optError;
      }

      alert('All question overlays and RIASEC options saved successfully!');
      setQuestionOverlays([
        {
          questionText: '',
          showAtSeconds: 6,
          options: [
            { letter: 'A', text: '', dimensions: ['Realistic'], weight: 0.8 },
            { letter: 'B', text: '', dimensions: ['Investigative'], weight: 0.8 },
            { letter: 'C', text: '', dimensions: ['Artistic'], weight: 0.8 },
            { letter: 'D', text: '', dimensions: ['Social'], weight: 0.8 }
          ]
        }
      ]);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to map question overlays: ' + err.message);
    }
  };

  const handleDeleteScenario = async (id: string) => {
    if (!confirm('Are you sure you want to delete this scenario? This will remove all associated questions and responses.')) return;
    try {
      const { error } = await supabase.from('scenarios').delete().eq('id', id);
      if (error) throw error;
      alert('Scenario deleted.');
      setSelectedScenarioId(null);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleStartEdit = (q: any) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.question_text);
    setEditShowAtSeconds(q.show_at_seconds || 0);
    const sortedOpts = [...(q.options || [])].sort((a: any, b: any) => a.option_letter.localeCompare(b.option_letter));
    setEditOptions(sortedOpts.map(opt => ({
      id: opt.id,
      letter: opt.option_letter,
      text: opt.option_text,
      dimensions: opt.target_dimension ? opt.target_dimension.split(',').map((d: string) => d.trim()).filter(Boolean) : [],
      weight: opt.intensity_weight
    })));
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditQuestionText('');
    setEditShowAtSeconds(6);
    setEditOptions([]);
  };

  const handleSaveQuestionEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;

    if (!editQuestionText.trim()) {
      alert('Question Prompt cannot be empty.');
      return;
    }
    for (const opt of editOptions) {
      if (!opt.text.trim()) {
        alert(`Option ${opt.letter} cannot be empty.`);
        return;
      }
      if (opt.dimensions.length === 0) {
        alert(`Option ${opt.letter} must have at least one Holland code dimension selected.`);
        return;
      }
    }

    try {
      const { error: qError } = await supabase
        .from('questions')
        .update({
          question_text: editQuestionText.trim(),
          show_at_seconds: Number(editShowAtSeconds) || 0
        })
        .eq('id', editingQuestionId);

      if (qError) throw qError;

      for (const opt of editOptions) {
        const { error: optError } = await supabase
          .from('options')
          .update({
            option_text: opt.text.trim(),
            target_dimension: opt.dimensions.join(', '),
            intensity_weight: Number(opt.weight)
          })
          .eq('id', opt.id);

        if (optError) throw optError;
      }

      alert('Question and options updated successfully!');
      setEditingQuestionId(null);
      setEditQuestionText('');
      setEditOptions([]);
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to update question: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will remove all associated responses.')) return;
    try {
      const { error } = await supabase.from('questions').delete().eq('id', qId);
      if (error) throw error;
      alert('Question deleted successfully.');
      await loadScenarios();
    } catch (err: any) {
      alert('Failed to delete question: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-teal-400 spinner mb-4" />
        <p className="text-zinc-500 tracking-wider text-xs uppercase">Initializing Console...</p>
      </div>
    );
  }

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="min-h-screen bg-[#050508] text-white flex flex-col md:flex-row mesh-gradient">
      
      {/* Side Control Column */}
      <div className="w-full md:w-64 bg-black/40 border-r border-zinc-900 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-teal-400" />
            <span className="text-lg font-bold tracking-wider">Psy<span className="text-teal-400">Metric</span> Console</span>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(0,245,212,0.15)]' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Analytics Desk
            </button>
            <button
              onClick={() => setActiveTab('scenarios')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'scenarios' 
                  ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 shadow-[0_0_15px_rgba(0,245,212,0.15)]' 
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent'
              }`}
            >
              <Settings className="w-4 h-4" /> Scenario Matrix
            </button>
          </div>
        </div>

        <button 
          onClick={() => router.push('/assessment')}
          className="w-full mt-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-semibold py-2.5 rounded-xl transition-all"
        >
          View Student Workspace
        </button>
      </div>

      {/* Main Workspace Column */}
      <div className="flex-1 p-8 overflow-y-auto max-h-screen">
        
        {/* Tab 1: Analytics Desk */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Analytics Desk</h1>
              <p className="text-zinc-400 text-sm">Real-time stats and test reliability audits.</p>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Evaluations</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.totalStudents}</span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Corrupted Flag Rate</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {stats.totalStudents > 0 ? Math.round((stats.cheatingSessions / stats.totalStudents) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-600/20 flex items-center justify-center text-teal-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Avg Click Latency</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.avgResponseTime}ms</span>
                </div>
              </div>

              <div className="glassmorphism p-5 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Scenarios</span>
                  <span className="text-xl font-bold font-mono text-white">{stats.totalScenarios}</span>
                </div>
              </div>

            </div>

            {/* Demographics Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="glassmorphism p-6 rounded-3xl">
                <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-teal-400" /> Education Level Metrics
                </h2>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400 uppercase">School Students</span>
                      <span>{stats.activeSchools}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${stats.totalStudents > 0 ? (stats.activeSchools / stats.totalStudents) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-400 uppercase">College Candidates</span>
                      <span>{stats.activeColleges}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400" style={{ width: `${stats.totalStudents > 0 ? (stats.activeColleges / stats.totalStudents) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="glassmorphism p-6 rounded-3xl flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                  <h3 className="font-bold text-white text-sm">Anti-Cheat Engine Performance</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The MIRT Engine monitors response pacing and flags speed patterns (&lt;1500ms). Flagged profiles are routed through 6 additional specialized backup scenarios to guarantee validity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Scenario Matrix Creator */}
        {activeTab === 'scenarios' && (
          <div className="space-y-8">
            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Scenario Matrix Builder</h1>
                <p className="text-zinc-400 text-sm font-semibold uppercase">Manage MP4 loop assets and map RIASEC intensities.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Creator Forms Column (Left 2/3 width) */}
              <div className="xl:col-span-2 space-y-8">
                
                {/* 1. Add New Scenario */}
                <div className="glassmorphism p-6 rounded-3xl">
                  <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-teal-400" /> 1. Create New Scenario
                  </h2>
                  <form onSubmit={handleCreateScenario} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Scenario Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Heavy Industrial Assembly Line"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Video Asset URL (Supabase storage or custom)</label>
                        <input
                          type="text"
                          placeholder="/videos/custom_assembly.mp4"
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Target Student Tier</label>
                        <select
                          value={targetAge}
                          onChange={(e) => setTargetAge(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400"
                        >
                          <option value="All">All Tiers</option>
                          <option value="School">School Only</option>
                          <option value="College">College Only</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 mt-4">
                        <input
                          type="checkbox"
                          id="is_backup_check"
                          checked={isBackup}
                          onChange={(e) => setIsBackup(e.target.checked)}
                          className="w-4.5 h-4.5 accent-teal-400 bg-black/40 border-zinc-800 rounded"
                        />
                        <label htmlFor="is_backup_check" className="text-zinc-400 font-semibold uppercase tracking-wider cursor-pointer">
                          Backup Scenario (Extension block)
                        </label>
                      </div>

                      {/* Drag & Drop File Selector */}
                      <div className="space-y-1">
                        <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Upload Video (Drag & Drop)</label>
                        <div className="relative border border-dashed border-zinc-800 rounded-xl p-3 bg-black/20 hover:bg-black/30 hover:border-zinc-700 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                          <Upload className="w-4 h-4 text-zinc-500" />
                          <span className="text-[10px] text-zinc-400">{videoFile ? videoFile.name : 'Select MP4...'}</span>
                          <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={uploading}
                      className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                      <span>Add Scenario to Database</span>
                    </button>
                  </form>
                </div>

                {/* 2. Map overlays to scenario */}
                {selectedScenario && (
                  <div className="space-y-8">
                    
                    {/* Existing Mapped Questions List */}
                    <div className="glassmorphism p-6 rounded-3xl">
                      <h2 className="text-base font-bold text-white mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Sliders className="w-5 h-5 text-teal-400" /> Active Questions in: <span className="text-teal-400 font-extrabold">{selectedScenario.title}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold">
                          {selectedScenario.questions?.length || 0} Mapped
                        </span>
                      </h2>

                      {selectedScenario.questions && selectedScenario.questions.length > 0 ? (
                        <div className="space-y-6">
                          {selectedScenario.questions
                            .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                            .map((q: any, qIdx: number) => {
                              const isEditing = editingQuestionId === q.id;
                              
                              if (isEditing) {
                                return (
                                  <form 
                                    key={q.id}
                                    onSubmit={handleSaveQuestionEdit}
                                    className="p-5 rounded-2xl bg-black/45 border border-teal-500/30 space-y-4 shadow-[0_0_15px_rgba(0,245,212,0.05)]"
                                  >
                                    <div className="flex justify-between items-center border-b border-zinc-900/40 pb-2">
                                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">
                                        Editing Question #{q.sequence_order || qIdx + 1}
                                      </span>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={handleCancelEdit}
                                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="submit"
                                          className="px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/35 text-teal-400 hover:bg-teal-500/25 hover:border-teal-500/50 text-[10px] font-bold transition-all shadow-[0_0_8px_rgba(0,245,212,0.1)] cursor-pointer"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                      <div className="md:col-span-3 space-y-1">
                                        <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Question Prompt</label>
                                        <textarea
                                          required
                                          rows={2}
                                          value={editQuestionText}
                                          onChange={(e) => setEditQuestionText(e.target.value)}
                                          className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Show at (seconds)</label>
                                        <input
                                          type="number"
                                          required
                                          min="0"
                                          max="300"
                                          value={editShowAtSeconds}
                                          onChange={(e) => setEditShowAtSeconds(Number(e.target.value))}
                                          className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 text-xs"
                                        />
                                      </div>
                                    </div>

                                    <div className="space-y-4">
                                      <h3 className="font-bold text-zinc-300 text-[10px] uppercase tracking-wider border-b border-zinc-900/40 pb-2">Map Choices (A, B, C, D)</h3>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {editOptions.map((opt, optIndex) => (
                                          <div key={opt.letter} className="p-4 rounded-2xl bg-black/20 border border-zinc-900 space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="font-bold text-teal-400 text-xs">Choice {opt.letter}</span>
                                            </div>

                                            <input
                                              type="text"
                                              required
                                              placeholder={`Text for option ${opt.letter}`}
                                              value={opt.text}
                                              onChange={(e) => {
                                                const updated = [...editOptions];
                                                updated[optIndex] = { ...updated[optIndex], text: e.target.value };
                                                setEditOptions(updated);
                                              }}
                                              className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-400 text-xs"
                                            />

                                            <div className="space-y-2">
                                              <label className="text-[9px] text-zinc-500 uppercase font-semibold block">Holland Code (Select Multiple)</label>
                                              <div className="flex flex-wrap gap-1.5">
                                                {[
                                                  { name: 'Realistic', code: 'R' },
                                                  { name: 'Investigative', code: 'I' },
                                                  { name: 'Artistic', code: 'A' },
                                                  { name: 'Social', code: 'S' },
                                                  { name: 'Enterprising', code: 'E' },
                                                  { name: 'Conventional', code: 'C' }
                                                ].map(dim => {
                                                  const isSelected = opt.dimensions.includes(dim.name);
                                                  return (
                                                    <button
                                                      key={dim.name}
                                                      type="button"
                                                      onClick={() => {
                                                        const updated = [...editOptions];
                                                        const currentDims = updated[optIndex].dimensions;
                                                        let newDims;
                                                        if (currentDims.includes(dim.name)) {
                                                          newDims = currentDims.filter((d: string) => d !== dim.name);
                                                        } else {
                                                          newDims = [...currentDims, dim.name];
                                                        }
                                                        updated[optIndex] = { ...updated[optIndex], dimensions: newDims };
                                                        setEditOptions(updated);
                                                      }}
                                                      className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all cursor-pointer ${
                                                        isSelected
                                                          ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_8px_rgba(0,245,212,0.1)]'
                                                          : 'bg-black/30 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                                                      }`}
                                                      title={dim.name}
                                                    >
                                                      {dim.code}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            <div className="space-y-1">
                                              <div className="flex justify-between items-center text-[9px] text-zinc-500">
                                                <span className="uppercase font-semibold">Intensity Weight</span>
                                                <span className="font-mono text-purple-400 font-bold">{opt.weight}</span>
                                              </div>
                                              <input
                                                type="range"
                                                min="0.1"
                                                max="1.0"
                                                step="0.05"
                                                value={opt.weight}
                                                onChange={(e) => {
                                                  const updated = [...editOptions];
                                                  updated[optIndex] = { ...updated[optIndex], weight: Number(e.target.value) };
                                                  setEditOptions(updated);
                                                }}
                                                className="w-full h-8 accent-teal-400"
                                              />
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </form>
                                );
                              }

                              return (
                                <div key={q.id} className="p-5 rounded-2xl bg-black/35 border border-zinc-900/60 space-y-4">
                                  <div className="flex justify-between items-start gap-4">
                                    <div>
                                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                                        Question Order #{q.sequence_order || qIdx + 1} {q.show_at_seconds !== undefined && `• Trigger at ${q.show_at_seconds}s`}
                                      </span>
                                      <h3 className="text-xs font-bold text-zinc-200 leading-relaxed">{q.question_text}</h3>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(q)}
                                        className="p-1.5 rounded-lg bg-teal-950/20 border border-teal-500/20 text-teal-400 hover:bg-teal-900/20 hover:text-teal-300 transition-colors shrink-0"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        className="p-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors shrink-0"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
                                    {(q.options || [])
                                      .sort((a: any, b: any) => a.option_letter.localeCompare(b.option_letter))
                                      .map((opt: any) => (
                                        <div key={opt.id} className="p-3 rounded-xl bg-black/20 border border-zinc-900 flex gap-2 items-start">
                                          <span className="w-5 h-5 rounded bg-zinc-950 border border-zinc-800 text-zinc-500 font-bold flex items-center justify-center shrink-0">
                                            {opt.option_letter}
                                          </span>
                                          <div className="space-y-1">
                                            <p className="text-zinc-300 font-medium leading-relaxed">{opt.option_text}</p>
                                            <div className="flex gap-2 items-center text-[9px]">
                                              <span className="text-teal-400 font-semibold">{opt.target_dimension}</span>
                                              <span className="text-zinc-600">•</span>
                                              <span className="text-purple-400 font-semibold">Weight: {opt.intensity_weight}</span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-zinc-500 text-xs">
                          No questions mapped to this scenario yet. Use the form below to add one.
                        </div>
                      )}
                    </div>                    {/* Add More Questions Form */}
                    <div className="glassmorphism p-6 rounded-3xl">
                      <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-teal-400" /> Map New Question Overlays
                      </h2>
                      
                      <form onSubmit={handleAddQuestions} className="space-y-8 text-xs">
                        {questionOverlays.map((qDraft, qIndex) => (
                          <div key={qIndex} className="p-6 rounded-3xl bg-black/45 border border-zinc-900/60 space-y-6 relative">
                            {questionOverlays.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveCardDraft(qIndex)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
                                  {qIndex + 1}
                                </span>
                                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                                  Overlay Card #{qIndex + 1}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              <div className="md:col-span-3 space-y-1">
                                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Question Prompt</label>
                                <textarea
                                  required
                                  rows={2}
                                  placeholder="e.g., The robotic gear motor jams during system testing. How do you respond?"
                                  value={qDraft.questionText}
                                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                                  className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">Show at (seconds)</label>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  max="300"
                                  placeholder="e.g., 6"
                                  value={qDraft.showAtSeconds || ''}
                                  onChange={(e) => handleQuestionNumChange(qIndex, 'showAtSeconds', Number(e.target.value))}
                                  className="w-full bg-black/40 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none focus:border-teal-400 text-xs"
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h3 className="font-bold text-zinc-300 border-b border-zinc-900/40 pb-2">Map Choices (A, B, C, D)</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {qDraft.options.map((opt, optIndex) => (
                                  <div key={opt.letter} className="p-4 rounded-2xl bg-black/20 border border-zinc-900 space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-teal-400">Choice {opt.letter}</span>
                                    </div>

                                    <input
                                      type="text"
                                      required
                                      placeholder={`Text for option ${opt.letter}`}
                                      value={opt.text}
                                      onChange={(e) => handleOptionChangeForCard(qIndex, optIndex, 'text', e.target.value)}
                                      className="w-full bg-black/40 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-teal-400"
                                    />

                                    <div className="space-y-2">
                                      <label className="text-[10px] text-zinc-500 uppercase font-semibold block">Holland Code (Select Multiple)</label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {[
                                          { name: 'Realistic', code: 'R' },
                                          { name: 'Investigative', code: 'I' },
                                          { name: 'Artistic', code: 'A' },
                                          { name: 'Social', code: 'S' },
                                          { name: 'Enterprising', code: 'E' },
                                          { name: 'Conventional', code: 'C' }
                                        ].map(dim => {
                                          const isSelected = opt.dimensions.includes(dim.name);
                                          return (
                                            <button
                                              key={dim.name}
                                              type="button"
                                              onClick={() => toggleDimension(qIndex, optIndex, dim.name)}
                                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                                isSelected
                                                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_8px_rgba(0,245,212,0.1)]'
                                                  : 'bg-black/30 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                                              }`}
                                              title={dim.name}
                                            >
                                              {dim.code}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] text-zinc-500 uppercase font-semibold block">Intensity Weight ({opt.weight})</label>
                                      <input
                                        type="range"
                                        min="0.1"
                                        max="1.0"
                                        step="0.05"
                                        value={opt.weight}
                                        onChange={(e) => handleOptionChangeForCard(qIndex, optIndex, 'weight', Number(e.target.value))}
                                        className="w-full h-8 accent-teal-400"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {qIndex === questionOverlays.length - 1 && (
                              <div className="flex justify-center pt-2">
                                <button
                                  type="button"
                                  onClick={handleAddCardDraft}
                                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 hover:border-teal-500/40 text-teal-400 text-xs font-bold transition-all shadow-md cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Another Overlay Card
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          type="submit"
                          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Save Overlay Questions & Dimensions</span>
                        </button>
                      </form>
                    </div>

                  </div>
                )}

              </div>

              {/* Scenarios List Column (Right 1/3 width) */}
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider block">
                  Scenarios Matrix
                </h2>
                
                <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
                  {scenarios.map((sc) => {
                    const isSelected = selectedScenarioId === sc.id;
                    const qCount = sc.questions?.length || 0;
                    return (
                      <div 
                        key={sc.id}
                        onClick={() => setSelectedScenarioId(sc.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start ${
                          isSelected 
                            ? 'bg-teal-500/10 border-teal-500 text-white shadow-[0_0_15px_rgba(0,245,212,0.1)]' 
                            : 'bg-black/40 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-xs text-white">{sc.title}</h3>
                            {sc.is_backup && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] font-bold uppercase tracking-wider">
                                Backup
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider line-clamp-1">{sc.video_url}</p>
                          <span className="text-[9px] text-zinc-500 flex items-center gap-1.5">
                            Active overlays: <strong className="text-zinc-300">{qCount}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScenario(sc.id);
                          }}
                          className="p-1.5 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
