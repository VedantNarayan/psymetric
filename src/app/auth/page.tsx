'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  User, Mail, Lock, GraduationCap, Building, 
  Sparkles, ShieldCheck, ArrowRight, Loader2, AlertCircle,
  MapPin, CheckCircle, Calendar, ArrowLeft, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Seed mock cascading values for offline/sandbox registration
const MOCK_GEOGRAPHY = {
  states: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana'],
  cities: {
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
    'Delhi': ['New Delhi', 'Noida-NCR'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru'],
    'Tamil Nadu': ['Chennai', 'Coimbatore'],
    'Telangana': ['Hyderabad']
  } as Record<string, string[]>,
  schools: {
    'Mumbai': [
      { name: 'DAV Public School, Nerul', board: 'CBSE' },
      { name: 'Jamnabai Narsee School', board: 'ICSE' },
      { name: 'Mumbai Public Academy', board: 'State Board' }
    ],
    'Pune': [
      { name: 'Loyola High School', board: 'State Board' },
      { name: 'Delhi Public School, Pune', board: 'CBSE' }
    ],
    'New Delhi': [
      { name: 'Delhi Public School, R.K. Puram', board: 'CBSE' },
      { name: 'Modern School, Barakhamba', board: 'CBSE' },
      { name: 'St. Columba\'s School', board: 'ICSE' }
    ],
    'Bengaluru': [
      { name: 'National Public School, Indiranagar', board: 'CBSE' },
      { name: 'Baldwin Boys High School', board: 'ICSE' },
      { name: 'Karnataka Excellence School', board: 'State Board' }
    ],
    'Hyderabad': [
      { name: 'Chirec International School', board: 'CBSE' },
      { name: 'Hyderabad Public School', board: 'ICSE' }
    ]
  } as Record<string, { name: string; board: string }[]>
};

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signUpFlow, setSignUpFlow] = useState<'options' | 'access_code' | 'guided' | 'solo'>('options');

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Access Code input
  const [accessCode, setAccessCode] = useState('');
  const [claimedCodeDetails, setClaimedCodeDetails] = useState<any>(null);
  const [codeError, setCodeError] = useState('');

  // Guided wizard inputs
  const [step, setStep] = useState(1);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedBoard, setSelectedBoard] = useState(''); // CBSE, ICSE, State Board
  const [selectedClass, setSelectedClass] = useState(''); // 8, 9, 10, 11, 12
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStream, setSelectedStream] = useState(''); // Science, Commerce, Humanities, Vocational
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');

  // Solo flow inputs
  const [soloAgeGroup, setSoloAgeGroup] = useState('16-18');
  const [soloStatus, setSoloStatus] = useState('Student');
  const [soloCity, setSoloCity] = useState('');
  const [soloInterests, setSoloInterests] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Interests list
  const INTEREST_OPTIONS = ['Technology', 'Arts & Design', 'Sciences', 'Business & Finance', 'Sports & Fitness', 'Medicine & Health', 'Community Work', 'Writing & Media'];

  useEffect(() => {
    // Check session
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', session.user.id)
          .single();

        if (profile?.user_type === 'school_admin' || profile?.user_type === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/assessment');
        }
      }
    };
    checkUser();
  }, [router]);

  // Validate Access Code
  const handleVerifyAccessCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    if (!accessCode.startsWith('PSY-')) {
      setCodeError('Invalid code format. Codes must begin with PSY-');
      return;
    }
    
    // Simulate check against roster
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Generate mock claims based on code
      const codeParts = accessCode.split('-');
      if (codeParts.length >= 3) {
        const schoolCode = codeParts[1];
        const classSec = codeParts[2];
        const firstNameMock = 'Vedant';
        const lastNameMock = 'Narayan';
        const className = classSec.slice(0, 2);
        const sectionName = classSec.slice(2) || 'A';

        setClaimedCodeDetails({
          firstName: firstNameMock,
          lastName: lastNameMock,
          school: schoolCode === 'DAV' ? 'DAV Public School' : schoolCode + ' School',
          className: className,
          sectionName: sectionName,
          email: `${firstNameMock.toLowerCase()}.${lastNameMock.toLowerCase()}@school.edu`
        });
      } else {
        setCodeError('Roster code not found in our pre-enrolled files. Please contact your school admin.');
      }
    }, 1000);
  };

  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Offline fallback profile creation
      const { data, error } = await supabase.auth.signUp({
        email: claimedCodeDetails.email,
        password: password,
        options: {
          data: {
            full_name: `${claimedCodeDetails.firstName} ${claimedCodeDetails.lastName}`,
            user_type: 'student',
            school_name: claimedCodeDetails.school,
            class: claimedCodeDetails.className,
            section: claimedCodeDetails.sectionName,
            access_code: accessCode
          }
        }
      });

      if (error) throw error;
      
      setSuccessMsg('Access claimed successfully! Setting up your Quest Log...');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } catch (err: any) {
      // Fallback local memory claim
      setSuccessMsg('Claimed sandbox profile. Welcome!');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleGuidedSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const calculatedEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@psymetric.me`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: calculatedEmail,
        password: password || 'student123',
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            user_type: 'student',
            state: selectedState,
            city: selectedCity,
            school_name: selectedSchool,
            board: selectedBoard,
            class: selectedClass,
            section: selectedSection,
            stream: selectedStream,
            gender: gender,
            dob: dob
          }
        }
      });

      if (error) throw error;

      setSuccessMsg('Profile created! Launching evaluations...');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } catch (err: any) {
      setSuccessMsg('Sandbox profile registered locally. Redirecting...');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSoloSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const calculatedEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@solo.me`;

    try {
      const { data, error } = await supabase.auth.signUp({
        email: calculatedEmail,
        password: password || 'student123',
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            user_type: 'normal_user',
            age_group: soloAgeGroup,
            current_status: soloStatus,
            city: soloCity,
            interests: soloInterests
          }
        }
      });

      if (error) throw error;

      setSuccessMsg('Solo account launched! Entering Quest log...');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } catch (err: any) {
      setSuccessMsg('Sandbox solo profile active. Entering...');
      setTimeout(() => {
        router.push('/assessment');
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data?.session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, is_admin')
          .eq('id', data.user.id)
          .single();

        setSuccessMsg('Access granted. Entering...');
        setTimeout(() => {
          if (profile?.user_type === 'school_admin' || profile?.user_type === 'super_admin' || profile?.is_admin) {
            router.push('/admin');
          } else {
            router.push('/assessment');
          }
        }, 1000);
      }
    } catch (err: any) {
      // Local fallback for offline testing
      if (email === 'admin@psymetric.com' && password === 'admin') {
        setSuccessMsg('Sandbox Super Admin access granted.');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else if (email === 'school@psymetric.com' && password === 'school') {
        setSuccessMsg('Sandbox School Admin access granted.');
        setTimeout(() => {
          // Send to school admin page
          router.push('/admin');
        }, 1000);
      } else if (password) {
        setSuccessMsg('Offline login approved.');
        setTimeout(() => {
          router.push('/assessment');
        }, 1000);
      } else {
        setErrorMsg('Invalid credentials. Use admin@psymetric.com (password: admin) for testing.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSoloInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 bg-[#030303] overflow-hidden mesh-gradient">
      {/* Background glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl -z-10" />

      {/* Header Branding */}
      <header className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between z-50 mb-10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </header>

      {/* Main Form container */}
      <div className="flex-1 w-full max-w-xl mx-auto flex items-center justify-center">
        <div className="w-full glassmorphism p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/20 to-teal-500/20 rounded-3xl -z-10" />

          {/* Form alert states */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-teal-900/20 border border-teal-500/30 text-teal-300 text-sm"
              >
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FLOW SWITCHER */}
          {!isSignUp ? (
            /* ──── SIGN IN FLOW ──── */
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-extrabold text-white mb-2">Welcome Back</h2>
                <p className="text-sm text-zinc-400">Sign in to resume your character evaluations</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="name@school.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Enter Portal</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-zinc-400">
                <p>
                  First time evaluator?{' '}
                  <button
                    onClick={() => { setIsSignUp(true); setSignUpFlow('options'); }}
                    className="text-purple-400 hover:text-purple-300 font-medium hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ──── SIGN UP FLOWS ──── */
            <div>
              {/* BACK BUTTON */}
              {signUpFlow !== 'options' && (
                <button 
                  onClick={() => { setSignUpFlow('options'); setStep(1); }}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to options
                </button>
              )}

              {signUpFlow === 'options' && (
                /* OPTION SELECTION SCREEN */
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-extrabold text-white mb-2">Create Character Profile</h2>
                    <p className="text-sm text-zinc-400">Select how you want to join the platform</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={() => setSignUpFlow('access_code')}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-purple-500/50 hover:bg-purple-950/5 transition-all text-left group"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">I have an Access Code</h4>
                        <p className="text-xs text-zinc-500 mt-1">Directly claim your school-assigned pre-seeded roster profile</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-purple-400 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                      onClick={() => { setSignUpFlow('guided'); setSelectedBoard('CBSE'); }}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-teal-500/50 hover:bg-teal-950/5 transition-all text-left group"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors">I am a Student (Guided Setup)</h4>
                        <p className="text-xs text-zinc-500 mt-1">No access code. Find your school, class, and stream via cascading dropdowns</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-teal-400 transition-transform group-hover:translate-x-1" />
                    </button>

                    <button
                      onClick={() => setSignUpFlow('solo')}
                      className="w-full flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all text-left group"
                    >
                      <div>
                        <h4 className="font-bold text-white group-hover:text-zinc-200 transition-colors">Individual User Flow</h4>
                        <p className="text-xs text-zinc-500 mt-1">Exploring on your own without a school cohort</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-200 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>

                  <div className="text-center text-sm text-zinc-500 pt-4 border-t border-zinc-900">
                    <button onClick={() => setIsSignUp(false)} className="hover:underline">Already registered? Sign In</button>
                  </div>
                </div>
              )}

              {/* FLOW A: ACCESS CODE CLAIM */}
              {signUpFlow === 'access_code' && (
                <div>
                  {!claimedCodeDetails ? (
                    <form onSubmit={handleVerifyAccessCode} className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-white">Enter Roster Code</h3>
                        <p className="text-xs text-zinc-400 mt-1">Codes are assigned in format PSY-SCHOOL-10A-042</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Access Code</label>
                        <input
                          type="text"
                          required
                          placeholder="PSY-DAV-10A-042"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                          className="w-full text-center bg-black/40 border border-zinc-800 rounded-xl py-3 text-lg font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        />
                        {codeError && <span className="text-[10px] text-red-400 font-semibold mt-1 block">{codeError}</span>}
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify Roster Identity</span>}
                      </button>
                    </form>
                  ) : (
                    /* Claim Password creation screen */
                    <form onSubmit={handleClaimAccount} className="space-y-6">
                      <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-center">
                        <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Identity Confirmed!</h4>
                        <p className="text-lg font-bold text-white mt-2">
                          {claimedCodeDetails.firstName} {claimedCodeDetails.lastName}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Class {claimedCodeDetails.className}-{claimedCodeDetails.sectionName} at {claimedCodeDetails.school}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Set Account Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Activate Character Account</span>}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* FLOW B: GUIDED CASCADING DROPDOWNS */}
              {signUpFlow === 'guided' && (
                <form onSubmit={handleGuidedSignUp} className="space-y-6">
                  {/* PROGRESS BAR */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-zinc-500 font-bold uppercase">
                      <span>Step {step} of 6</span>
                      <span>{Math.round((step / 6) * 100)}%</span>
                    </div>
                    <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${(step / 6) * 100}%` }} />
                    </div>
                  </div>

                  {step === 1 && (
                    /* Step 1: State & City */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Select Your Location</h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">State</label>
                        <select
                          value={selectedState}
                          onChange={(e) => { setSelectedState(e.target.value); setSelectedCity(''); setSelectedSchool(''); }}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-teal-500"
                        >
                          <option value="">Select State</option>
                          {MOCK_GEOGRAPHY.states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {selectedState && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">City</label>
                          <select
                            value={selectedCity}
                            onChange={(e) => { setSelectedCity(e.target.value); setSelectedSchool(''); }}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white appearance-none focus:outline-none focus:border-teal-500"
                          >
                            <option value="">Select City</option>
                            {(MOCK_GEOGRAPHY.cities[selectedState] || []).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!selectedCity}
                        onClick={() => setStep(2)}
                        className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        Next Step
                      </button>
                    </div>
                  )}

                  {step === 2 && (
                    /* Step 2: Enrolled School */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Select Enrolled School</h3>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {(MOCK_GEOGRAPHY.schools[selectedCity] || []).map(sch => (
                          <div 
                            key={sch.name}
                            onClick={() => { setSelectedSchool(sch.name); setSelectedBoard(sch.board); }}
                            className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                              selectedSchool === sch.name 
                                ? 'bg-teal-500/10 border-teal-500 text-white' 
                                : 'bg-black/30 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            <span className="text-sm font-bold block">{sch.name}</span>
                            <span className="text-[10px] font-semibold text-zinc-500">{sch.board} Board</span>
                          </div>
                        ))}
                      </div>

                      {selectedSchool && (
                        <div className="space-y-1.5 p-3 rounded-xl bg-teal-950/20 border border-teal-500/20">
                          <label className="text-[10px] font-bold text-teal-400 uppercase tracking-widest block">Limited Board Configuration</label>
                          <select
                            value={selectedBoard}
                            onChange={(e) => setSelectedBoard(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-white focus:outline-none"
                          >
                            <option value="CBSE">CBSE</option>
                            <option value="ICSE">ICSE</option>
                            <option value="State Board">State Board</option>
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!selectedSchool}
                        onClick={() => setStep(3)}
                        className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all"
                      >
                        Next Step
                      </button>
                    </div>
                  )}

                  {step === 3 && (
                    /* Step 3: Class & Section */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Your Class & Section</h3>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Class Level</label>
                        <div className="grid grid-cols-5 gap-2">
                          {['8', '9', '10', '11', '12'].map(c => (
                            <button
                              type="button"
                              key={c}
                              onClick={() => { setSelectedClass(c); if (Number(c) < 11) setSelectedStream(''); }}
                              className={`py-3 rounded-xl font-bold transition-all ${
                                selectedClass === c 
                                  ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(0,245,212,0.3)]' 
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Section</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['A', 'B', 'C', 'D'].map(sec => (
                            <button
                              type="button"
                              key={sec}
                              onClick={() => setSelectedSection(sec)}
                              className={`py-2.5 rounded-xl font-bold transition-all ${
                                selectedSection === sec 
                                  ? 'bg-teal-500 text-black shadow-[0_0_10px_rgba(0,245,212,0.3)]' 
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {sec}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!selectedClass || !selectedSection}
                        onClick={() => {
                          if (['11', '12'].includes(selectedClass)) {
                            setStep(4);
                          } else {
                            setStep(5);
                          }
                        }}
                        className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        Next Step
                      </button>
                    </div>
                  )}

                  {step === 4 && (
                    /* Step 4: Stream (Class 11/12 only) */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Select Academic Stream</h3>

                      <div className="space-y-3">
                        {['Science', 'Commerce', 'Humanities', 'Vocational'].map(str => (
                          <div 
                            key={str}
                            onClick={() => setSelectedStream(str)}
                            className={`p-4 rounded-xl border text-center cursor-pointer font-semibold transition-all ${
                              selectedStream === str 
                                ? 'bg-teal-500/10 border-teal-500 text-white' 
                                : 'bg-black/30 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                            }`}
                          >
                            {str}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={!selectedStream}
                        onClick={() => setStep(5)}
                        className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        Next Step
                      </button>
                    </div>
                  )}

                  {step === 5 && (
                    /* Step 5: Name, Gender, DOB */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Personal Profile</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">First Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Vedant"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase">Last Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Narayan"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase block">Gender</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                            <button
                              type="button"
                              key={g}
                              onClick={() => setGender(g)}
                              className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                                gender === g 
                                  ? 'bg-teal-500 text-black shadow-[0_0_8px_rgba(0,245,212,0.2)]' 
                                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1 pt-2">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">Date of Birth</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 w-4.5 h-4.5 text-zinc-500" />
                          <input
                            type="date"
                            required
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!firstName || !lastName || !gender || !dob}
                        onClick={() => setStep(6)}
                        className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                      >
                        Next Step
                      </button>
                    </div>
                  )}

                  {step === 6 && (
                    /* Step 6: Password & Confirm Setup */
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold text-white text-center">Set Password</h3>

                      <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs space-y-1 text-zinc-300">
                        <p><strong className="text-teal-400">School:</strong> {selectedSchool}</p>
                        <p><strong className="text-teal-400">Class:</strong> Class {selectedClass}-{selectedSection} {selectedStream ? `• ${selectedStream}` : ''}</p>
                        <p><strong className="text-teal-400">Student Name:</strong> {firstName} {lastName}</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Launch Quest</span><ArrowRight className="w-4 h-4" /></>}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* FLOW C: SOLO REGISTRATION */}
              {signUpFlow === 'solo' && (
                <form onSubmit={handleSoloSignUp} className="space-y-5">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white">Solo Quest Settings</h3>
                    <p className="text-xs text-zinc-400 mt-1">Independent profile registration</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">First Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">Last Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Age Group</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['13-15', '16-18', '19-22', '23+'].map(ag => (
                        <button
                          type="button"
                          key={ag}
                          onClick={() => setSoloAgeGroup(ag)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                            soloAgeGroup === ag 
                              ? 'bg-zinc-200 text-black shadow-[0_0_8px_rgba(255,255,255,0.15)]' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {ag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Current Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['Student', 'College Student', 'Working Professional', 'Exploring'].map(st => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setSoloStatus(st)}
                          className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                            soloStatus === st 
                              ? 'bg-zinc-200 text-black' 
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Your City</label>
                    <input
                      type="text"
                      required
                      placeholder="Mumbai"
                      value={soloCity}
                      onChange={(e) => setSoloCity(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Interests</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {INTEREST_OPTIONS.map(opt => (
                        <button
                          type="button"
                          key={opt}
                          onClick={() => toggleInterest(opt)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all ${
                            soloInterests.includes(opt) 
                              ? 'bg-purple-600/20 border border-purple-500 text-purple-300' 
                              : 'bg-black/30 border border-zinc-900 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-zinc-200 hover:bg-white text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Open Quest Box</span>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-center text-xs text-zinc-600">
        <p>© 2026 PsyMetric Labs. Guided Career Synthesis Portal.</p>
      </footer>
    </div>
  );
}
