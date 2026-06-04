'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { 
  User, Mail, Lock, GraduationCap, Building, 
  Sparkles, ShieldCheck, ArrowRight, Loader2, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageTier, setAgeTier] = useState('School (15-18)');
  const [institutionType, setInstitutionType] = useState('School');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Redirect based on metadata or check profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (profile?.is_admin) {
          router.push('/admin');
        } else {
          router.push('/assessment');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // Validation
        if (!fullName.trim()) {
          throw new Error('Please enter your full name');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              age_tier: ageTier,
              institution_type: institutionType,
              is_admin: isAdmin
            }
          }
        });

        if (error) throw error;
        
        if (data?.user && data?.session === null) {
          setSuccessMsg('Account created successfully! Please check your email for confirmation, or try logging in.');
          setIsSignUp(false);
        } else if (data?.session) {
          setSuccessMsg('Registration successful! Redirecting...');
          setTimeout(() => {
            router.push(isAdmin ? '/admin' : '/assessment');
          }, 1500);
        }
      } else {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data?.session) {
          // Fetch profile is_admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', data.user.id)
            .single();

          setSuccessMsg('Access granted. Redirecting...');
          setTimeout(() => {
            if (profile?.is_admin) {
              router.push('/admin');
            } else {
              router.push('/assessment');
            }
          }, 1000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto select institution based on age tier
  const handleAgeChange = (val: string) => {
    setAgeTier(val);
    if (val.includes('School')) {
      setInstitutionType('School');
    } else {
      setInstitutionType('College');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#030303] overflow-hidden mesh-gradient">
      {/* Background glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl -z-10" />

      {/* Decorative branding elements */}
      <div className="absolute top-8 left-8 flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
        <img 
          src="/psymetric-logo.png" 
          alt="PsyMetric Logo" 
          className="h-9 w-auto object-contain"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md perspective-container"
      >
        <div className="glassmorphism p-8 rounded-3xl relative overflow-hidden">
          {/* Card Border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-r from-purple-500/20 to-teal-500/20 rounded-3xl -z-10" />

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {isSignUp ? 'Begin Evaluation' : 'Enter Portal'}
            </h2>
            <p className="text-sm text-zinc-400">
              {isSignUp 
                ? 'Register student credentials to begin assessment' 
                : 'Enter your credentials to resume your workspace'}
            </p>
          </div>

          {/* Alert messages */}
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

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-6">
            
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Password</label>
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

            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Age Tier</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <select
                      value={ageTier}
                      onChange={(e) => handleAgeChange(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-3 text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    >
                      <option className="bg-[#121214]" value="School (13-15)">School (13-15)</option>
                      <option className="bg-[#121214]" value="School (15-18)">School (15-18)</option>
                      <option className="bg-[#121214]" value="College (18-21)">College (18-21)</option>
                      <option className="bg-[#121214]" value="College (22+)">College (22+)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Institution</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <select
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-3 text-white appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    >
                      <option className="bg-[#121214]" value="School">School</option>
                      <option className="bg-[#121214]" value="College">College</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Toggle Panel (For setup/demo convenience) */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
              <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Request admin rights
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isAdmin} 
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full relative group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
            >
              {/* Pulse effect wrapper */}
              <span className="absolute inset-0 w-full h-full bg-white/10 scale-0 rounded-xl group-hover:scale-100 transition-transform duration-500 ease-out origin-center" />
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Launch Assessment' : 'Enter Assessment'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Form type */}
          <div className="mt-8 text-center text-sm text-zinc-400">
            {isSignUp ? (
              <p>
                Already have a session profile?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                First time taking the test?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
                >
                  Create Student Profile
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
