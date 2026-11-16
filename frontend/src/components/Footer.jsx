import React from 'react';
import { Sparkles, Shield, Lock, Award, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">DevMatch AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              AI-powered matchmaking connecting non-technical founders with verified top developers. From plain idea to milestone delivery.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Spring Boot + MongoDB + React
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">The Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-blue-400 transition cursor-pointer">NLP Requirement Analysis</span></li>
              <li><span className="hover:text-blue-400 transition cursor-pointer">100-Point Matching Engine</span></li>
              <li><span className="hover:text-blue-400 transition cursor-pointer">Razorpay Escrow Workflows</span></li>
              <li><span className="hover:text-blue-400 transition cursor-pointer">WebSocket STOMP Chat</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Trust & Security</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-400" /> Milestone Protection</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-emerald-400" /> BCrypt & JWT Security</li>
              <li className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-400" /> Verified Skill Profiles</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">Demo Credentials</h4>
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-[11px] space-y-1.5">
              <div><span className="text-blue-400 font-semibold">Founder:</span> founder@devmatch.ai / Password@123</div>
              <div><span className="text-emerald-400 font-semibold">Dev (Java/React):</span> dev.raj@devmatch.ai / Password@123</div>
              <div><span className="text-purple-400 font-semibold">Admin:</span> admin@devmatch.ai / Admin@123</div>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DevMatch AI. Connecting Ideas with Developers - From Idea to Impact.</p>
          <p className="flex items-center gap-1">
            Built with Spring Boot 3, MongoDB & React
          </p>
        </div>
      </div>
    </footer>
  );
}

