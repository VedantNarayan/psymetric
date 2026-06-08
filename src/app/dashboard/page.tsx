'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Clock, LayoutDashboard, Compass, 
  BrainCircuit, GraduationCap, Building, RotateCcw, 
  LogOut, Check, ChevronRight, Search, SlidersHorizontal, 
  VolumeX, Volume2, Award, Calendar, BookOpen, MessageSquare, 
  Send, User, SearchIcon, Terminal, X, HelpCircle, ArrowUpRight,
  Loader2
} from 'lucide-react';

// Mock data fallbacks for sandbox testing or offline operations
const MOCK_PROFILE = {
  full_name: 'Vedant Narayan',
  age_tier: '16-18',
  institution_type: 'School',
  school_name: 'DAV Public School',
  class: '10',
  section: 'A',
  stream: null,
  avatar_url: null,
};

const MOCK_REPORT = {
  holland_percentages: {
    'The Builder': 65,
    'The Thinker': 85,
    'The Creator': 90,
    'The Connector': 45,
    'The Leader': 70,
    'The Organizer': 40
  },
  ai_analysis: {
    cognitive_strengths: [
      'High creative divergence and abstract spatial reasoning.',
      'Strong logical deduction and systemic mapping.',
      'Exceptional persistence in complex debugging/troubleshooting tasks.'
    ],
    growth_areas: [
      'Administrative documentation and task sequencing.',
      'Verbal alignment with risk-averse team members.'
    ],
    psychological_feedback: 'Vedant exhibits a highly artistic-investigative hybrid mindset (The Creator-Thinker). They excel in environments that reward exploratory logic, systemic design, and innovative engineering, while showing low compatibility with rigid administrative routines.'
  }
};

const MOCK_CAREERS = [
  {
    id: 'car1',
    title: 'UX/UI Systems Architect',
    match: 94,
    salary: '₹14-22 LPA',
    growth: 'High (+18% YoY)',
    stream: 'Any Stream',
    dimension: 'The Creator / The Thinker',
    description: 'Design digital platform architectures, user flows, and interaction models using advanced spatial systems and mental models.',
    youtubeMock: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'car2',
    title: 'Computational Research Lead',
    match: 89,
    salary: '₹18-28 LPA',
    growth: 'Very High (+24% YoY)',
    stream: 'Science (PCM)',
    dimension: 'The Thinker / The Builder',
    description: 'Apply computational models, simulations, and data architectures to solve cutting-edge biological, material, or software questions.',
    youtubeMock: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'car3',
    title: 'Game Mechanics Developer',
    match: 87,
    salary: '₹10-18 LPA',
    growth: 'Steady (+12% YoY)',
    stream: 'Science (PCM/CS)',
    dimension: 'The Creator / The Builder',
    description: 'Program visual simulations, physics engines, and game loops to align player actions with creative world rules.',
    youtubeMock: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'car4',
    title: 'Product Innovation Director',
    match: 82,
    salary: '₹22-35 LPA',
    growth: 'High (+15% YoY)',
    stream: 'Commerce / Science',
    dimension: 'The Leader / The Creator',
    description: 'Orchestrate multidisciplinary engineering, design, and marketing teams to deploy high-impact customer-facing apps.',
    youtubeMock: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];

const MOCK_MENTORS = [
  { id: 'm1', name: 'Dr. Priyanka Sen', role: 'Principal AI Researcher at TechLabs', archetype: 'The Thinker-Creator', match: '96% Match', available: 'Tomorrow, 4:00 PM' },
  { id: 'm2', name: 'Rohan Joshi', role: 'Lead Gameplay Engineer at EpicGames', archetype: 'The Creator-Builder', match: '91% Match', available: 'June 12, 11:30 AM' }
];

const MOCK_PUZZLE = {
  scenario: 'Your developer team is divided: half wants to use a highly experimental new graphics framework, and the other half wants to stick to the older, stable model on a tight production schedule. Best step?',
  options: [
    { id: 'pa', letter: 'A', text: 'Build a quick 1-day sandbox prototype using both frameworks to compare performance objectively.', score: '+20 XP (Logical Thinker)', explanation: 'Exemplary scientific choice! Quick sandboxed tests yield empirical data, resolving emotional team disagreements objectively.' },
    { id: 'pb', letter: 'B', text: 'Call a shop/advisor to make the final technical choice for you.', score: '+5 XP (Organizer)', explanation: 'Outsourcing the choice is safe, but delays internal skill acquisition and doesn\'t address team alignment.' },
    { id: 'pc', letter: 'C', text: 'Side with the experimental choice to encourage innovation, despite schedule risks.', score: '+15 XP (Creator)', explanation: 'High artistic drive! Great for creativity, but potentially endangers the commercial delivery timeline.' },
    { id: 'pd', letter: 'D', text: 'Enforce the stable model strictly to guarantee on-time delivery.', score: '+12 XP (Leader)', explanation: 'Strong risk control! Protects the schedule, but might suppress team morale and innovation drive.' }
  ]
};

export default function StudentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quest' | 'careers' | 'skills' | 'mentorship'>('dashboard');
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Custom navigation UI states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [showCmdPalette, setShowCmdPalette] = useState<boolean>(false);
  const [cmdSearch, setCmdSearch] = useState<string>('');

  // Quest states
  const [showReportModal, setShowReportModal] = useState<boolean>(false);

  // Career filters
  const [careerFilterStream, setCareerFilterStream] = useState<string>('All');
  const [careerFilterHolland, setCareerFilterHolland] = useState<string>('All');
  const [selectedCareer, setSelectedCareer] = useState<any>(null);

  // Daily Puzzle states
  const [solvedPuzzleOption, setSolvedPuzzleOption] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(420);
  const [level, setLevel] = useState<number>(3);
  const [streak, setStreak] = useState<number>(5);

  // Peer Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: 'c1', sender: 'Aman (10-C)', text: 'Hey guys! Anyone else match the Creator-Thinker archetype here?' },
    { id: 'c2', sender: 'Priya (11-Sci)', text: 'Yes! UX Systems and Game Mechanics are my top recommendations. What courses are you doing?' }
  ]);
  const [newMessage, setNewMessage] = useState<string>('');

  // Mentor Booking states
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [bookedDate, setBookedDate] = useState<string>('');

  // Load profiles and session data
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        setLoading(true);
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession) {
          // If no auth, route to auth page
          router.push('/auth');
          return;
        }

        // Fetch profile
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authSession.user.id)
          .single();

        // Fetch completed assessment session for report
        const { data: activeSession } = await supabase
          .from('assessment_sessions')
          .select('*')
          .eq('user_id', authSession.user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const meta = authSession.user.user_metadata;
        const isIndividual = meta?.user_type === 'normal_user';

        if (prof) {
          setProfile({
            full_name: prof.full_name || 'Student User',
            age_tier: prof.age_tier || '16-18',
            institution_type: isIndividual ? 'Individual' : 'School',
            school_name: isIndividual ? 'Individual Portal' : (meta?.school_name || 'School Portal'),
            class: isIndividual ? null : meta?.class,
            section: isIndividual ? null : meta?.section,
            stream: isIndividual ? null : meta?.stream,
            avatar_url: prof.avatar_url
          });
        } else {
          setProfile({
            full_name: meta?.full_name || MOCK_PROFILE.full_name,
            age_tier: meta?.age_group || MOCK_PROFILE.age_tier,
            institution_type: isIndividual ? 'Individual' : 'School',
            school_name: isIndividual ? 'Individual Portal' : (meta?.school_name || MOCK_PROFILE.school_name),
            class: isIndividual ? null : (meta?.class || MOCK_PROFILE.class),
            section: isIndividual ? null : (meta?.section || MOCK_PROFILE.section),
            stream: isIndividual ? null : MOCK_PROFILE.stream,
            avatar_url: null
          });
        }

        if (activeSession && activeSession.length > 0) {
          setSession(activeSession[0]);
          if (activeSession[0].is_completed && activeSession[0].theta_vector) {
            // Transform theta vector to fit radar values
            const theta = activeSession[0].theta_vector;
            const mappedPercentages = {
              'The Builder': Math.min(100, Math.max(30, (theta.R || 0) * 10)),
              'The Thinker': Math.min(100, Math.max(30, (theta.I || 0) * 10)),
              'The Creator': Math.min(100, Math.max(30, (theta.A || 0) * 10)),
              'The Connector': Math.min(100, Math.max(30, (theta.S || 0) * 10)),
              'The Leader': Math.min(100, Math.max(30, (theta.E || 0) * 10)),
              'The Organizer': Math.min(100, Math.max(30, (theta.C || 0) * 10))
            };
            setReport({
              holland_percentages: mappedPercentages,
              ai_analysis: MOCK_REPORT.ai_analysis
            });
            setXp(420);
            setLevel(3);
            setStreak(5);
          } else {
            setReport(null);
            setXp(0);
            setLevel(1);
            setStreak(0);
          }
        } else {
          setReport(null);
          setXp(0);
          setLevel(1);
          setStreak(0);
        }
      } catch (err) {
        console.warn("Error fetching live data, utilizing sandbox seed assets:", err);
        setProfile(MOCK_PROFILE);
        setReport(MOCK_REPORT);
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [router]);

  // Cmd+K palette hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCmdPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const handleQuestAction = () => {
    // Navigate to assessment path
    router.push('/assessment');
  };

  const handleResetAssessment = async () => {
    if (!confirm('Are you sure you want to reset current evaluation data and restart standard testing?')) return;
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (authSession) {
        await supabase.from('candidate_responses').delete().eq('session_id', session?.id);
        await supabase.from('assessment_sessions').delete().eq('id', session?.id);
      }
      window.location.reload();
    } catch (e) {
      alert('Local sandbox session reset completed.');
      window.location.reload();
    }
  };

  const submitPuzzleAnswer = (optionId: string) => {
    if (solvedPuzzleOption) return;
    setSolvedPuzzleOption(optionId);
    
    // Add XP
    setXp(prev => {
      const nextXp = prev + 20;
      if (nextXp >= 600) {
        setLevel(l => l + 1);
        return nextXp - 600;
      }
      return nextXp;
    });
    setStreak(s => s + 1);
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender: 'Me', text: newMessage }
    ]);
    setNewMessage('');
  };

  const handleBookMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookedDate) return;
    alert(`Success! Informational chat scheduled with ${selectedMentor.name} for ${bookedDate}.`);
    setSelectedMentor(null);
    setBookedDate('');
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
        <p className="text-zinc-500 tracking-wider text-[10px] uppercase font-bold">Configuring Quest Dashboard...</p>
      </div>
    );
  }

  // Determine dominant personality traits for title
  const hasReport = !!report;
  const sortedTraits = Object.entries(report?.holland_percentages || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .map(entry => entry[0]);

  const primaryTrait = sortedTraits[0] || '';
  const secondaryTrait = sortedTraits[1] || '';
  const characterTitle = hasReport 
    ? `${primaryTrait.replace('The ', '')}-${secondaryTrait.replace('The ', '')} Hybrid` 
    : 'Quest Explorer (Pending)';

  // Radar SVG Math
  const cx = 150;
  const cy = 150;
  const maxRadius = 100;
  
  const axes = [
    { name: 'The Builder', color: '#ef4444' },
    { name: 'The Thinker', color: '#3b82f6' },
    { name: 'The Creator', color: '#a855f7' },
    { name: 'The Connector', color: '#22c55e' },
    { name: 'The Leader', color: '#f59e0b' },
    { name: 'The Organizer', color: '#14b8a6' }
  ];

  const radarPoints = axes.map((axis, i) => {
    const percentage = hasReport ? (((report?.holland_percentages?.[axis.name] as number) || 0) / 100) : 0;
    const r = percentage * maxRadius;
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, name: axis.name, score: hasReport ? Math.round(percentage * 100) : 0 };
  });

  const polygonPointsString = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  // Filter careers
  const filteredCareers = MOCK_CAREERS.filter(car => {
    if (careerFilterStream !== 'All') {
      if (careerFilterStream === 'Science' && !car.stream.includes('Science')) return false;
      if (careerFilterStream === 'Commerce' && !car.stream.includes('Commerce')) return false;
      if (careerFilterStream === 'Arts' && !car.stream.includes('Any')) return false;
    }
    if (careerFilterHolland !== 'All') {
      if (!car.dimension.includes(careerFilterHolland)) return false;
    }
    return true;
  });

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-[#f4f4f5] text-zinc-900' : 'bg-[#030303] text-white'} flex flex-col justify-between overflow-hidden mesh-gradient relative`}>
      
      {/* ─── CMD+K SEARCH PALETTE ─── */}
      <AnimatePresence>
        {showCmdPalette && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#0c0c16] border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center gap-2 border-b border-white/10 pb-3 mb-4">
                <Search className="w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Fuzzy search tabs, careers, or actions..." 
                  value={cmdSearch}
                  onChange={(e) => setCmdSearch(e.target.value)}
                  className="w-full bg-transparent text-white focus:outline-none placeholder-zinc-500 text-sm"
                />
                <button onClick={() => setShowCmdPalette(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2 px-2">Navigation Shortcuts</span>
                
                {[
                  { name: 'Dashboard Hub', desc: 'View character card and radar charts', action: () => { setActiveTab('dashboard'); setShowCmdPalette(false); } },
                  { name: 'Active Assessment Quest', desc: 'Resume or launch the cinematic quest', action: () => { setActiveTab('quest'); setShowCmdPalette(false); } },
                  { name: 'Career Explorer', desc: 'Explore RIASEC career options & salary trends', action: () => { setActiveTab('careers'); setShowCmdPalette(false); } },
                  { name: 'Skill Matrix & Puzzles', desc: 'Take daily puzzle challenges and view skill grids', action: () => { setActiveTab('skills'); setShowCmdPalette(false); } },
                  { name: 'Mentorship Bookings', desc: 'Chat in peer guilds or schedule mentor sessions', action: () => { setActiveTab('mentorship'); setShowCmdPalette(false); } }
                ].filter(item => item.name.toLowerCase().includes(cmdSearch.toLowerCase())).map(item => (
                  <button 
                    key={item.name}
                    onClick={item.action}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-white/5 transition-colors flex justify-between items-center group"
                  >
                    <div>
                      <span className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors block">{item.name}</span>
                      <span className="text-[10px] text-zinc-500 block">{item.desc}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-teal-300" />
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                <span>Use keyboard arrows or type to match</span>
                <span>ESC to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── STICKY HEADER ─── */}
      <header className="max-w-7xl mx-auto w-full px-6 py-4 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-8 w-auto object-contain"
          />
        </div>

        {/* Universal Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-black/40 border border-zinc-800 rounded-xl px-3 py-1.5 w-80 relative">
          <Search className="w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search careers or type Cmd+K..." 
            onClick={() => setShowCmdPalette(true)}
            className="bg-transparent text-xs text-white focus:outline-none placeholder-zinc-600 w-full cursor-pointer"
            readOnly
          />
          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-mono border border-zinc-700">⌘K</span>
        </div>

        {/* Notifications & Profile dropdowns */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => { setShowNotifications(prev => !prev); setShowProfileMenu(false); }}
              className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
            >
              <Award className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-72 bg-[#0c0c16] border border-white/10 p-4 rounded-xl shadow-2xl z-50 space-y-3"
                >
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/10 pb-2">Recent Achievements</h4>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start text-xs">
                      <span className="text-xl">🔥</span>
                      <div>
                        <span className="font-bold text-white block">5-Day Solved Streak</span>
                        <span className="text-[10px] text-zinc-500">Unlocked 1.5x XP puzzle multiplier</span>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start text-xs">
                      <span className="text-xl">🎓</span>
                      <div>
                        <span className="font-bold text-white block">Primary Set Evaluated</span>
                        <span className="text-[10px] text-zinc-500">Completed 12 standard scenarios</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => { setShowProfileMenu(prev => !prev); setShowNotifications(false); }}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 to-teal-400 p-[1.5px]">
                <div className="w-full h-full bg-[#05050c] rounded-lg flex items-center justify-center text-[10px] font-bold text-teal-300">
                  {profile?.full_name ? profile.full_name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ST'}
                </div>
              </div>
              <span className="text-xs font-semibold text-zinc-300 hidden sm:inline-block pr-1">
                {profile?.full_name?.split(' ')[0] || 'Student'}
              </span>
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-56 bg-[#0c0c16] border border-white/10 p-3 rounded-xl shadow-2xl z-50 space-y-2.5"
                >
                  <div className="border-b border-white/5 pb-2 px-1">
                    <span className="text-xs font-bold text-white block">{profile?.full_name}</span>
                    <span className="text-[9px] text-zinc-500 block mt-0.5">{profile?.school_name}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase block px-1">Theme</span>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/40">
                      {(['dark', 'light'] as const).map(t => (
                        <button 
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`text-[9px] py-1 rounded font-bold uppercase transition-all ${theme === t ? 'bg-zinc-800 text-teal-400' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full text-left p-2 rounded-lg hover:bg-red-500/10 text-xs font-semibold text-red-400 flex items-center gap-2 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ─── MAIN PORTAL BODY ─── */}
      <div className="max-w-7xl mx-auto w-full px-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="lg:col-span-3 hidden lg:flex flex-col gap-4">
          <div className="glassmorphism p-4 rounded-2xl space-y-1 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500/10 to-teal-500/10" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-3 px-2">Navigation Panel</span>

            {[
              { id: 'dashboard', name: 'Dashboard Hub', icon: LayoutDashboard },
              { id: 'quest', name: 'Active Assessment', icon: BrainCircuit },
              { id: 'careers', name: 'Career Explorer', icon: Compass },
              { id: 'skills', name: 'Skill Matrix', icon: BookOpen },
              { id: 'mentorship', name: 'Mentorship', icon: MessageSquare }
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === item.id 
                      ? 'bg-purple-600/15 border border-purple-500/30 text-purple-300 shadow-[0_0_15px_rgba(157,78,221,0.05)]' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Gamified Sidebar Card */}
          <div className="glassmorphism p-4 rounded-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500/10 to-purple-500/10" />
            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest block mb-1">Quest Level</span>
            <div className="text-3xl font-black text-white mb-2">{level}</div>
            <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase mb-1">
              <span>XP Progress</span>
              <span>{xp}/600 XP</span>
            </div>
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-gradient-to-r from-purple-500 to-teal-400" style={{ width: `${(xp/600)*100}%` }} />
            </div>
            <div className="text-[9px] text-zinc-500 flex items-center justify-center gap-1">
              <span>🔥 Streak:</span>
              <span className="font-bold text-teal-400">{streak} Days solved</span>
            </div>
          </div>
        </aside>

        {/* DYNAMIC WORKSPACE (9/12 Columns) */}
        <main className="lg:col-span-9 flex flex-col gap-6 overflow-y-auto max-h-[80vh] pr-1">
          <AnimatePresence mode="wait">
            
            {/* ─── TAB 1: DASHBOARD HUB ─── */}
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Profile Card */}
                <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row items-center gap-6">
                  <div className="absolute top-0 right-0 w-60 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
                  <div className="relative w-20 h-20 rounded-xl bg-gradient-to-tr from-purple-600 to-teal-400 p-[1.5px] shadow-[0_0_20px_rgba(157,78,221,0.2)]">
                    <div className="w-full h-full rounded-xl bg-[#090915] flex items-center justify-center overflow-hidden">
                      <Sparkles className="w-8 h-8 text-teal-300 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-[9px] font-extrabold text-purple-400 tracking-widest uppercase">
                      {profile?.institution_type === 'School' ? 'Student Profile' : 'Individual Profile'}
                    </span>
                    <h2 className="text-xl font-black text-white">{profile?.full_name}</h2>
                    <p className="text-xs text-teal-300 font-semibold flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                      <GraduationCap className="w-3.5 h-3.5" /> {characterTitle}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-900 text-left text-xs">
                    <span className="font-bold block text-white flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-zinc-500" /> {profile?.school_name}
                    </span>
                    {profile?.class && (
                      <span className="text-zinc-500 block mt-0.5">Class {profile.class}{profile.section ? `-${profile.section}` : ''}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Constellation Radar SVG */}
                  <div className="glassmorphism p-6 rounded-2xl flex flex-col justify-between items-center min-h-[350px]">
                    <h3 className="w-full text-xs font-bold text-zinc-400 uppercase tracking-widest text-left mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-400" /> Character Constellation
                    </h3>
                    
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full" viewBox="0 0 300 300">
                        {/* concentric hexagons */}
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
                              stroke="rgba(255, 255, 255, 0.04)"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Axes lines */}
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
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Filled constellation area */}
                        {hasReport && (
                          <polygon
                            points={polygonPointsString}
                            fill="rgba(157, 78, 221, 0.2)"
                            stroke="url(#constellation-grad)"
                            strokeWidth="2.5"
                          />
                        )}

                        {/* Interactive nodes */}
                        {hasReport && radarPoints.map((pt, i) => (
                          <circle
                            key={i}
                            cx={pt.x}
                            cy={pt.y}
                            r="4.5"
                            fill="#030303"
                            stroke={axes[i].color}
                            strokeWidth="2.5"
                            className="cursor-pointer hover:scale-125 transition-transform"
                          />
                        ))}

                        {/* Text labels */}
                        {axes.map((axis, i) => {
                          const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
                          const labelRadius = maxRadius + 22;
                          const lx = cx + labelRadius * Math.cos(angle);
                          const ly = cy + labelRadius * Math.sin(angle);
                          return (
                            <text
                              key={i}
                              x={lx}
                              y={ly}
                              textAnchor="middle"
                              alignmentBaseline="middle"
                              fill="#888"
                              fontSize="9.5"
                              fontWeight="bold"
                              fontFamily="inherit"
                            >
                              {axis.name}
                            </text>
                          );
                        })}

                        <defs>
                          <linearGradient id="constellation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#9d4edd" />
                            <stop offset="100%" stopColor="#00f5d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  </div>

                  {/* Achievements and Sweet Spot Grid */}
                  <div className="space-y-6">
                    <div className="glassmorphism p-6 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-teal-400" /> Unlockable Achievements
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 flex items-center gap-2 transition-opacity duration-300 ${hasReport ? '' : 'opacity-40'}`}>
                          <span className="text-lg">⚡</span>
                          <div>
                            <span className="text-xs font-bold text-white block">Speed Runner</span>
                            <span className="text-[8px] text-zinc-500">{hasReport ? 'Unlocked!' : 'Solved puzzle under 10s'}</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 flex items-center gap-2 transition-opacity duration-300 ${solvedPuzzleOption ? '' : 'opacity-40'}`}>
                          <span className="text-lg">💡</span>
                          <div>
                            <span className="text-xs font-bold text-white block">Logic Master</span>
                            <span className="text-[8px] text-zinc-500">{solvedPuzzleOption ? 'Unlocked!' : 'Solve 10 daily puzzles'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">🎯 Your Career Sweet Spot</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {hasReport 
                          ? `Based on your high alignment with **The ${primaryTrait.replace('The ', '')}** and **The ${secondaryTrait.replace('The ', '')}** dimensions, your natural zone lies in innovative platforms.`
                          : 'Your career sweet spot will unlock once you complete the primary character quest. Start the quest to begin your discovery!'}
                      </p>
                      {hasReport ? (
                        <button 
                          onClick={() => setActiveTab('careers')}
                          className="mt-4 flex items-center gap-1 text-[10px] text-teal-400 hover:text-teal-300 font-bold uppercase tracking-wider"
                        >
                          <span>Explore Matches</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setActiveTab('quest')}
                          className="mt-4 flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
                        >
                          <span>Start Quest</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── TAB 2: QUEST & ASSESSMENT CENTER ─── */}
            {activeTab === 'quest' && (
              <motion.div 
                key="quest-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Active Quest Launcher */}
                <div className="glassmorphism p-6 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-full bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block mb-2">Cinematic Evaluation</span>
                  <h2 className="text-xl font-black text-white mb-2">Primary Character Quest</h2>
                  <p className="text-xs text-zinc-400 max-w-lg mb-6 leading-relaxed">
                    Evaluate your behavioral instincts using adaptive, cinematic video-based scenarios. The system dynamically scales the baseline to 12 scenarios and checks responses live.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                      onClick={handleQuestAction}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                    >
                      <span>{session?.is_completed ? 'Launch Evaluation' : 'Resume Quest'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleResetAssessment}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restart Quest
                    </button>
                  </div>
                </div>

                {/* Historical Reports Grid */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Reports & Evaluations</h3>
                  
                  {report ? (
                    <div className="glassmorphism p-4 rounded-xl border border-white/5 flex justify-between items-center hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 font-black text-sm">
                          Set 1
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block"> Holland Character Evaluation</span>
                          <span className="text-[9px] text-zinc-500 block mt-0.5">Primary set complete • {characterTitle}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowReportModal(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <span>View Analysis</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8 text-zinc-500 text-xs font-semibold">
                      No reports generated yet. Launch your first Quest above.
                    </div>
                  )}
                </div>

                {/* Analysis Detail Modal */}
                <AnimatePresence>
                  {showReportModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-2xl bg-[#07070f] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]"
                      >
                        <button onClick={() => setShowReportModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                          <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-6">
                          <div>
                            <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Gemini AI Synthesis</span>
                            <h2 className="text-xl font-black text-white">{characterTitle} Analysis</h2>
                          </div>

                          <div className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-900 text-xs leading-relaxed text-zinc-300">
                            {report?.ai_analysis?.psychological_feedback?.replace(/Vedant/g, profile?.full_name?.split(' ')[0] || 'Student') || MOCK_REPORT.ai_analysis.psychological_feedback}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Cognitive Strengths</h4>
                              <ul className="space-y-2 text-xs text-zinc-400">
                                {(report?.ai_analysis?.cognitive_strengths || MOCK_REPORT.ai_analysis.cognitive_strengths).map((str: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-teal-400 font-bold">•</span>
                                    <span>{str.replace(/Vedant/g, profile?.full_name?.split(' ')[0] || 'Student')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Growth Fields</h4>
                              <ul className="space-y-2 text-xs text-zinc-400">
                                {(report?.ai_analysis?.growth_areas || MOCK_REPORT.ai_analysis.growth_areas).map((gro: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-purple-400 font-bold">•</span>
                                    <span>{gro.replace(/Vedant/g, profile?.full_name?.split(' ')[0] || 'Student')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ─── TAB 3: CAREER EXPLORER ─── */}
            {activeTab === 'careers' && (
              <motion.div 
                key="careers-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Search & Cascading Filter Controls */}
                <div className="glassmorphism p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-2 bg-black/40 border border-zinc-900 px-3 py-1.5 rounded-lg w-full sm:w-64">
                    <Search className="w-4 h-4 text-zinc-600" />
                    <input 
                      type="text" 
                      placeholder="Search career titles..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent text-xs text-white focus:outline-none placeholder-zinc-600 w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Stream</label>
                      <select 
                        value={careerFilterStream}
                        onChange={(e) => setCareerFilterStream(e.target.value)}
                        className="bg-black/50 border border-zinc-900 rounded-lg p-2 text-xs text-zinc-300"
                      >
                        <option value="All">All Streams</option>
                        <option value="Science">Science (PCM)</option>
                        <option value="Commerce">Commerce</option>
                        <option value="Arts">Arts/Humanities</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase">Holland Code</label>
                      <select 
                        value={careerFilterHolland}
                        onChange={(e) => setCareerFilterHolland(e.target.value)}
                        className="bg-black/50 border border-zinc-900 rounded-lg p-2 text-xs text-zinc-300"
                      >
                        <option value="All">All Dimensions</option>
                        <option value="Thinker">The Thinker</option>
                        <option value="Creator">The Creator</option>
                        <option value="Builder">The Builder</option>
                        <option value="Leader">The Leader</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Careers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCareers.filter(car => car.title.toLowerCase().includes(searchQuery.toLowerCase())).map(car => (
                    <div 
                      key={car.id}
                      onClick={() => setSelectedCareer(car)}
                      className="glassmorphism p-5 rounded-xl border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer group flex flex-col justify-between min-h-[180px] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none" />
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">{car.dimension}</span>
                          {hasReport ? (
                            <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{car.match}% Match</span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">Unlock Match</span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-white text-sm group-hover:text-teal-300 transition-colors">{car.title}</h4>
                        <p className="text-[11px] text-zinc-500 mt-2 line-clamp-2">{car.description}</p>
                      </div>
                      <div className="flex justify-between items-center border-t border-white/5 pt-3 mt-4 text-[10px] font-semibold text-zinc-400">
                        <span>Salary: {car.salary}</span>
                        <span>Stream: {car.stream}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Career Detail Drawer */}
                <AnimatePresence>
                  {selectedCareer && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
                      <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="w-full max-w-md h-full bg-[#08080f] border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto"
                      >
                        <div className="space-y-6">
                          <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            {hasReport ? (
                              <span className="text-[10px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">{selectedCareer.match}% Profile Match</span>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-500/10 px-2 py-0.5 rounded-full">Evaluation Pending</span>
                            )}
                            <button onClick={() => setSelectedCareer(null)} className="text-zinc-500 hover:text-white">
                              <X className="w-5 h-5" />
                            </button>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{selectedCareer.dimension}</span>
                            <h3 className="text-lg font-black text-white mt-1">{selectedCareer.title}</h3>
                          </div>

                          {/* YouTube Video Mockup */}
                          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 relative">
                            <iframe 
                              title="Career Video"
                              className="w-full h-full" 
                              src={selectedCareer.youtubeMock}
                            />
                          </div>

                          <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Day-in-the-Life Description</h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">{selectedCareer.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs font-semibold">
                            <div>
                              <span className="text-[10px] text-zinc-500 block">Salary Range</span>
                              <span className="text-white font-bold">{selectedCareer.salary}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block">Job Market Growth</span>
                              <span className="text-teal-400 font-bold">{selectedCareer.growth}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => setSelectedCareer(null)}
                          className="w-full mt-6 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-white transition-colors"
                        >
                          Close File
                        </button>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ─── TAB 4: SKILL MATRIX & MINI-PUZZLE ─── */}
            {activeTab === 'skills' && (
              <motion.div 
                key="skills-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Skill radar chart */}
                  <div className="glassmorphism p-6 rounded-2xl flex flex-col justify-between items-center min-h-[350px]">
                    <h3 className="w-full text-xs font-bold text-zinc-400 uppercase tracking-widest text-left mb-4 flex items-center gap-1.5">
                      <BrainCircuit className="w-4 h-4 text-teal-400" /> Cognitive Strength Matrix
                    </h3>
                    
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full" viewBox="0 0 300 300">
                        {/* concentric grids */}
                        {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, sIdx) => {
                          const r = scale * maxRadius;
                          const gridPts = Array.from({ length: 5 }).map((_, i) => {
                            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                            const x = cx + r * Math.cos(angle);
                            const y = cy + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ');
                          return (
                            <polygon
                              key={sIdx}
                              points={gridPts}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.04)"
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* axes */}
                        {Array.from({ length: 5 }).map((_, i) => {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
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
                              strokeWidth="1"
                            />
                          );
                        })}

                        {/* Skill levels points */}
                        {hasReport && (() => {
                          const skillVals = [80, 90, 75, 50, 60];
                          const pts = skillVals.map((val, i) => {
                            const r = (val / 100) * maxRadius;
                            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                            const x = cx + r * Math.cos(angle);
                            const y = cy + r * Math.sin(angle);
                            return `${x},${y}`;
                          }).join(' ');
                          return (
                            <polygon
                              points={pts}
                              fill="rgba(0, 245, 212, 0.15)"
                              stroke="#00f5d4"
                              strokeWidth="2"
                            />
                          );
                        })()}

                        {/* labels */}
                        {['Logic', 'Creativity', 'Empathy', 'Admin Flow', 'Leadership'].map((label, i) => {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                          const lx = cx + (maxRadius + 22) * Math.cos(angle);
                          const ly = cy + (maxRadius + 18) * Math.sin(angle);
                          return (
                            <text
                              key={i}
                              x={lx}
                              y={ly}
                              textAnchor="middle"
                              alignmentBaseline="middle"
                              fill="#666"
                              fontSize="9.5"
                              fontWeight="bold"
                            >
                              {label}
                            </text>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  {/* Daily situational judgement puzzle */}
                  <div className="glassmorphism p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Terminal className="w-4 h-4 text-purple-400 animate-pulse" /> Daily Mini-Puzzle
                      </h3>
                      {solvedPuzzleOption && (
                        <span className="text-[9px] font-bold text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full animate-bounce">
                          Solved +20 XP
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                      {MOCK_PUZZLE.scenario}
                    </p>

                    <div className="space-y-2">
                      {MOCK_PUZZLE.options.map(opt => {
                        const isChosen = solvedPuzzleOption === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => submitPuzzleAnswer(opt.id)}
                            disabled={solvedPuzzleOption !== null}
                            className={`w-full text-left p-3 rounded-xl border text-[11px] leading-relaxed transition-all flex items-center gap-3 ${
                              isChosen
                                ? 'bg-purple-600/20 border-purple-500 text-white'
                                : solvedPuzzleOption !== null
                                ? 'bg-black/20 border-zinc-950 text-zinc-600'
                                : 'bg-black/40 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded font-extrabold flex items-center justify-center shrink-0 ${
                              isChosen ? 'bg-purple-500 text-white' : 'bg-zinc-900 border border-white/5'
                            }`}>
                              {opt.letter}
                            </span>
                            <span>{opt.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    {solvedPuzzleOption && (
                      <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-900 text-xs text-zinc-400 mt-2 animate-fade-in">
                        <span className="font-bold text-teal-400 block mb-1">
                          {MOCK_PUZZLE.options.find(o => o.id === solvedPuzzleOption)?.score}
                        </span>
                        <span>{MOCK_PUZZLE.options.find(o => o.id === solvedPuzzleOption)?.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Personalized Course Recommendations</h3>
                  {hasReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Interactive Interaction Design</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Interaction Design Specialization</span>
                          <span className="text-[9px] text-teal-400 font-bold block mt-1">Recommended for UX Architect path</span>
                        </div>
                        <a href="https://www.coursera.org" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-500 font-bold uppercase block">Game Engineering</span>
                          <span className="text-xs font-bold text-white block mt-0.5">Introduction to C++ & Unreal Engine</span>
                          <span className="text-[9px] text-teal-400 font-bold block mt-1">Recommended for Game Mechanics path</span>
                        </div>
                        <a href="https://www.coursera.org" target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white">
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center glassmorphism rounded-xl border border-white/5 text-zinc-500 text-xs font-semibold">
                      Complete your primary character quest to unlock personalized course recommendations.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── TAB 5: MENTORSHIP HUB ─── */}
            {activeTab === 'mentorship' && (
              <motion.div 
                key="mentorship-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Same-Archetype Peer Guild Chat */}
                  <div className="glassmorphism p-5 rounded-2xl flex flex-col justify-between h-[380px]">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-purple-400" /> Peer Archetype Chat (Creator-Thinkers)
                      </h3>

                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {chatMessages.map(msg => (
                          <div key={msg.id} className={`p-2.5 rounded-xl text-xs max-w-[85%] ${msg.sender === 'Me' ? 'bg-purple-600/10 border border-purple-500/20 ml-auto text-right' : 'bg-zinc-950/50 border border-zinc-900 text-left'}`}>
                            <span className="text-[9px] font-bold text-zinc-500 block mb-0.5">{msg.sender}</span>
                            <span className="text-zinc-300">{msg.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2 border-t border-white/5 pt-4 mt-2">
                      <input 
                        type="text" 
                        placeholder="Say something to the guild..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button type="submit" className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* Mentor booking board */}
                  <div className="glassmorphism p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-400" /> Book an Informational Interview
                    </h3>

                    <div className="space-y-3">
                      {MOCK_MENTORS.map(men => (
                        <div key={men.id} className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 flex justify-between items-center hover:border-zinc-800 transition-colors">
                          <div>
                            <span className="text-[10px] text-teal-400 font-bold">{hasReport ? men.match : 'Unlock Compatibility'}</span>
                            <span className="text-xs font-bold text-white block mt-0.5">{men.name}</span>
                            <span className="text-[9px] text-zinc-500 block">{men.role}</span>
                          </div>
                          <button 
                            onClick={() => setSelectedMentor(men)}
                            className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] uppercase font-bold tracking-wider"
                          >
                            Book Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mentor Scheduling Modal */}
                <AnimatePresence>
                  {selectedMentor && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-sm bg-[#07070f] border border-white/10 rounded-2xl p-5 shadow-2xl relative"
                      >
                        <button onClick={() => setSelectedMentor(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>

                        <form onSubmit={handleBookMentor} className="space-y-4">
                          <div>
                            <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">Informational Interview</span>
                            <h3 className="text-sm font-black text-white mt-1">Schedule with {selectedMentor.name}</h3>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">Available Date & Time</label>
                            <select 
                              required
                              value={bookedDate}
                              onChange={(e) => setBookedDate(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-900 rounded-lg p-2 text-xs text-white"
                            >
                              <option value="">Select Time Slot</option>
                              <option value={selectedMentor.available}>{selectedMentor.available} (Preferred)</option>
                              <option value="Next Wednesday, 3:00 PM">Next Wednesday, 3:00 PM</option>
                              <option value="Next Friday, 5:30 PM">Next Friday, 5:30 PM</option>
                            </select>
                          </div>

                          <button 
                            type="submit"
                            className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs transition-colors"
                          >
                            Confirm Booking Slot
                          </button>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-black/85 backdrop-blur-md border-t border-zinc-900 py-2.5 px-4 flex justify-around items-center z-40">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'quest', label: 'Quest', icon: BrainCircuit },
          { id: 'careers', label: 'Careers', icon: Compass },
          { id: 'skills', label: 'Skills', icon: BookOpen },
          { id: 'mentorship', label: 'Mentors', icon: MessageSquare }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-teal-400' : 'text-zinc-500 hover:text-white'}`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[9px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="border-t border-zinc-950 bg-black/20 py-4 mt-8 pb-20 lg:pb-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>© 2026 PsyMetric Enterprise. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-500 cursor-pointer">Support</span>
            <span className="hover:text-zinc-500 cursor-pointer">Privacy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
