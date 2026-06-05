'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  Sparkles, CheckCircle2, ChevronRight, ArrowRight,
  TrendingUp, Award, GraduationCap, Compass,
  BrainCircuit, ShieldAlert, AlertTriangle, 
  HelpCircle, Clock, Check, Loader2, Building,
  Link2, CreditCard, Wallet, Coins, UserCheck, Shield, ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock child details matching friendly dimensions and zero-text rules
const MOCK_CHILD_REPORT = {
  studentName: 'Vedant Narayan',
  class: '10',
  section: 'A',
  schoolName: 'DAV Public School',
  board: 'CBSE',
  characterTitle: 'Thinker-Creator Hybrid',
  xp: 420,
  maxXp: 600,
  level: 3,
  hollandPercentages: {
    'The Builder': 65,
    'The Thinker': 88,
    'The Creator': 75,
    'The Connector': 50,
    'The Leader': 60,
    'The Organizer': 45
  },
  careerRecommendations: [
    {
      title: 'UAV Systems Architect',
      stream: 'Science (Class 1Class 11/12)',
      fitScore: 92,
      description: 'Designing autonomous drone structures and sensory flight systems.',
      guidance: 'Encourage Vedant to play with DIY drone kits, learn Arduino programming, and practice 3D design using CAD tools.',
      topColleges: 'IIT Bombay, IIIT Hyderabad, BITS Pilani'
    },
    {
      title: 'Human-Computer Interface Designer',
      stream: 'Science / Arts (Class 11/12)',
      fitScore: 85,
      description: 'Crafting premium interactive interfaces for virtual reality environments.',
      guidance: 'Familiarize them with design tools like Figma, explore psychology articles on user behavior, and support digital illustration.',
      topColleges: 'NID Ahmedabad, IDC IIT Bombay, Srishti School of Design'
    }
  ],
  assessmentsHistory: [
    { date: 'May 15, 2026', type: 'Initial Evaluation', score: 84, description: 'Discovered high analytical focus and structural design interests.' },
    { date: 'Jun 02, 2026', type: 'Specialized Aptitude', score: 89, description: 'Unlocked high spatial reasoning and technical engineering potential.' }
  ]
};

const B2C_PLANS = [
  { id: 'p1', name: 'Single Evaluation Quest', price: 999, description: 'One full adaptive scenario test with Gemini AI psychologist report.' },
  { id: 'p2', name: 'Growth Quest Pack (3 Tests)', price: 2499, description: 'Track progress across terms. Ideal to map developmental growth.', popular: true },
  { id: 'p3', name: 'Unlimited Annual Journey', price: 4999, description: 'Unlimited scenario tests, custom parenting resources, and direct counselor slots.' }
];

export default function ParentDashboard() {
  const router = useRouter();
  
  // Navigation & UI States
  const [loading, setLoading] = useState(true);
  const [isLinked, setIsLinked] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'constellation' | 'pathways' | 'timeline' | 'billing'>('overview');
  
  // Link Flow States
  const [accessCode, setAccessCode] = useState('');
  const [linkingError, setLinkingError] = useState('');
  const [linkingSuccess, setLinkingSuccess] = useState(false);
  const [isLinkingLoading, setIsLinkingLoading] = useState(false);

  // Billing Flow States
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(B2C_PLANS[1]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Database Connection Indicator
  const [isDatabaseOffline, setIsDatabaseOffline] = useState(false);

  // Load parent profiles / linked child details from Supabase (fallback to mocks if offline/unauth)
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // No user logged in yet: display guest mode linking wizard
          setIsLinked(false);
          setLoading(false);
          return;
        }

        // Fetch parent profile & child links
        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileErr) throw profileErr;

        if (profile?.user_type === 'parent') {
          // Find linked student
          const { data: links } = await supabase
            .from('parent_student_links')
            .select('student_id, verified')
            .eq('parent_id', session.user.id);

          if (links && links.length > 0) {
            setIsLinked(true);
          } else {
            setIsLinked(false);
          }
        } else {
          // If logged in as student, redirect to student panel
          router.push('/assessment');
        }
      } catch (err) {
        console.warn('Supabase not connected or error, running in resilient client-side sandbox:', err);
        setIsDatabaseOffline(true);
        // By default, if offline and URL has pre-linked flag, simulate linked state
        if (typeof window !== 'undefined' && window.location.search.includes('linked=true')) {
          setIsLinked(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  // Handle access code submission
  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkingError('');
    setIsLinkingLoading(true);

    // Clean up code format: e.g. PSY-DAV-10A-042
    const formattedCode = accessCode.trim().toUpperCase();
    if (!formattedCode.startsWith('PSY-')) {
      setLinkingError('Invalid Access Code format. Code must start with "PSY-".');
      setIsLinkingLoading(false);
      return;
    }

    // Simulate server side check
    setTimeout(async () => {
      try {
        if (!isDatabaseOffline) {
          const { data: session } = await supabase.auth.getSession();
          if (session?.session?.user) {
            // Attempt to bind in database
            // Locate student roster by access code
            const { data: roster } = await supabase
              .from('student_roster')
              .select('*')
              .eq('access_code', formattedCode)
              .single();

            if (!roster) {
              setLinkingError('Student roster details not found for this access code.');
              setIsLinkingLoading(false);
              return;
            }

            // Create link
            const { error: linkErr } = await supabase
              .from('parent_student_links')
              .insert({
                parent_id: session.session.user.id,
                student_id: roster.claimed_by || null, // Link to claimed profile
                verified: true
              });

            if (linkErr) throw linkErr;
          }
        }

        // Fallback or Mock success
        setLinkingSuccess(true);
        setTimeout(() => {
          setIsLinked(true);
          setIsLinkingLoading(false);
        }, 1500);

      } catch (err) {
        console.error(err);
        setLinkingError('Failed to establish verification link. Please check credentials.');
        setIsLinkingLoading(false);
      }
    }, 1200);
  };

  // Handle Mock Payment trigger
  const handleCheckout = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowBillingModal(false);
      }, 2000);
    }, 1800);
  };

  // Radar Constellation setup
  const cx = 150;
  const cy = 130;
  const maxRadius = 90;
  
  const axes = [
    { name: 'The Builder', color: '#ef4444' }, 
    { name: 'The Thinker', color: '#3b82f6' }, 
    { name: 'The Creator', color: '#a855f7' }, 
    { name: 'The Connector', color: '#22c55e' }, 
    { name: 'The Leader', color: '#f59e0b' }, 
    { name: 'The Organizer', color: '#14b8a6' }
  ];

  const points = axes.map((axis, i) => {
    const score = MOCK_CHILD_REPORT.hollandPercentages[axis.name as keyof typeof MOCK_CHILD_REPORT.hollandPercentages] || 50;
    const percentage = score / 100;
    const r = percentage * maxRadius;
    const angle = (i * 2 * Math.PI) / 6 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, name: axis.name, score };
  });

  const polygonPointsString = points.map(p => `${p.x},${p.y}`).join(' ');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Securing Guardian Space</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030303] text-white flex flex-col justify-between overflow-x-hidden mesh-gradient">
      
      {/* Background radial blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-900/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-5 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-3">
          {isLinked && (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-extrabold uppercase tracking-wider">
              <UserCheck className="w-3.5 h-3.5" /> Guardian Mode Active
            </span>
          )}
          <button 
            onClick={() => {
              // Signout simulation or redirect
              router.push('/');
            }}
            className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 transition-all active:scale-95"
          >
            Leave Portal
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-grow flex flex-col justify-center">
        
        {!isLinked ? (
          /* ───────── LINKING SCREEN ───────── */
          <div className="max-w-md mx-auto w-full">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism p-8 rounded-3xl border border-zinc-800/80 shadow-[0_15px_30px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500/30 to-teal-500/30" />

              <div className="text-center space-y-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Link2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Guardian Association Panel</h2>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Link your child's profile to view their psychometric radar reports, skill constellation maps, and counselor pathways.
                  </p>
                </div>
              </div>

              {linkingSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-teal-400">Child Associated Successfully!</h4>
                  <p className="text-xs text-zinc-500">Unlocking custom guardian insights dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleLinkChild} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Child's Access Code</label>
                    <input 
                      type="text"
                      placeholder="PSY-DAV-10A-XXX"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 text-white rounded-xl py-3 px-4 text-sm font-semibold tracking-wider transition-all placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                      required
                    />
                  </div>

                  {linkingError && (
                    <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{linkingError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLinkingLoading}
                    className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(217,119,6,0.15)]"
                  >
                    {isLinkingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Association...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to Child</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Offline Seeding Guide */}
              <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
                <button
                  onClick={() => setIsLinked(true)}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors uppercase font-bold tracking-widest flex items-center gap-1 mx-auto"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500/40" /> 
                  <span>Bypass With Mock Data (Sandbox Demo)</span>
                </button>
              </div>

            </motion.div>
          </div>
        ) : (
          /* ───────── GUARDIAN DASHBOARD ───────── */
          <div className="space-y-8">
            
            {/* HERO CHILD SUMMARY CARD */}
            <div className="glassmorphism p-6 rounded-3xl relative overflow-hidden border border-zinc-800/80">
              <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-500/5 to-transparent -z-10" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Left: Avatar + Details */}
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[2px] shadow-[0_0_20px_rgba(245,158,11,0.25)] shrink-0">
                    <div className="w-full h-full rounded-2xl bg-[#090915] flex items-center justify-center overflow-hidden">
                      <Sparkles className="w-8 h-8 text-amber-300 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-amber-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-400">
                      LVL {MOCK_CHILD_REPORT.level}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase">Guardian Oversight</span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">{MOCK_CHILD_REPORT.studentName}</h2>
                    <p className="text-xs text-teal-300 font-semibold flex items-center justify-center sm:justify-start gap-1">
                      <GraduationCap className="w-4.5 h-4.5 text-teal-400" /> {MOCK_CHILD_REPORT.characterTitle}
                    </p>
                  </div>
                </div>

                {/* Center: Co-branded School crest */}
                <div className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-zinc-950/60 border border-zinc-900 max-w-sm w-full lg:w-auto">
                  <Building className="w-7 h-7 text-zinc-500" />
                  <div className="text-left text-xs">
                    <span className="font-extrabold text-zinc-300 block leading-tight">{MOCK_CHILD_REPORT.schoolName}</span>
                    <span className="text-zinc-500 block mt-0.5">{MOCK_CHILD_REPORT.board} • Class {MOCK_CHILD_REPORT.class}-{MOCK_CHILD_REPORT.section}</span>
                  </div>
                </div>

                {/* Right: Action widgets */}
                <div className="flex items-center gap-3 w-full lg:w-auto shrink-0 justify-center">
                  <div className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-2xl text-center shrink-0">
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">Available Credits</span>
                    <span className="text-lg font-black text-white block mt-0.5">1 Quest</span>
                  </div>
                  <button 
                    onClick={() => setShowBillingModal(true)}
                    className="flex-grow lg:flex-grow-0 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-xs tracking-wider transition-all hover:shadow-[0_0_20px_rgba(20,184,166,0.3)] flex items-center justify-center gap-1.5 transform active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add Quest Credits
                  </button>
                </div>

              </div>
            </div>

            {/* TAB SELECTOR BAR */}
            <div className="flex border-b border-zinc-900 overflow-x-auto pb-px">
              {[
                { id: 'overview', label: 'Summary' },
                { id: 'constellation', label: 'Character Radar' },
                { id: 'pathways', label: 'Career Guidance' },
                { id: 'timeline', label: 'Quest Journey' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    activeTab === tab.id 
                      ? 'border-amber-500 text-amber-400 bg-amber-500/5' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  {/* Actionable Parent advice */}
                  <div className="glassmorphism p-6 rounded-3xl space-y-6">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BrainCircuit className="w-5 h-5 text-amber-400" /> Guardian Guidance Summary
                    </h3>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Vedant shows an exceptional affinity for analytical puzzle solving and design integration (classified as a <span className="text-amber-400 font-bold">Thinker-Creator Hybrid</span>).
                    </p>
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2">
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">Recommended Actions</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Nurture their problem-solving traits by encouraging hands-on creation. Buy them technical modular sets (e.g. Arduino, robotics) or enroll them in spatial UI workshops.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Stream Alignment</span>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Recommended Stream for Class 11 & 12 is <span className="text-white font-bold">Science with Computer Science</span> or a design/engineering vocational path.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Character stats summary */}
                  <div className="glassmorphism p-6 rounded-3xl space-y-6">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Award className="w-5 h-5 text-teal-400" /> Top Dominant Talents
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'The Thinker', val: 88, desc: 'Curious, loves data mapping, math and logic puzzles.', color: 'bg-blue-500' },
                        { label: 'The Creator', val: 75, desc: 'Expressive, visualizes futuristic drone aesthetics and media.', color: 'bg-purple-500' },
                        { label: 'The Builder', val: 65, desc: 'Enjoys mechanics, structures, and direct calibration work.', color: 'bg-red-500' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-zinc-200">{item.label}</span>
                            <span className="text-zinc-400">{item.val}%</span>
                          </div>
                          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: `${item.val}%` }} />
                          </div>
                          <p className="text-[10px] text-zinc-500">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'constellation' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
                >
                  {/* Constellation SVG radar */}
                  <div className="lg:col-span-5 flex justify-center">
                    <div className="glassmorphism p-6 rounded-3xl relative w-full max-w-sm flex flex-col items-center">
                      <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Spectrum Radar Map</h4>
                      <div className="relative w-80 h-72">
                        <svg className="w-full h-full" viewBox="0 0 300 260">
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
                                stroke="rgba(255, 255, 255, 0.04)"
                                strokeWidth="1"
                              />
                            );
                          })}

                          {/* Constellation lines */}
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
                                stroke="rgba(255, 255, 255, 0.04)"
                                strokeWidth="1.5"
                              />
                            );
                          })}

                          {/* Calculated polygon */}
                          <polygon
                            points={polygonPointsString}
                            fill="rgba(245, 158, 11, 0.15)"
                            stroke="rgba(245, 158, 11, 0.6)"
                            strokeWidth="2.5"
                            className="drop-shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                          />

                          {/* Vertex Nodes */}
                          {points.map((p, i) => (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4.5"
                                fill={axes[i].color}
                              />
                              <text
                                x={cx + 1.25 * maxRadius * Math.cos((i * 2 * Math.PI) / 6 - Math.PI / 2)}
                                y={cy + 1.15 * maxRadius * Math.sin((i * 2 * Math.PI) / 6 - Math.PI / 2) + 3}
                                fill="#888"
                                fontSize="8"
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
                  </div>

                  {/* Dimension breakdown cards */}
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Constellation Dimensions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {axes.map((axis, i) => {
                        const score = MOCK_CHILD_REPORT.hollandPercentages[axis.name as keyof typeof MOCK_CHILD_REPORT.hollandPercentages] || 50;
                        return (
                          <div key={i} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-2 hover:border-zinc-800 transition-all">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <span style={{ color: axis.color }}>●</span> {axis.name}
                              </span>
                              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/25">{score}%</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-relaxed">
                              {axis.name === 'The Builder' && 'Enjoys using tools, manufacturing hardware, or repairing drones.'}
                              {axis.name === 'The Thinker' && 'Loves scientific coding, computing systems, genetics, and algorithms.'}
                              {axis.name === 'The Creator' && 'Passionate about custom UI themes, interactive VR landscapes, and design.'}
                              {axis.name === 'The Connector' && 'Eager to collaborate, train teammates, and run interactive workshops.'}
                              {axis.name === 'The Leader' && 'Motivated to launch new start-ups, direct crews, and pitch solutions.'}
                              {axis.name === 'The Organizer' && 'Prefers clean spreadsheets, system files, audits, and checklists.'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </motion.div>
              )}

              {activeTab === 'pathways' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Compass className="w-5 h-5 text-teal-400" /> Actionable Carrier Pathways
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_CHILD_REPORT.careerRecommendations.map((career, idx) => (
                      <div key={idx} className="glassmorphism p-6 rounded-3xl border border-zinc-850 hover:border-zinc-700 transition-all flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent -z-10" />
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">{career.stream}</span>
                              <h4 className="text-lg font-bold text-white mt-1">{career.title}</h4>
                            </div>
                            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
                              {career.fitScore}% Match
                            </span>
                          </div>
                          
                          <p className="text-xs text-zinc-400 leading-relaxed">{career.description}</p>
                          
                          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-1.5">
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">ParentAction Guidance:</span>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">{career.guidance}</p>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-900/60 flex justify-between text-[10px] text-zinc-500">
                          <span>Top Colleges: <strong className="text-zinc-300">{career.topColleges}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'timeline' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-2xl mx-auto space-y-8 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800"
                >
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Historical Evaluations</h3>
                  
                  {MOCK_CHILD_REPORT.assessmentsHistory.map((item, idx) => (
                    <div key={idx} className="relative pl-10 space-y-2">
                      {/* Timeline dot */}
                      <span className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-black -translate-x-1/2 ring-4 ring-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.date}</span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-850 text-[9px] font-bold text-zinc-400">{item.type}</span>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-900 space-y-1 max-w-lg">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-white">{item.description}</h4>
                          <span className="text-xs font-black text-amber-400">Score: {item.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* BILLING & MOCK RAZORPAY MODAL */}
      <AnimatePresence>
        {showBillingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBillingModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-950 border border-zinc-850 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 space-y-6"
            >
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-teal-500 to-emerald-500" />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-extrabold text-white">Purchase Assessment Credits</h3>
                  <p className="text-xs text-zinc-500 mt-1">Acquire direct B2C evaluations to reassess your child over time.</p>
                </div>
                <button 
                  onClick={() => setShowBillingModal(false)}
                  className="text-zinc-500 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {paymentSuccess ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center mx-auto text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-extrabold text-teal-400">Payment Processed Successfully!</h4>
                  <p className="text-xs text-zinc-500">Credits have been assigned and linked to your child's student ledger.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Select Plan */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">Select Plan Pack</label>
                    <div className="space-y-2.5">
                      {B2C_PLANS.map((plan) => (
                        <div 
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                            selectedPlan.id === plan.id 
                              ? 'bg-teal-500/5 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.05)]' 
                              : 'bg-black/40 border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-extrabold text-white">{plan.name}</span>
                              {plan.popular && (
                                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-[8px] font-extrabold text-teal-400 uppercase">Best Value</span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 leading-snug">{plan.description}</p>
                          </div>
                          <span className="text-sm font-black text-white shrink-0 ml-4">₹{plan.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Gateway Mock */}
                  <div className="p-4 rounded-2xl bg-black/80 border border-zinc-900 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-500" /> Checkout Gateway (Simulated Razorpay)
                      </span>
                      <span className="text-xs font-black text-white">Total: ₹{selectedPlan.price}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'upi', label: 'UPI / QR', icon: <Coins className="w-3.5 h-3.5" /> },
                        { id: 'card', label: 'Card Payment', icon: <CreditCard className="w-3.5 h-3.5" /> },
                        { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-3.5 h-3.5" /> }
                      ].map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id as any)}
                          className={`py-2 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                            selectedPaymentMethod === method.id
                              ? 'bg-zinc-800 border-zinc-700 text-white'
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {method.icon}
                          <span>{method.label}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleCheckout}
                      disabled={isProcessingPayment}
                      className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_4px_15px_rgba(20,184,166,0.15)] flex items-center justify-center gap-1.5"
                    >
                      {isProcessingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Routing Transaction...</span>
                        </>
                      ) : (
                        <>
                          <span>Pay Securely ₹{selectedPlan.price}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/20 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-zinc-500">
          <p>© 2026 PsyMetric Enterprise. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-zinc-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-300 cursor-pointer">Privacy Policy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
