'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Lock, Loader2, AlertCircle, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Check if we have an active session (established by the recovery hash)
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // If no session is found, we might have been redirected without a token.
        // Let's check if there's an error in the query parameters.
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error')) {
          setErrorMsg(urlParams.get('error_description') || 'Recovery link has expired or is invalid.');
        }
      }
    };
    checkSession();
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (getPasswordStrength(password).score < 50) {
      setErrorMsg('Please choose a stronger password.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      setSuccessMsg('Password updated successfully! Redirecting to sign in...');
      setTimeout(() => {
        // Sign out to clear the recovery session and force login
        supabase.auth.signOut().then(() => {
          router.push('/auth?reset=success');
        });
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    {
      title: "Secure Your Identity",
      description: "Establish a robust credentials configuration to protect your psychometric reports and career timeline data."
    },
    {
      title: "Resume Your Quest",
      description: "Your RIASEC profile and evaluation states will remain completely untouched and securely synced."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#030303] overflow-hidden">
      
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

            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-1">Configure New Password</h2>
                <p className="text-xs text-zinc-400">Establish your new portal access password</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">New Password</label>
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
                  {password && (
                    <div className="space-y-1 mt-1.5">
                      <div className="flex justify-between text-[9px] font-bold text-zinc-500">
                        <span>Password Strength</span>
                        <span className="text-zinc-400">{getPasswordStrength(password).label}</span>
                      </div>
                      <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getPasswordStrength(password).color} transition-all duration-300`} 
                          style={{ width: `${getPasswordStrength(password).score}%` }} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
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
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Update Credentials</span><ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-[10px] text-zinc-600 block lg:hidden">
          <p>© 2026 PsyMetric Labs. Guided Career Synthesis Portal.</p>
        </footer>
      </div>
    </div>
  );
}
