'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, CheckCircle2, ChevronRight, Play, ArrowRight,
  TrendingUp, Award, AwardIcon, GraduationCap, Compass,
  BookOpen, BrainCircuit, ShieldAlert, RotateCcw, AlertTriangle, 
  HelpCircle, Clock, Check, Volume2, VolumeX, Loader2, Building
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  sequence_order: number;
  timer_duration?: number;
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
  const [videoA, setVideoA] = useState('');
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
  const hasTriggeredRef = useRef(false);

  // Timer States
  const [timeLeft, setTimeLeft] = useState(15);
  const [isExpired, setIsExpired] = useState(false);

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

  // Procedural Sound Synthesis using Web Audio API
  const playChimeSound = (type: 'open' | 'close' | 'error') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'open') {
        // Sci-fi Glass swoosh filter sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.45);

        // Chime chime ring
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'triangle';
        bell.frequency.setValueAtTime(1440, ctx.currentTime + 0.22);

        bellGain.gain.setValueAtTime(0.001, ctx.currentTime + 0.22);
        bellGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.24);
        bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

        bell.connect(bellGain);
        bellGain.connect(ctx.destination);

        bell.start(ctx.currentTime + 0.22);
        bell.stop(ctx.currentTime + 0.6);
      } else if (type === 'close') {
        // Dynamic slide down confirm
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.28);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.28);
      } else if (type === 'error') {
        // Double detuned sawtooth warning buzzer
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc2.frequency.setValueAtTime(112, ctx.currentTime);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.35);
        osc2.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  };

  // Synchronize overlay state based on scenario transitions
  useEffect(() => {
    if (currentScenario) {
      if (currentScenario.id !== lastScenarioId.current) {
        setShowOverlay(false);
        lastScenarioId.current = currentScenario.id;
        setIsExpired(false);
        setTimeLeft(12);
        hasTriggeredRef.current = false;

        if (videoRefA.current) {
          videoRefA.current.playbackRate = 1.0;
          videoRefA.current.loop = false;
        }
        if (videoRefB.current) {
          videoRefB.current.playbackRate = 1.0;
          videoRefB.current.loop = false;
        }
      }
    }
  }, [currentScenario]);

  // Fluid decelerating video pause trigger
  const triggerOverlayAndPause = (video: HTMLVideoElement) => {
    if (showOverlay) return;
    setShowOverlay(true);
    playChimeSound('open');

    let rate = 1.0;
    const decelerate = () => {
      rate -= 0.12;
      if (rate <= 0.12) {
        video.playbackRate = 1.0; // Restore to normal speed so it plays normally next time
        video.pause();
      } else {
        video.playbackRate = rate;
        requestAnimationFrame(decelerate);
      }
    };
    requestAnimationFrame(decelerate);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (!video || !currentQuestion) return;

    const showAt = (currentQuestion as any).show_at_seconds || 0;
    if (showAt > 0 && video.currentTime >= showAt && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      triggerOverlayAndPause(video);
    }
  };

  const handleVideoEnded = () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    if (activeVideoLayer === 'A' && videoRefA.current) {
      triggerOverlayAndPause(videoRefA.current);
    } else if (activeVideoLayer === 'B' && videoRefB.current) {
      triggerOverlayAndPause(videoRefB.current);
    }
  };

  const handleReplayVideo = () => {
    setShowOverlay(false);
    setIsExpired(false);
    setTimeLeft(12);
    hasTriggeredRef.current = false;
    const activeVideo = activeVideoLayer === 'A' ? videoRefA.current : videoRefB.current;
    if (activeVideo) {
      activeVideo.currentTime = 0;
      activeVideo.playbackRate = 1.0;
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
        const isSameScenario = currentScenario && currentScenario.id === data.current_scenario.id;
        handleVideoTransition(newVideoUrl);

        setCurrentScenario(data.current_scenario);
        setCurrentQuestion(data.current_question);
        setProgress(data.progress);
        setSelectedOptionId(null);
        setClickedOptionId(null);
        setShowOverlay(false);
        setIsExpired(false);
        setTimeLeft(12);
        hasTriggeredRef.current = false;
        questionStartTime.current = Date.now();

        // If it's the same scenario, resume video playback
        if (isSameScenario) {
          const activeVideo = activeVideoLayer === 'A' ? videoRefA.current : videoRefB.current;
          if (activeVideo) {
            activeVideo.playbackRate = 1.0;
            activeVideo.loop = false;
            activeVideo.play().catch(err => {
              console.warn("Failed to resume video:", err);
            });
          }
        }
      }
    } catch (err) {
      console.error('Error loading next item:', err);
    }
  };

  // Dual-layer cross-dissolve transition logic
  const handleVideoTransition = (newUrl: string) => {
    setVideoError(false);
    if (!videoA) {
      setVideoA(newUrl);
      setActiveVideoLayer('A');
    } else if (activeVideoLayer === 'A') {
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
    const playVideo = async (videoEl: HTMLVideoElement) => {
      try {
        videoEl.load();
        await videoEl.play();
      } catch (err) {
        console.warn("Autoplay blocked or playback error, falling back to muted:", err);
        setIsMuted(true);
        videoEl.muted = true;
        try {
          await videoEl.play();
        } catch (retryErr) {
          console.error("Muted playback failed as well:", retryErr);
          setVideoError(true);
        }
      }
    };

    if (activeVideoLayer === 'A' && videoRefA.current) {
      playVideo(videoRefA.current);
    } else if (activeVideoLayer === 'B' && videoRefB.current) {
      playVideo(videoRefB.current);
    }
  }, [activeVideoLayer, videoA, videoB]);

  // Submit response trigger
  const handleOptionSelect = async (optionId: string) => {
    if (clickedOptionId || animatingExit || isExpired) return;

    playChimeSound('close');
    setClickedOptionId(optionId);
    setSelectedOptionId(optionId);
    
    // Calculate response time
    const timeSpent = Date.now() - questionStartTime.current;

    // Start loading the next item immediately in parallel with the animations
    const loadPromise = (async () => {
      if (sessionId && currentQuestion) {
        return loadNextItem(sessionId, currentQuestion.id, optionId, timeSpent);
      }
    })();

    // Wait for the button pulse animation before rotating the card out and sliding out the overlay
    setTimeout(() => {
      setAnimatingExit(true);
      setShowOverlay(false);
      
      // Complete card Z-axis rotate transition
      setTimeout(async () => {
        await loadPromise;
        setAnimatingExit(false);
      }, 500); // exit duration
    }, 450); // button pulse duration
  };

  // Timer countdown hook
  useEffect(() => {
    if (!showOverlay || !currentQuestion || isCompleted || animatingExit) return;

    const totalDuration = currentQuestion.timer_duration || 15;
    setTimeLeft(totalDuration);
    setIsExpired(false);

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showOverlay, currentQuestion, isCompleted, animatingExit]);

  // Expiration handler: shakes whole question card with red background, buzzer sound, submits blank response
  const handleTimeExpired = () => {
    setIsExpired(true);
    playChimeSound('error');

    const totalDuration = currentQuestion?.timer_duration || 15;

    // Start loading the next item immediately in parallel with the exit delay/shake animations
    const loadPromise = (async () => {
      if (sessionId && currentQuestion) {
        return loadNextItem(sessionId, currentQuestion.id, null, totalDuration * 1000);
      }
    })();

    setTimeout(() => {
      setAnimatingExit(true);
      setShowOverlay(false);
      setTimeout(async () => {
        await loadPromise;
        setAnimatingExit(false);
        setIsExpired(false);
      }, 500);
    }, 1000);
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
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-white animate-fade-in">
        <img 
          src="/psymetric-icon.png" 
          alt="PsyMetric Icon" 
          className="w-12 h-12 object-contain mb-4 animate-pulse"
        />
        <Loader2 className="w-5 h-5 text-teal-400 animate-spin mb-2" />
        <p className="text-zinc-500 tracking-wider text-[10px] uppercase font-bold">Loading Assessment Workspace...</p>
      </div>
    );
  }

  // ─── RENDER REPORT VIEW ───
  if (isCompleted) {
    // Determine dominant personality traits for title
    const sortedTraits = Object.entries(report?.holland_percentages || {})
      .sort((a: any, b: any) => b[1] - a[1])
      .map(entry => entry[0]);

    const primaryTrait = sortedTraits[0] || 'The Thinker';
    const secondaryTrait = sortedTraits[1] || 'The Creator';
    const characterTitle = `${primaryTrait.replace('The ', '')}-${secondaryTrait.replace('The ', '')} Hybrid`;

    // Radar chart dimensions
    const cx = 150;
    const cy = 150;
    const maxRadius = 100;
    
    // Axes definition
    const axes = [
      { name: 'The Builder', color: '#ef4444' }, // Red
      { name: 'The Thinker', color: '#3b82f6' }, // Blue
      { name: 'The Creator', color: '#a855f7' }, // Purple
      { name: 'The Connector', color: '#22c55e' }, // Green
      { name: 'The Leader', color: '#f59e0b' }, // Amber
      { name: 'The Organizer', color: '#14b8a6' } // Teal
    ];

    // Calculate radar polygon points
    const points = axes.map((axis, i) => {
      const percentage = (report?.holland_percentages?.[axis.name] || 50) / 100;
      const r = percentage * maxRadius;
      const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      return { x, y, name: axis.name, score: Math.round(percentage * 100) };
    });

    const polygonPointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="min-h-screen bg-[#05050c] text-white py-8 px-4 sm:px-6 lg:px-8 mesh-gradient overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex items-center justify-between border-b border-zinc-900 pb-6">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
              <img 
                src="/psymetric-logo.png" 
                alt="PsyMetric Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleResetSession}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.02)]"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-Evaluate
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 rounded-xl bg-purple-950/20 border border-purple-500/20 hover:bg-purple-900/20 hover:border-purple-500/40 text-xs font-semibold text-purple-400 transition-all active:scale-95"
              >
                Dashboard Hub
              </button>
            </div>
          </header>

          {generatingReport ? (
            <div className="glassmorphism p-16 rounded-3xl text-center flex flex-col items-center justify-center gap-6 min-h-[500px]">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 border-t-purple-500 spinner animate-spin" />
                <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-teal-400 animate-pulse" />
              </div>
              <div className="space-y-2 animate-pulse">
                <h2 className="text-xl font-bold tracking-wide text-white">Synthesizing Quest Results</h2>
                <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                  Compiling 6D character attributes and generating psychologist feedback loops...
                </p>
              </div>
            </div>
          ) : report ? (
            <div className="space-y-8">
              
              {/* ──── HERO SECTION (CHARACTER CARD) ──── */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glassmorphism p-6 rounded-3xl relative overflow-hidden border border-purple-500/10"
              >
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-purple-500/5 to-transparent -z-10" />
                
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Glowing Avatar */}
                  <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-teal-400 p-[2px] shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                    <div className="w-full h-full rounded-2xl bg-[#090915] flex items-center justify-center overflow-hidden">
                      <Sparkles className="w-10 h-10 text-teal-300 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400">
                      LVL 3
                    </div>
                  </div>

                  {/* Character Details */}
                  <div className="flex-1 text-center md:text-left space-y-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase">Student Profile</span>
                      <h2 className="text-2xl font-black tracking-wide text-white">{profile?.full_name || 'Jane Doe'}</h2>
                      <p className="text-sm text-teal-300 font-semibold flex items-center justify-center md:justify-start gap-1">
                        <GraduationCap className="w-4 h-4" /> {characterTitle}
                      </p>
                    </div>

                    {/* XP Progress Bar */}
                    <div className="space-y-1 max-w-md">
                      <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase">
                        <span>Experience (XP)</span>
                        <span>420 / 600 XP</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-teal-400" style={{ width: '70%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Cohort Crest Badge */}
                  <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-900 flex items-center gap-3">
                    <Building className="w-8 h-8 text-zinc-600" />
                    <div className="text-left text-xs">
                      <span className="font-bold block text-white">{profile?.school_name || 'DAV Public School'}</span>
                      <span className="text-zinc-500">Class {profile?.class || '10'}-{profile?.section || 'A'} {profile?.stream ? `• ${profile?.stream}` : ''}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ──── COLUMNS GRID ──── */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT & MID COLUMNS (8/12 width) */}
                <div className="lg:col-span-8 space-y-8">
                  
                  {/* Radar Constellation & Scatter Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Personality Constellation (Radar Chart) */}
                    <div className="glassmorphism p-6 rounded-3xl flex flex-col justify-between items-center min-h-[350px]">
                      <h3 className="w-full text-xs font-bold text-zinc-400 uppercase tracking-widest text-left mb-4 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" /> Character Constellation
                      </h3>
                      
                      <div className="relative w-64 h-64">
                        <svg className="w-full h-full" viewBox="0 0 300 300">
                          {/* Inner concentric hexagons */}
                          {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, sIdx) => {
                            const r = scale * maxRadius;
                            const hexagonPoints = axes.map((_, i) => {
                              const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                              const x = cx + r * Math.cos(angle);
                              const y = cy + r * Math.sin(angle);
                              return `${x},${y}`;
                            }).join(' ');
                            
                            return (
                              <polygon
                                key={sIdx}
                                points={hexagonPoints}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {/* Constellation Axis lines */}
                          {axes.map((_, i) => {
                            const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                            const x = cx + maxRadius * Math.cos(angle);
                            const y = cy + maxRadius * Math.sin(angle);
                            return (
                              <line
                                key={i}
                                x1={cx}
                                y1={cy}
                                x2={x}
                                y2={y}
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="1.5"
                              />
                            );
                          })}

                          {/* Calculated glowing polygon */}
                          <polygon
                            points={polygonPointsString}
                            fill="rgba(168, 85, 247, 0.15)"
                            stroke="rgba(168, 85, 247, 0.6)"
                            strokeWidth="2.5"
                            className="drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                          />

                          {/* Vertex Nodes */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="5"
                                fill={axes[i].color}
                                className="cursor-pointer"
                              />
                              <text
                                x={cx + 1.25 * maxRadius * Math.cos((i * 2 * Math.PI) / 6 - Math.PI / 2)}
                                y={cy + 1.2 * maxRadius * Math.sin((i * 2 * Math.PI) / 6 - Math.PI / 2) + 4}
                                fill="#a1a1aa"
                                fontSize="9"
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {p.name.replace('The ', '')}
                              </text>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>

                    {/* Skill-Interest Matrix (Scatter Plot) */}
                    <div className="glassmorphism p-6 rounded-3xl flex flex-col justify-between min-h-[350px]">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-teal-400" /> Skill-Interest Matrix
                      </h3>
                      
                      {/* Scatter Plot Visualizer */}
                      <div className="relative w-full h-56 bg-black/40 border border-zinc-900 rounded-2xl overflow-hidden p-4">
                        {/* Sweet Spot Quadrant Glow */}
                        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-teal-500/5 border-l border-b border-zinc-800/80 rounded-bl-xl" />
                        <div className="absolute top-2 right-2 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
                          🎯 Sweet Spot
                        </div>
                        <div className="absolute bottom-2 left-2 text-[8px] text-zinc-600 font-bold uppercase">
                          Aptitude ➔
                        </div>
                        <div className="absolute top-2 left-2 text-[8px] text-zinc-600 font-bold uppercase origin-top-left rotate-90 translate-x-1">
                          Interest ➔
                        </div>

                        {/* Plotted Career Dots */}
                        <div className="absolute top-[20%] right-[25%] flex flex-col items-center group">
                          <span className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-pulse border-2 border-[#030303] shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
                          <span className="text-[8px] text-white font-bold bg-[#090915] px-1.5 py-0.5 rounded border border-zinc-800 mt-1">UAV Architect</span>
                        </div>
                        
                        <div className="absolute top-[35%] right-[45%] flex flex-col items-center">
                          <span className="w-3 h-3 rounded-full bg-purple-500 border-2 border-[#030303] shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                          <span className="text-[8px] text-white font-bold bg-[#090915] px-1.5 py-0.5 rounded border border-zinc-800 mt-1">AI Systems</span>
                        </div>

                        <div className="absolute top-[60%] left-[30%] flex flex-col items-center">
                          <span className="w-3 h-3 rounded-full bg-zinc-600 border border-[#030303]" />
                          <span className="text-[8px] text-zinc-500 font-semibold mt-1">Robotics Control</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Psychologist Feedback */}
                  <div className="glassmorphism p-8 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/10 to-transparent -z-10" />
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 border-b border-zinc-900 pb-3">
                      <BookOpen className="w-5 h-5 text-teal-400" /> Educational Psychologist Diagnosis
                    </h3>
                    <div className="text-zinc-300 text-xs leading-relaxed space-y-4 whitespace-pre-line">
                      {report.psychologist_summary}
                    </div>
                  </div>

                  {/* Career Skill Tree */}
                  <div className="glassmorphism p-6 rounded-3xl">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-purple-400" /> Career Skill Tree Explorer
                    </h3>

                    {/* Skill Tree Graphic representation */}
                    <div className="relative min-h-[220px] bg-black/30 border border-zinc-900 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-around gap-6">
                      
                      {/* Central Character Node */}
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-teal-400 p-[2px] flex items-center justify-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                          <div className="w-full h-full rounded-full bg-[#05050c] flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-300" />
                          </div>
                        </div>
                        <span className="text-[10px] text-purple-300 font-extrabold uppercase mt-2 tracking-wider">Your Core</span>
                      </div>

                      {/* Line connector decoration */}
                      <div className="hidden md:block absolute left-1/3 right-1/3 h-[2px] bg-gradient-to-r from-purple-500/30 to-teal-500/30 -z-10" />

                      {/* Pathway Recommendations */}
                      <div className="flex flex-col gap-4 w-full md:w-auto">
                        {report.career_recommendations.map((c: any) => (
                          <div 
                            key={c.title}
                            className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-900 hover:border-teal-500/40 transition-all text-left flex justify-between items-center"
                          >
                            <div>
                              <h5 className="text-xs font-black text-white">{c.title}</h5>
                              <span className="text-[9px] text-zinc-500 font-semibold">{c.field}</span>
                            </div>
                            <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono font-bold">
                              {c.suitability_score}% Match
                            </span>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                </div>

                {/* RIGHT SIDEBAR COLUMN (4/12 width) */}
                <div className="lg:col-span-4 space-y-8">
                  
                  {/* Credits Widget */}
                  <div className="glassmorphism p-6 rounded-3xl relative overflow-hidden text-center bg-gradient-to-b from-purple-950/20 to-transparent">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-4">Assessment Credits</span>
                    
                    <div className="py-6 border-y border-dashed border-zinc-800 space-y-1">
                      <span className="text-4xl font-black font-mono text-white tracking-tighter">1</span>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Assessment Remaining</p>
                    </div>

                    <button 
                      onClick={() => alert('Individual credit top-up integrations (Razorpay UPI/Card) will launch shortly in sandbox.')}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    >
                      🎟️ Buy Additional Credits
                    </button>
                  </div>

                  {/* Achievements wall */}
                  <div className="glassmorphism p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-teal-400" /> Trophies Unlocked
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black/40 border border-zinc-900 text-center">
                        <span className="text-xl">🏆</span>
                        <span className="text-[8px] font-bold text-zinc-400 leading-tight">First evaluation</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black/40 border border-zinc-900 text-center opacity-40">
                        <span className="text-xl">🔥</span>
                        <span className="text-[8px] font-bold text-zinc-500 leading-tight">5-Day streak</span>
                      </div>
                      <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-black/40 border border-zinc-900 text-center opacity-40">
                        <span className="text-xl">💎</span>
                        <span className="text-[8px] font-bold text-zinc-500 leading-tight">Elite Profile</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Timeline */}
                  <div className="glassmorphism p-6 rounded-3xl space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-500" /> Evaluation Journey
                    </h3>
                    
                    <div className="relative border-l border-zinc-800 pl-4 space-y-4 text-left">
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-teal-400 border border-[#05050c] shadow-[0_0_8px_rgba(20,184,166,0.5)]" />
                        <span className="text-[9px] font-bold text-teal-400 block uppercase">Active evaluation</span>
                        <span className="text-xs font-bold text-white block">Cinematic Diagnostic</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Today</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
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
          onTimeUpdate={handleTimeUpdate}
          onError={() => {
            if (activeVideoLayer === 'A' && videoA) {
              setVideoError(true);
              setShowOverlay(true);
            }
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
          onTimeUpdate={handleTimeUpdate}
          onError={() => {
            if (activeVideoLayer === 'B' && videoB) {
              setVideoError(true);
              setShowOverlay(true);
            }
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
        <div className="absolute top-6 left-6 z-30 flex items-center gap-2">
          <div 
            className="flex items-center gap-2 cursor-pointer bg-black/45 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 hover:bg-black/60 transition-colors pointer-events-auto shadow-lg"
            onClick={() => router.push('/')}
          >
            <img 
              src="/psymetric-logo.png" 
              alt="PsyMetric Logo" 
              className="h-6 w-auto object-contain"
            />
          </div>
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
                    animate={
                      isExpired
                        ? {
                            x: [0, -10, 10, -10, 10, -10, 10, 0],
                            scale: 0.98
                          }
                        : { opacity: 1, rotateY: 0, scale: 1 }
                    }
                    exit={{ 
                      opacity: 0, 
                      rotateZ: -20, 
                      scale: 0.9,
                      transition: { duration: 0.45, ease: 'easeInOut' }
                    }}
                    transition={
                      isExpired
                        ? { type: 'tween', duration: 0.5, ease: 'linear' }
                        : { 
                            type: 'spring', 
                            stiffness: 100, 
                            damping: 15,
                            duration: 0.6
                          }
                    }
                    className={`w-full glassmorphism p-6 rounded-3xl relative overflow-hidden transition-all duration-300 ${
                      isExpired ? 'bg-red-950/25 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.25)]' : ''
                    }`}
                  >
                    {/* Back card border neon tint */}
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500/30 to-teal-400/30" />

                    {/* Progress Indicators & Timer */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-4 gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" /> Loop {progress.answered_scenarios + 1}
                      </span>

                      {/* Dynamic countdown watch timer */}
                      {(() => {
                        const totalDuration = currentQuestion?.timer_duration || 15;
                        const warnLimit = Math.ceil(totalDuration * 0.5);
                        const criticalLimit = Math.ceil(totalDuration * 0.25);
                        return (
                          <motion.div
                            animate={timeLeft <= criticalLimit ? {
                              x: [0, -3, 3, -3, 3, 0],
                              scale: [1, 1.05, 1, 1.05, 1],
                              transition: { repeat: Infinity, duration: 0.4 }
                            } : {}}
                            className="relative flex items-center justify-center shrink-0"
                          >
                            <svg className="w-12 h-12 transform -rotate-90">
                              {/* Background Track Circle */}
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                className="stroke-zinc-800 fill-none"
                                strokeWidth="2.5"
                              />
                              {/* Sweep Circle */}
                              <motion.circle
                                cx="24"
                                cy="24"
                                r="20"
                                className={`fill-none transition-colors duration-300 ${
                                  timeLeft > warnLimit
                                    ? 'stroke-teal-400 drop-shadow-[0_0_4px_rgba(0,245,212,0.4)]'
                                    : timeLeft > criticalLimit
                                    ? 'stroke-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.4)]'
                                    : 'stroke-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                                }`}
                                strokeWidth="2.5"
                                strokeDasharray="125.66"
                                animate={{ strokeDashoffset: (((totalDuration - timeLeft) / totalDuration) * 125.66) }}
                                transition={{ duration: 1, ease: 'linear' }}
                                strokeLinecap="round"
                              />
                            </svg>
                            {/* Countdown seconds displayed in the middle */}
                            <div className={`absolute font-mono font-extrabold text-sm tracking-normal transition-colors duration-300 ${
                              timeLeft > warnLimit
                                ? 'text-teal-400'
                                : timeLeft > criticalLimit
                                ? 'text-amber-400'
                                : 'text-red-500 animate-pulse'
                            }`}
                            style={{ fontFeatureSettings: '"tnum"' }}>
                              {timeLeft}
                            </div>
                          </motion.div>
                        );
                      })()}

                      <span className="shrink-0 text-right">Scenario {progress.answered_scenarios + 1} of {progress.total_scenarios}</span>
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
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
