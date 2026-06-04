'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, Compass, Shield, ArrowRight, 
  BrainCircuit, Activity, CheckCircle2, Award 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#030303] text-white flex flex-col justify-between overflow-hidden mesh-gradient">
      {/* Background radial effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl -z-10" />

      {/* Header Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <img 
            src="/psymetric-logo.png" 
            alt="PsyMetric Logo" 
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/auth')} 
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/auth')} 
            className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-black rounded-xl transition-all shadow-[0_0_15px_rgba(0,245,212,0.2)] hover:shadow-[0_0_20px_rgba(0,245,212,0.45)] transform hover:-translate-y-0.5"
          >
            Launch Evaluation
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-20 flex-1 flex flex-col lg:flex-row items-center gap-16 relative">
        
        {/* Left Column: Copy */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse" /> Industry-Ready Psychometric Assessment
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Cinematic Adaptive Testing for <span className="bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">Future Careers</span>
          </h1>
          
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
            Evaluate student interests and behavioral instincts using immersive video-based interactive scenarios. Get accurate career reports analyzed by Google Gemini AI based on the 6D Holland Codes (RIASEC) framework.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={() => router.push('/auth')}
              className="w-full sm:w-auto relative group bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Enter Student Portal</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 hover:border-zinc-700 active:scale-95"
            >
              <Shield className="w-4.5 h-4.5" />
              <span>Admin Console</span>
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Bento Visualizer */}
        <div className="flex-1 w-full max-w-lg">
          <div className="glassmorphism p-8 rounded-3xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-purple-500/20 to-teal-500/20" />
            
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-widest">
              <BrainCircuit className="w-5 h-5 text-teal-400 animate-pulse" /> Assessment Core Features
            </div>
            
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200 text-sm">Cinematic 60/40 Playback</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">Dual-layered looping mp4 backdrops with fluid transitions to simulate real-world environments.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200 text-sm">Anti-Cheat Engine (MIRT)</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">Flag rapid response time speeds (&lt;1.5s) and contradictory inputs, and dynamically extend test up to 18 scenarios.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-200 text-sm">Gemini AI Guidance Engine</h4>
                  <p className="text-zinc-500 text-xs mt-0.5">Compiles response data matrices and calls Gemini 1.5 Pro to generate elite psychologist career reports.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black/20 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
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
