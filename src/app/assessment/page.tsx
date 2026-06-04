'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, ChevronRight, Play, ArrowRight,
  TrendingUp, Award, AwardIcon, GraduationCap, Compass,
  BookOpen, BrainCircuit, ShieldAlert, RotateCcw, AlertTriangle, 
  HelpCircle, Clock, Check, Volume2, VolumeX
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  sequence_order: number;
  options: {
    id: string;
    option_letter: string;
    option_text: string;
  }[];
}

interface Scenario {
  id: string;
  title: string;
  video_url: string;
}

export default function AssessmentWorkspace() {
  const router = useRouter();
  
  // Session & User states
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Assessment flow states
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [progress, setProgress] = useState({ answered_scenarios: 0, total_scenarios: 12 });
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isCheatFlagged, setIsCheatFlagged] = useState(false);
  const [isExtended, setIsExtended] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Animation and speed tracking
  const [clickedOptionId, setClickedOptionId] = useState<string | null>(null);
  const [animatingExit, setAnimatingExit] = useState(false);
  const questionStartTime = useRef<number>(0);
  
  // Video cross-dissolve states
  const [videoA, setVideoA] = useState('/videos/drone_assembly.mp4');
  const [videoB, setVideoB] = useState('');
  const [activeVideoLayer, setActiveVideoLayer] = useState<'A' | 'B'>('A');
  const [videoError, setVideoError] = useState(false);
  const videoRefA = useRef<HTMLVideoElement>(null);
  const videoRefB = useRef<HTMLVideoElement>(null);

  // AI report states
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Video overlay state
  const [showOverlay, setShowOverlay] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const lastScenarioId = useRef<string | null>(null);

  // Check authentication & initialize session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Get user profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(prof);

        // Find or create assessment session
        const { data: activeSessions } = await supabase
          .from('assessment_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('is_completed', false)
          .order('created_at', { ascending: false });

        let sessionObj = activeSessions?.[0];

        if (!sessionObj) {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('assessment_sessions')
            .insert({ user_id: session.user.id })
            .select()
            .single();

          if (createError) throw createError;
          sessionObj = newSession;
        }

        setSessionId(sessionObj.id);
        setIsCheatFlagged(sessionObj.is_cheat_flagged);
        setIsExtended(sessionObj.is_extended);
        
        // Fetch first scenario and item
        await loadNextItem(sessionObj.id, null, null, 0);

      } catch (err) {
        console.error('Failed to initialize session:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [router]);

  // Synchronize overlay state based on scenario transitions
  useEffect(() => {
    if (currentScenario) {
      if (currentScenario.id !== lastScenarioId.current) {
        setShowOverlay(false);
        lastScenarioId.current = currentScenario.id;
        if (videoRefA.current) videoRefA.current.loop = false;
        if (videoRefB.current) videoRefB.current.loop = false;
      } else {
        setShowOverlay(true);
      }
    }
  }, [currentScenario]);

  const handleVideoEnded = () => {
    setShowOverlay(true);
    // Pause the video at the last frame
    if (activeVideoLayer === 'A' && videoRefA.current) {
      videoRefA.current.pause();
    } else if (activeVideoLayer === 'B' && videoRefB.current) {
      videoRefB.current.pause();
    }
  };

  const handleReplayVideo = () => {
    setShowOverlay(false);
    const activeVideo = activeVideoLayer === 'A' ? videoRefA.current : videoRefB.current;
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.play().catch((err) => {
        console.warn("Replay failed:", err);
      });
    }
  };

  // Load next scenario item from the API
  const loadNextItem = async (
    sId: string, 
    qId: string | null, 
    optId: string | null, 
    timeMs: number
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/assessment/next-item', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          session_id: sId,
          question_id: qId,
          selected_option_id: optId,
          response_time_ms: timeMs
        })
      });

      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setIsCheatFlagged(data.is_cheat_flagged);
      setIsExtended(data.is_extended);

      if (data.is_completed) {
        setIsCompleted(true);
        setCurrentScenario(null);
        setCurrentQuestion(null);
        await generatePsychologyReport(sId);
      } else {
        // Handle background video cross-dissolve if video_url changed
        const newVideoUrl = data.current_scenario.video_url;
        handleVideoTransition(newVideoUrl);

        setCurrentScenario(data.current_scenario);
        setCurrentQuestion(data.current_question);
        setProgress(data.progress);
        setSelectedOptionId(null);
        setClickedOptionId(null);
        questionStartTime.current = Date.now();
      }
    } catch (err) {
      console.error('Error loading next item:', err);
    }
  };

  // Dual-layer cross-dissolve transition logic
  const handleVideoTransition = (newUrl: string) => {
    setVideoError(false);
    if (activeVideoLayer === 'A') {
      if (videoA !== newUrl) {
        setVideoB(newUrl);
        setActiveVideoLayer('B');
      }
    } else {
      if (videoB !== newUrl) {
        setVideoA(newUrl);
        setActiveVideoLayer('A');
      }
    }
  };

  // Sync volume, play state, loop for background video elements
  useEffect(() => {
    if (activeVideoLayer === 'A' && videoRefA.current) {
      videoRefA.current.load();
      videoRefA.current.play().catch(() => setVideoError(true));
    } else if (activeVideoLayer === 'B' && videoRefB.current) {
      videoRefB.current.load();
      videoRefB.current.play().catch(() => setVideoError(true));
    }
  }, [activeVideoLayer, videoA, videoB]);

  // Submit response trigger
  const handleOptionSelect = async (optionId: string) => {
    if (clickedOptionId || animatingExit) return;

    // Trigger haptic click style animation
    setClickedOptionId(optionId);
    setSelectedOptionId(optionId);
    
    // Calculate response time
    const timeSpent = Date.now() - questionStartTime.current;

    // Wait for the button pulse animation before rotating the card out
    setTimeout(() => {
      setAnimatingExit(true);
      
      // Complete card Z-axis rotate transition
      setTimeout(async () => {
        setAnimatingExit(false);
        if (sessionId && currentQuestion) {
          await loadNextItem(sessionId, currentQuestion.id, optionId, timeSpent);
        }
      }, 500); // exit duration
    }, 450); // button pulse duration
  };

  // AI-Report generation process
  const generatePsychologyReport = async (sId: string) => {
    setGeneratingReport(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/assessment/generate-report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ session_id: sId })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setReport(data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Reset Session (for demo testing convenience)
  const handleResetSession = async () => {
    if (!confirm('Are you sure you want to delete current session and start a new evaluation?')) return;
    setLoading(true);
    setReport(null);
    setIsCompleted(false);
    
    try {
      if (sessionId) {
        await supabase.from('candidate_responses').delete().eq('session_id', sessionId);
        await supabase.from('assessment_sessions').delete().eq('id', sessionId);
      }
      
      // Trigger reload to create fresh session
      window.location.reload();
    } catch (err) {
      console.error('Failed to reset:', err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-white">
        <BrainCircuit className="w-12 h-12 text-purple-500 spinner mb-4" />
        <p className="text-zinc-400 tracking-wider text-sm">LOADING ASSESSMENT WORKSPACE...</p>
      </div>
    );
  }

  // ─── RENDER REPORT VIEW ───
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-[#050508] text-white py-12 px-4 sm:px-6 lg:px-8 mesh-gradient overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
            <div className="flex items-center gap-2">
              <Compass className="w-8 h-8 text-teal-400" />
              <h1 className="text-2xl font-bold tracking-wider">Psy<span className="text-teal-400">Metric</span> Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResetSession}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-Evaluate
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-900/10 border border-red-500/20 hover:bg-red-900/20 hover:border-red-500/40 text-xs font-semibold text-red-300 transition-all active:scale-95"
              >
                Exit Portal
              </button>
            </div>
          </div>

          {generatingReport ? (
            <div className="glassmorphism p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-6 min-h-[500px]">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 border-t-purple-500 spinner" />
                <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-teal-400 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-wide text-white">Synthesizing Psychometric Profile</h2>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Gemini 1.5 Pro is compiling your adaptive response vectors as a Senior Educational Psychologist...
                </p>
              </div>
            </div>
          ) : report ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Left & Mid Columns (2/3 width) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Holland Codes Visualizer */}
                <div className="glassmorphism p-8 rounded-3xl">
                  <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-teal-400" /> Calculated Holland Spectrum (RIASEC)
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(report.holland_percentages).map(([dim, val]: any) => {
                      const colors: Record<string, string> = {
                        Realistic: 'bg-red-500',
                        Investigative: 'bg-blue-500',
                        Artistic: 'bg-purple-500',
                        Social: 'bg-green-500',
                        Enterprising: 'bg-amber-500',
                        Conventional: 'bg-teal-500'
                      };
                      return (
                        <div key={dim} className="space-y-1.5">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-zinc-300">{dim}</span>
                            <span className="text-zinc-400 font-mono">{val}%</span>
                          </div>
                          <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden p-[1px] border border-zinc-800">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className={`h-full rounded-full ${colors[dim] || 'bg-zinc-600'} shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Psychologist Summary */}
                <div className="glassmorphism p-8 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent -z-10" />
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-teal-400" /> Educational Psychologist Diagnosis
                  </h2>
                  <div className="text-zinc-300 text-sm leading-relaxed space-y-4 whitespace-pre-line">
                    {report.psychologist_summary}
                  </div>
                  {isCheatFlagged && (
                    <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-amber-900/10 border border-amber-500/20 text-amber-300 text-xs">
                      <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                      <span>
                        Note: Assessment logs triggered the data integrity engine. Response patterns showed anomalies, and assessment was dynamically extended to resolve confidence limits.
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column (1/3 width) */}
              <div className="space-y-8">
                
                {/* Operational Modes */}
                <div className="glassmorphism p-8 rounded-3xl text-center">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 text-left">
                    Operational Modes
                  </h2>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(report.operational_modes).map(([mode, val]: any) => {
                      const title = mode.replace('_', ' ');
                      return (
                        <div key={mode} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-black/40 border border-zinc-900">
                          <span className="text-lg font-bold text-teal-400 font-mono">{val}%</span>
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider text-center line-clamp-1">{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Career Paths */}
                <div className="space-y-4">
                  <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                    Recommended High-Growth Pathways
                  </h2>
                  {report.career_recommendations.map((career: any, index: number) => (
                    <motion.div 
                      key={career.title}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="glassmorphism p-5 rounded-2xl border-l-4 border-l-purple-500 hover:border-l-teal-400 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-white text-sm">{career.title}</h3>
                          <span className="text-[10px] font-semibold text-purple-400">{career.field}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                          Match: {career.suitability_score}%
                        </div>
                      </div>
                      <p className="text-zinc-400 text-xs mb-3 line-clamp-2 leading-relaxed">{career.description}</p>
                      
                      <div className="space-y-1.5 border-t border-zinc-900 pt-3 text-[10px]">
                        <div className="flex items-start gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-400"><strong className="text-zinc-300">Growth:</strong> {career.growth_rate}</span>
                        </div>
                        <div className="flex items-start gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="text-zinc-400"><strong className="text-zinc-300">Education:</strong> {career.education_path}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

              </div>

            </motion.div>
          ) : (
            <div className="glassmorphism p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-4">
              <AlertTriangle className="w-12 h-12 text-amber-500" />
              <p className="text-zinc-300">Failed to render psychoanalysis report. Please reset and run the test again.</p>
              <button 
                onClick={handleResetSession}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold"
              >
                Restart Test
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ─── ASSESSMENT WORKSPACE SCREEN ───
  return (
    <div className="relative min-h-screen w-full bg-[#030303] overflow-hidden">
      
      {/* ─── Cinematic Video Player (100% viewport coverage) ─── */}
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden scanlines">
        
        {/* Layer Video A */}
        <video
          ref={videoRefA}
          src={videoA || undefined}
          autoPlay
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnded}
          onError={() => {
            setVideoError(true);
            setShowOverlay(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeVideoLayer === 'A' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        />

        {/* Layer Video B */}
        <video
          ref={videoRefB}
          src={videoB || undefined}
          autoPlay
          playsInline
          muted={isMuted}
          onEnded={handleVideoEnded}
          onError={() => {
            setVideoError(true);
            setShowOverlay(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            activeVideoLayer === 'B' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        />

        {/* Cinematic Ambient Overlay / Error Fallback */}
        {(videoError || !currentScenario) && (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-zinc-950 via-[#100c14] to-zinc-950 flex flex-col items-center justify-center -z-10">
            <div className="absolute inset-0 mesh-gradient opacity-40 animate-pulse" />
            <BrainCircuit className="w-16 h-16 text-purple-600/30 animate-pulse" />
          </div>
        )}

        {/* Dark Ambient Overlays to isolate floating cards */}
        <div className="absolute inset-0 bg-black/10 z-20 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent z-20 pointer-events-none" />

        {/* Branding & Scenario Tag (Top Left) */}
        <div className="absolute top-6 left-6 z-30 flex items-center gap-2 pointer-events-none">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 backdrop-blur-md border border-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-purple-400" />
          </div>
          <span className="text-sm font-bold tracking-wider text-white bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
            PsyMetric Workspace
          </span>
        </div>

        <div className="absolute bottom-6 left-6 z-30 flex flex-col gap-3 items-start">
          {/* Mute/Unmute floating button */}
          <button
            type="button"
            onClick={() => setIsMuted(prev => !prev)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/55 backdrop-blur-md border border-white/10 hover:bg-black/75 hover:border-white/20 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer pointer-events-auto shadow-lg"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-red-400" />
                <span>Unmute Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Mute Audio</span>
              </>
            )}
          </button>

          {currentScenario && (
            <div className="max-w-md pointer-events-none">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">
                Active Context
              </span>
              <h2 className="text-lg md:text-xl font-extrabold text-white bg-black/45 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 inline-block">
                {currentScenario.title}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* ─── FLOATING OVERLAY PANEL (Part of the Video space on top of it) ─── */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
            className="absolute right-0 top-0 bottom-0 w-full md:w-[450px] flex flex-col justify-between p-6 md:p-8 bg-black/35 backdrop-blur-xl border-l border-white/10 z-30"
          >
            {/* User Info Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div>
                <h3 className="font-bold text-sm text-white line-clamp-1">{profile?.full_name || 'Student User'}</h3>
                <span className="text-[10px] text-zinc-400 font-semibold">{profile?.age_tier} • {profile?.institution_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={handleReplayVideo}
                  className="flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 border border-teal-500/20 px-2.5 py-1 rounded-lg transition-colors bg-teal-500/10 hover:bg-teal-500/20"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Replay Video</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-[10px] text-zinc-400 hover:text-white border border-white/10 px-2.5 py-1 rounded-lg transition-colors bg-white/5 hover:bg-white/10"
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* Question Overlay Card */}
            <div className="flex-1 flex items-center justify-center py-8">
              <AnimatePresence mode="wait">
                {currentQuestion && !animatingExit && (
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, rotateY: 90, scale: 0.95 }}
                    animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      rotateZ: -20, 
                      scale: 0.9,
                      transition: { duration: 0.45, ease: 'easeInOut' }
                    }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 100, 
                      damping: 15,
                      duration: 0.6
                    }}
                    className="w-full glassmorphism p-6 rounded-3xl relative overflow-hidden"
                  >
                    {/* Back card border neon tint */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500/30 to-teal-400/30" />

                    {/* Progress Indicators */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" /> Loop {progress.answered_scenarios + 1}
                      </span>
                      <span>Scenario {progress.answered_scenarios + 1} of {progress.total_scenarios}</span>
                    </div>

                    {/* Question */}
                    <h1 className="text-base md:text-lg font-bold text-white mb-6 leading-relaxed">
                      {currentQuestion.question_text}
                    </h1>

                    {/* Option Buttons */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((opt) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isClicked = clickedOptionId === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionSelect(opt.id)}
                            disabled={clickedOptionId !== null}
                            className={`w-full text-left p-4 rounded-2xl border transition-all text-xs leading-relaxed relative flex items-center gap-3 overflow-hidden ${
                              isClicked 
                                ? 'bg-purple-600/40 border-purple-500 shadow-[0_0_15px_rgba(157,78,221,0.3)] text-white scale-[0.98] animate-haptic' 
                                : isSelected
                                ? 'bg-purple-600/20 border-purple-500 text-white'
                                : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center shrink-0 ${
                              isClicked
                                ? 'bg-purple-500 text-white'
                                : 'bg-zinc-900 text-zinc-500 border border-white/5'
                            }`}>
                              {opt.option_letter}
                            </span>
                            <span>{opt.option_text}</span>
                            
                            {isClicked && (
                              <div className="absolute right-4">
                                <Check className="w-4 h-4 text-teal-400" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Progress */}
            <div className="space-y-4">
              
              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  <span>Overall Progress</span>
                  <span>{Math.round((progress.answered_scenarios / progress.total_scenarios) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-teal-400 transition-all duration-500"
                    style={{ width: `${(progress.answered_scenarios / progress.total_scenarios) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 animate-pulse" /> Pick option closest to instinct
                </span>
                {isExtended && (
                  <span className="flex items-center gap-1.5 text-amber-500/85 font-bold uppercase tracking-wider animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" /> Extension Active (+6 scenarios)
                  </span>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
