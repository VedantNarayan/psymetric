'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  User, Mail, Lock, GraduationCap, Building, 
  Sparkles, ShieldCheck, ArrowRight, Loader2, AlertCircle,
  MapPin, CheckCircle, Calendar, ArrowLeft, RefreshCw, Smartphone, KeyRound, Check, X
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
  const [signUpFlow, setSignUpFlow] = useState<'options' | 'access_code' | 'guided' | 'solo'>('options');

  // Login inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [phoneLoginType, setPhoneLoginType] = useState<'password' | 'otp'>('otp');
  const [phoneLoginOtpCode, setPhoneLoginOtpCode] = useState('');
  const [phoneLoginOtpRequested, setPhoneLoginOtpRequested] = useState(false);

  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpOtpRequested, setSignUpOtpRequested] = useState(false);
  const [signUpOtpCode, setSignUpOtpCode] = useState('');

  // Access Code input
  const [accessCode, setAccessCode] = useState('');
  const [claimedCodeDetails, setClaimedCodeDetails] = useState<any>(null);
  const [codeError, setCodeError] = useState('');

  // Forgot Password input
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');

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
  const [authRedirecting, setAuthRedirecting] = useState(false);

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
          router.push('/dashboard');
        }
      }
    };
    checkUser();

    // Check if redirected from reset success
    const query = new URLSearchParams(window.location.search);
    if (query.get('reset') === 'success') {
      setSuccessMsg('Your password was updated successfully. Please sign in.');
    }
  }, [router]);

  // Format phone number utility
  const formatPhoneNumber = (num: string) => {
    let formatted = num.trim();
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10 && /^\d+$/.test(formatted)) {
        formatted = `+91${formatted}`;
      } else if (/^\d+$/.test(formatted)) {
        formatted = `+${formatted}`;
      }
    }
    return formatted;
  };

  // Validate Access Code via Database RPC function
  const handleVerifyAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    if (!accessCode.trim()) {
      setCodeError('Access code cannot be empty.');
      return;
    }
    
    setLoading(true);
    try {
      const { data: rosterRows, error } = await supabase
        .rpc('verify_roster_code', { p_access_code: accessCode.trim() });

      if (error) throw error;

      if (!rosterRows || rosterRows.length === 0) {
        setCodeError('Access code is invalid, or has already been claimed.');
        return;
      }

      const roster = rosterRows[0];
      const details = {
        id: roster.id,
        firstName: roster.first_name,
        lastName: roster.last_name,
        school: roster.school_name || 'School',
        className: roster.class_name || '',
        sectionName: roster.section_name || '',
        email: `${roster.first_name.toLowerCase()}.${roster.last_name.toLowerCase()}@school.edu`
      };
      setClaimedCodeDetails(details);
      setSignUpEmail(details.email);
    } catch (err: any) {
      setCodeError(err.message || 'Error checking access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Claim Account
  const handleClaimAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const signUpParams: any = {
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
      };

      if (signUpMethod === 'email') {
        signUpParams.email = signUpEmail || claimedCodeDetails.email;
        const { data, error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSuccessMsg('Account claimed successfully! Setting up your Quest Log...');
        setTimeout(() => { router.push('/dashboard'); }, 1500);
      } else {
        const formattedPhone = formatPhoneNumber(signUpPhone);
        signUpParams.phone = formattedPhone;
        const { data, error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSignUpOtpRequested(true);
        setSuccessMsg('OTP verification code sent to your phone number!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Sign Up OTP (for phone registrations)
  const handleVerifySignUpOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const phoneVal = signUpMethod === 'email' ? '' : formatPhoneNumber(signUpPhone);
      const { error } = await supabase.auth.verifyOtp({
        phone: phoneVal,
        token: signUpOtpCode,
        type: 'signup'
      });
      if (error) throw error;

      setSuccessMsg('Phone verified successfully! Entering portal...');
      setTimeout(() => { router.push('/dashboard'); }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid OTP code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Guided Student Sign Up
  const handleGuidedSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const signUpParams: any = {
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
      };

      if (signUpMethod === 'email') {
        signUpParams.email = signUpEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@psymetric.me`;
        const { error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSuccessMsg('Profile created! Launching evaluations...');
        setTimeout(() => { router.push('/dashboard'); }, 1500);
      } else {
        const formattedPhone = formatPhoneNumber(signUpPhone);
        signUpParams.phone = formattedPhone;
        const { error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSignUpOtpRequested(true);
        setSuccessMsg('Verification OTP code sent to your phone!');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error registering profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Solo Sign Up
  const handleSoloSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const signUpParams: any = {
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
      };

      if (signUpMethod === 'email') {
        signUpParams.email = signUpEmail || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@solo.me`;
        const { error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSuccessMsg('Solo account launched! Entering Quest log...');
        setTimeout(() => { router.push('/dashboard'); }, 1500);
      } else {
        const formattedPhone = formatPhoneNumber(signUpPhone);
        signUpParams.phone = formattedPhone;
        const { error } = await supabase.auth.signUp(signUpParams);
        if (error) throw error;
        setSignUpOtpRequested(true);
        setSuccessMsg('Verification OTP code sent to your phone number.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error launching solo account.');
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (loginMethod === 'email') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        handleSignInRedirect(data);
      } else {
        const formattedPhone = formatPhoneNumber(phone);
        if (phoneLoginType === 'otp') {
          if (!phoneLoginOtpRequested) {
            // Request OTP
            const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
            if (error) throw error;
            setPhoneLoginOtpRequested(true);
            setSuccessMsg('OTP Code has been sent to your mobile phone!');
          } else {
            // Verify OTP
            const { data, error } = await supabase.auth.verifyOtp({
              phone: formattedPhone,
              token: phoneLoginOtpCode,
              type: 'sms'
            });
            if (error) throw error;
            handleSignInRedirect(data);
          }
        } else {
          // Phone password sign in
          const { data, error } = await supabase.auth.signInWithPassword({ phone: formattedPhone, password });
          if (error) throw error;
          handleSignInRedirect(data);
        }
      }
    } catch (err: any) {
      // Local fallback ONLY for local testing with exact sandbox credentials
      if (loginMethod === 'email' && email === 'admin@psymetric.com' && password === 'admin') {
        setSuccessMsg('Sandbox Super Admin access granted.');
        setTimeout(() => { router.push('/admin'); }, 1000);
      } else if (loginMethod === 'email' && email === 'school@psymetric.com' && password === 'school') {
        setSuccessMsg('Sandbox School Admin access granted.');
        setTimeout(() => { router.push('/admin'); }, 1000);
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignInRedirect = async (data: any) => {
    if (data?.session || data?.user) {
      const user = data.user || data.session?.user;
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, is_admin')
        .eq('id', user.id)
        .single();

      setSuccessMsg('Access granted. Entering...');
      setTimeout(() => {
        if (profile?.user_type === 'school_admin' || profile?.user_type === 'super_admin' || profile?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }, 1000);
    }
  };

  // Forgot Password Link request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });
      if (error) throw error;
      setSuccessMsg('Recovery email sent! Please check your inbox for the reset link.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending password reset email.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Interest
  const toggleInterest = (interest: string) => {
    setSoloInterests(prev => 
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: "Discover Your Archetype",
      description: "Complete cinematic decision scenarios to map your RIASEC character constellation and cognitive traits."
    },
    {
      title: "Explore Premium Paths",
      description: "Filter and analyze career dimensions, salary statistics, and industry growth vectors tailored for you."
    },
    {
      title: "Connect with Experts",
      description: "Chat in peer guilds or schedule informational sessions with verified mentors from leading companies."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-zinc-800' };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    
    switch (score) {
      case 0:
      case 1:
        return { score: 25, label: 'Weak', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Fair', color: 'bg-orange-500' };
      case 3:
        return { score: 75, label: 'Good', color: 'bg-yellow-500' };
      case 4:
        return { score: 100, label: 'Strong', color: 'bg-teal-400' };
      default:
        return { score: 0, label: '', color: 'bg-zinc-800' };
    }
  };

  const getPasswordChecks = (pwd: string) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd)
    };
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setAuthRedirecting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In failed.');
      setAuthRedirecting(false);
    }
  };

  const renderPasswordChecker = (pwd: string) => {
    const checks = getPasswordChecks(pwd);
    return (
      <div className="space-y-2.5 mt-2">
        <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>Password Strength</span>
          <span className="text-zinc-400">{getPasswordStrength(pwd).label}</span>
        </div>
        <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getPasswordStrength(pwd).color} transition-all duration-300`} 
            style={{ width: `${getPasswordStrength(pwd).score}%` }} 
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-500 font-semibold border-t border-zinc-900/60 pt-2.5">
          <div className="flex items-center gap-1.5">
            {checks.length ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <X className="w-3.5 h-3.5 text-zinc-700" />}
            <span className={checks.length ? 'text-zinc-300' : ''}>8+ Characters</span>
          </div>
          <div className="flex items-center gap-1.5">
            {checks.uppercase ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <X className="w-3.5 h-3.5 text-zinc-700" />}
            <span className={checks.uppercase ? 'text-zinc-300' : ''}>Uppercase Letter</span>
          </div>
          <div className="flex items-center gap-1.5">
            {checks.number ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <X className="w-3.5 h-3.5 text-zinc-700" />}
            <span className={checks.number ? 'text-zinc-300' : ''}>One Number</span>
          </div>
          <div className="flex items-center gap-1.5">
            {checks.special ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <X className="w-3.5 h-3.5 text-zinc-700" />}
            <span className={checks.special ? 'text-zinc-300' : ''}>Special Character</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#030303] overflow-hidden">
      
      {/* Google Auth frosted redirection overlay */}
      <AnimatePresence>
        {authRedirecting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white"
          >
            <div className="p-8 glassmorphism rounded-3xl border border-white/5 text-center space-y-4 max-w-sm">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
              <h3 className="font-extrabold text-lg">Connecting with Google</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">Establishing secure connection handshake. Please complete authentication in the popup window.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT PANEL: CINEMATIC VISUAL CANVAS (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 bg-[#05050c] relative flex-col justify-between p-12 border-r border-zinc-900/60 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-teal-600/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-2 cursor-pointer z-10" onClick={() => router.push('/')}>
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="w-72 h-72 opacity-30 absolute mb-20"
          >
            <svg className="w-full h-full" viewBox="0 0 300 300">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, sIdx) => (
                <circle key={sIdx} cx="150" cy="150" r={scale * 100} fill="none" stroke="rgba(157, 78, 221, 0.12)" strokeWidth="1" />
              ))}
              {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
                const rad = (angle * Math.PI) / 180;
                const x = 150 + 100 * Math.cos(rad);
                const y = 150 + 100 * Math.sin(rad);
                return <line key={idx} x1="150" y1="150" x2={x} y2={y} stroke="rgba(0, 245, 212, 0.08)" strokeWidth="1" />;
              })}
              <polygon 
                points="150,80 220,120 200,190 120,200 90,140" 
                fill="rgba(157, 78, 221, 0.03)" 
                stroke="rgba(0, 245, 212, 0.25)" 
                strokeWidth="1.5" 
                strokeDasharray="4 2"
              />
              <circle cx="150" cy="80" r="4" fill="#a855f7" />
              <circle cx="220" cy="120" r="4" fill="#3b82f6" />
              <circle cx="200" cy="190" r="4" fill="#22c55e" />
              <circle cx="120" cy="200" r="4" fill="#f59e0b" />
              <circle cx="90" cy="140" r="4" fill="#ef4444" />
            </svg>
          </motion.div>
          
          <div className="z-10 text-center max-w-sm mt-56 relative h-32 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className="space-y-2.5"
              >
                <h3 className="text-base font-extrabold text-white tracking-wide uppercase">{slides[activeSlide].title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed px-4">{slides[activeSlide].description}</p>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-1.5 mt-5">
              {slides.map((_, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveSlide(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'bg-teal-400 w-4' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="z-10 text-[10px] text-zinc-600 font-medium">
          <p>© 2026 PsyMetric Labs. Guided Career Synthesis Portal.</p>
        </div>
      </div>

      {/* RIGHT PANEL: FORM SECTION */}
      <div className="flex-1 min-h-screen overflow-y-auto bg-[#030303] flex flex-col justify-between py-12 px-6 sm:px-12 lg:px-16 relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/5 rounded-full blur-3xl -z-10" />

        <div className="flex lg:hidden justify-between items-center z-10 mb-8">
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-8 w-auto object-contain cursor-pointer" 
            onClick={() => router.push('/')}
          />
        </div>

        <div className="flex-1 w-full max-w-lg mx-auto flex items-center justify-center">
          <div className="w-full glassmorphism p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/10 to-teal-500/10 rounded-3xl -z-10" />

            {/* Verification OTP step overlay for phone signups */}
            <AnimatePresence>
              {signUpOtpRequested && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 bg-[#030303]/98 z-30 p-8 flex flex-col justify-center text-center space-y-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center mx-auto text-purple-400">
                    <Smartphone className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">Enter OTP Verification</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                      We have sent a verification code to your phone number: <strong className="text-zinc-300">{signUpMethod === 'email' ? signUpPhone : signUpPhone}</strong>
                    </p>
                  </div>
                  
                  {errorMsg && (
                    <div className="flex items-start gap-2 p-3 bg-red-900/10 border border-red-500/20 text-red-300 text-[11px] rounded-lg text-left">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifySignUpOtp} className="space-y-4">
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      placeholder="Enter 6-digit code"
                      autoComplete="one-time-code"
                      value={signUpOtpCode}
                      onChange={(e) => setSignUpOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest bg-black/40 border border-zinc-800 rounded-xl py-3.5 text-xl font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-purple-500"
                    />
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Verify and Launch</span><ArrowRight className="w-4 h-4" /></>}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSignUpOtpRequested(false)}
                      className="text-zinc-500 hover:text-white text-xs font-semibold hover:underline"
                    >
                      Go back to signup
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / Success alerts */}
            <AnimatePresence mode="wait">
              {errorMsg && !signUpOtpRequested && (
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
              {successMsg && !signUpOtpRequested && (
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

            {/* FLOW SELECTORS */}
            {forgotPasswordMode ? (
              /* ──── FORGOT PASSWORD RECOVERY FLOW ──── */
              <div>
                <button 
                  onClick={() => { setForgotPasswordMode(false); setErrorMsg(''); setSuccessMsg(''); }}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-6"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                </button>

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-white mb-1">Recover Credentials</h2>
                  <p className="text-xs text-zinc-400">Request password reset link to your email</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                      <input
                        type="email"
                        required
                        name="email"
                        autoComplete="email"
                        placeholder="name@school.edu"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Request Link</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              </div>
            ) : !isSignUp ? (
              /* ──── SIGN IN FLOW ──── */
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-extrabold text-white mb-1">Welcome Back</h2>
                  <p className="text-xs text-zinc-400">Sign in to resume your character evaluations</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
                  {/* Method Selector */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 border border-zinc-900 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('email'); setErrorMsg(''); setSuccessMsg(''); }}
                      className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${loginMethod === 'email' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                    >
                      Email Address
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod('phone'); setErrorMsg(''); setSuccessMsg(''); }}
                      className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                    >
                      Phone Number
                    </button>
                  </div>

                  {loginMethod === 'email' ? (
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                          <input
                            type="email"
                            required
                            name="email"
                            autoComplete="email"
                            placeholder="name@school.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Password</label>
                          <button 
                            type="button" 
                            onClick={() => { setForgotPasswordMode(true); setErrorMsg(''); setSuccessMsg(''); }}
                            className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                          <input
                            type="password"
                            required
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PHONE LOGIN FLOW */
                    <div className="space-y-5">
                      {/* Password vs OTP login toggle */}
                      <div className="flex items-center justify-end gap-3 text-[10px] font-bold text-zinc-500">
                        <span className={phoneLoginType === 'otp' ? 'text-purple-400' : ''}>Passwordless SMS OTP</span>
                        <button 
                          type="button" 
                          onClick={() => { setPhoneLoginType(prev => prev === 'otp' ? 'password' : 'otp'); setPhoneLoginOtpRequested(false); }}
                          className="w-8 h-4 rounded-full bg-zinc-850 border border-zinc-800 p-0.5 relative transition-colors"
                        >
                          <motion.div 
                            layout
                            className="w-2.5 h-2.5 rounded-full bg-zinc-400"
                            animate={{ x: phoneLoginType === 'otp' ? 0 : 16 }}
                          />
                        </button>
                        <span className={phoneLoginType === 'password' ? 'text-purple-400' : ''}>Password-based</span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                          <input
                            type="tel"
                            required
                            name="phone"
                            autoComplete="tel"
                            placeholder="+919876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          />
                        </div>
                      </div>

                      {phoneLoginType === 'otp' && phoneLoginOtpRequested && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1"
                        >
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Verification OTP Code</label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3.5 w-5 h-5 text-purple-500" />
                            <input
                              type="text"
                              required
                              maxLength={6}
                              autoComplete="one-time-code"
                              placeholder="Enter 6-digit OTP"
                              value={phoneLoginOtpCode}
                              onChange={(e) => setPhoneLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors font-mono tracking-wide"
                            />
                          </div>
                          <div className="text-right">
                            <button 
                              type="button" 
                              onClick={async () => {
                                setLoading(true);
                                const { error } = await supabase.auth.signInWithOtp({ phone: formatPhoneNumber(phone) });
                                setLoading(false);
                                if (error) setErrorMsg(error.message);
                                else setSuccessMsg('OTP code resent successfully!');
                              }}
                              className="text-[9px] text-zinc-500 hover:text-purple-400 hover:underline"
                            >
                              Resend Verification Code
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {phoneLoginType === 'password' && (
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Password</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                            <input
                              type="password"
                              required
                              name="password"
                              autoComplete="current-password"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>{loginMethod === 'phone' && phoneLoginType === 'otp' && !phoneLoginOtpRequested ? 'Request OTP' : 'Enter Portal'}</span><ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>

                {/* Google Sign In Option */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-900" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#030303] px-2 text-zinc-500 font-semibold tracking-wider">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2.5 bg-black/40 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold py-3 px-4 rounded-xl transition-all shadow-md"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99C6.15 7.15 8.87 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.32 3.5l3.6 2.79c2.1-1.94 3.3-4.8 3.3-7.94z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.24 14.56c-.25-.75-.39-1.56-.39-2.4s.14-1.65.39-2.4L1.39 6.77C.5 8.56 0 10.56 0 12.7c0 2.13.5 4.14 1.39 5.92l3.85-3.06z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1 .67-2.28 1.07-3.76 1.07-3.13 0-5.85-2.11-6.8-5.11l-3.85 2.99C3.37 20.33 7.35 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <div className="mt-8 text-center text-sm text-zinc-400">
                  <p>
                    First time evaluator?{' '}
                    <button
                      onClick={() => { setIsSignUp(true); setSignUpFlow('options'); setPassword(''); setConfirmPassword(''); setSignUpEmail(''); }}
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
                    onClick={() => { setSignUpFlow('options'); setStep(1); setErrorMsg(''); setSuccessMsg(''); }}
                    className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-xs font-semibold mb-6"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to options
                  </button>
                )}

                {signUpFlow === 'options' && (
                  /* OPTION SELECTION SCREEN */
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-extrabold text-white mb-1">Create Character Profile</h2>
                      <p className="text-xs text-zinc-400">Select how you want to join the platform</p>
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
                      <button onClick={() => { setIsSignUp(false); setPassword(''); setConfirmPassword(''); setSignUpEmail(''); }} className="hover:underline">Already registered? Sign In</button>
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

                        <div className="space-y-1.5">
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

                        {/* Method Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 border border-zinc-900 rounded-xl mb-4">
                          <button
                            type="button"
                            onClick={() => setSignUpMethod('email')}
                            className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'email' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                          >
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignUpMethod('phone')}
                            className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'phone' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                          >
                            Phone Number
                          </button>
                        </div>

                        {signUpMethod === 'email' ? (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                            <input
                              type="email"
                              required
                              name="email"
                              autoComplete="email"
                              placeholder="name@school.edu"
                              value={signUpEmail}
                              onChange={(e) => setSignUpEmail(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                            <input
                              type="tel"
                              required
                              name="phone"
                              autoComplete="tel"
                              placeholder="+919876543210"
                              value={signUpPhone}
                              onChange={(e) => setSignUpPhone(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Set Account Password</label>
                          <input
                            type="password"
                            required
                            name="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1"
                          />
                          {password && renderPasswordChecker(password)}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Confirm Password</label>
                          <input
                            type="password"
                            required
                            name="confirm-password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1"
                          />
                          {confirmPassword && password && (
                            <div className="text-[10px] font-bold mt-1">
                              {password === confirmPassword ? (
                                <span className="text-teal-400">✓ Passwords match</span>
                              ) : (
                                <span className="text-red-400">✗ Passwords do not match</span>
                              )}
                            </div>
                          )}
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
                      /* Step 1: Location */
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
                      /* Step 4: Stream */
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
                      /* Step 5: Personal Profile */
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white text-center">Personal Profile</h3>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">First Name</label>
                            <input
                              type="text"
                              required
                              name="firstName"
                              autoComplete="given-name"
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
                              name="lastName"
                              autoComplete="family-name"
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
                              name="dob"
                              value={dob}
                              onChange={(e) => setDob(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={!firstName || !lastName || !gender || !dob}
                          onClick={() => {
                            setSignUpEmail(`${firstName.toLowerCase()}.${lastName.toLowerCase()}@psymetric.me`);
                            setStep(6);
                          }}
                          className="w-full mt-4 bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                        >
                          Next Step
                        </button>
                      </div>
                    )}

                    {step === 6 && (
                      /* Step 6: Guided flow credentials */
                      <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white text-center">Set Credentials</h3>

                        <div className="p-4 rounded-xl bg-teal-950/20 border border-teal-500/20 text-xs space-y-1 text-zinc-300">
                          <p><strong className="text-teal-400">School:</strong> {selectedSchool}</p>
                          <p><strong className="text-teal-400">Class:</strong> Class {selectedClass}-{selectedSection} {selectedStream ? `• ${selectedStream}` : ''}</p>
                          <p><strong className="text-teal-400">Student Name:</strong> {firstName} {lastName}</p>
                        </div>

                        {/* Method Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 border border-zinc-900 rounded-xl mb-4">
                          <button
                            type="button"
                            onClick={() => setSignUpMethod('email')}
                            className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'email' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-zinc-500 hover:text-white'}`}
                          >
                            Email
                          </button>
                          <button
                            type="button"
                            onClick={() => setSignUpMethod('phone')}
                            className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'phone' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-zinc-500 hover:text-white'}`}
                          >
                            Phone Number
                          </button>
                        </div>

                        {signUpMethod === 'email' ? (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Email Address</label>
                            <input
                              type="email"
                              required
                              name="email"
                              autoComplete="email"
                              placeholder="student@school.edu"
                              value={signUpEmail}
                              onChange={(e) => setSignUpEmail(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Phone Number</label>
                            <input
                              type="tel"
                              required
                              name="phone"
                              autoComplete="tel"
                              placeholder="+919876543210"
                              value={signUpPhone}
                              onChange={(e) => setSignUpPhone(e.target.value)}
                              className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Password</label>
                          <input
                            type="password"
                            required
                            name="password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                          />
                          {password && renderPasswordChecker(password)}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Confirm Password</label>
                          <input
                            type="password"
                            required
                            name="confirm-password"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 px-4 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500"
                          />
                          {confirmPassword && password && (
                            <div className="text-[10px] font-bold mt-1">
                              {password === confirmPassword ? (
                                <span className="text-teal-400">✓ Passwords match</span>
                              ) : (
                                <span className="text-red-400">✗ Passwords do not match</span>
                              )}
                            </div>
                          )}
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
                          name="firstName"
                          autoComplete="given-name"
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
                          name="lastName"
                          autoComplete="family-name"
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

                    {/* Method Selector */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-black/50 border border-zinc-900 rounded-xl mb-4">
                      <button
                        type="button"
                        onClick={() => setSignUpMethod('email')}
                        className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'email' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                      >
                        Email
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignUpMethod('phone')}
                        className={`text-xs py-2 font-bold uppercase rounded-lg transition-all ${signUpMethod === 'phone' ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'text-zinc-500 hover:text-white'}`}
                      >
                        Phone Number
                      </button>
                    </div>

                    {signUpMethod === 'email' ? (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Email Address</label>
                        <input
                          type="email"
                          required
                          name="email"
                          autoComplete="email"
                          placeholder="name@example.com"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Phone Number</label>
                        <input
                          type="tel"
                          required
                          name="phone"
                          autoComplete="tel"
                          placeholder="+919876543210"
                          value={signUpPhone}
                          onChange={(e) => setSignUpPhone(e.target.value)}
                          className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">Password</label>
                      <input
                        type="password"
                        required
                        name="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                      />
                      {password && renderPasswordChecker(password)}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase">Confirm Password</label>
                      <input
                        type="password"
                        required
                        name="confirm-password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2.5 px-3 text-xs text-white"
                      />
                      {confirmPassword && password && (
                        <div className="text-[10px] font-bold mt-1">
                          {password === confirmPassword ? (
                            <span className="text-teal-400">✓ Passwords match</span>
                          ) : (
                            <span className="text-red-400">✗ Passwords do not match</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-zinc-200 hover:bg-white text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Open Quest Box</span>}
                    </button>

                    {/* Google signup inside Solo flow */}
                    {signUpMethod === 'email' && (
                      <>
                        <div className="relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-900" />
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase">
                            <span className="bg-[#030303] px-2 text-zinc-500 font-semibold">Or register with</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full flex items-center justify-center gap-2 bg-black/40 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-semibold py-2.5 rounded-xl transition-all text-xs"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                            <path
                              fill="#EA4335"
                              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.53 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99C6.15 7.15 8.87 5.04 12 5.04z"
                            />
                            <path
                              fill="#4285F4"
                              d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.09 2.67-2.32 3.5l3.6 2.79c2.1-1.94 3.3-4.8 3.3-7.94z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.24 14.56c-.25-.75-.39-1.56-.39-2.4s.14-1.65.39-2.4L1.39 6.77C.5 8.56 0 10.56 0 12.7c0 2.13.5 4.14 1.39 5.92l3.85-3.06z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1 .67-2.28 1.07-3.76 1.07-3.13 0-5.85-2.11-6.8-5.11l-3.85 2.99C3.37 20.33 7.35 23 12 23z"
                            />
                          </svg>
                          <span>Google</span>
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Small desktop footer / mobile footer */}
        <footer className="mt-10 text-center text-[10px] text-zinc-600 block lg:hidden">
          <p>© 2026 PsyMetric Labs. Guided Career Synthesis Portal.</p>
        </footer>
      </div>
    </div>
  );
}
