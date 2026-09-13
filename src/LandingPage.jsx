import React from 'react';

// Optional: Uncomment if using a local asset in src/assets/crane-bg.jpg
import craneBg from './assets/crane_bg.jpg';

export default function LandingPage({ onNavigateToLogin }) {
  const heroImage = "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=2000&q=80";

  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-[#111111] antialiased">
      
      {/* 1. Full-Width Orange Header */}
      <header className="bg-[#FF6E00] w-full border-b border-black/5">
        <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="font-serif font-normal text-[20px] tracking-tight text-[#111111]">
            Sadiconstruction
          </div>
          
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-[#111111]/80">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#about" className="hover:text-black transition-colors">About</a>
            <a href="#contact" className="hover:text-black transition-colors">Contact</a>
          </nav>
          
          <div className="flex items-center gap-6">
            <button 
              onClick={onNavigateToLogin}
              className="font-['Work_Sans'] text-[14px] font-medium text-[#111111] hover:underline cursor-pointer"
            >
              Log in
            </button>
            <button 
              onClick={onNavigateToLogin}
              className="bg-[#181C20] text-white font-['Work_Sans'] text-[14px] font-medium px-5 py-2 rounded-none hover:bg-black transition-colors cursor-pointer"
            >
              Get Access
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative flex-1 w-full bg-slate-900 overflow-hidden min-h-[620px] flex flex-col justify-between">
        
        {/* Background Construction Crane Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={craneBg} 
            alt="Tower crane on construction site" 
            className="w-full h-full object-cover object-right block"
          />
        </div>

        {/* 50% Opaque Left Panel — No blur effect */}
        <div className="relative z-10 w-full flex-1 flex items-stretch">
          <div className="w-full md:w-[40%] bg-white/85 p-8 lg:p-12 xl:p-16 flex flex-col justify-center border-r border-white/20 shadow-xl">
            
            {/* Eyebrow Tag */}
            <div className="flex items-center gap-3 text-xs font-semibold tracking-widest text-[#FF6E00] uppercase mb-6">
              <span className="w-8 h-[2px] bg-[#FF6E00]"></span>
              SADICON MANAGEMENT
            </div>

            {/* Tagline: DM Serif Display, 72px */}
            <h1 className="font-serif font-normal text-[48px] sm:text-[60px] lg:text-[72px] text-[#111111] leading-[1.02] tracking-tight">
              Every site.<br />
              Every budget.<br />
              <span className="text-[#FF6E00] italic font-normal">In control.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-slate-800 text-sm sm:text-base leading-relaxed max-w-md font-sans font-normal">
              Sadiconstruction is the internal platform your organization needs to manage projects, budgets, contractors, and compliance — end to end.
            </p>

            {/* Work Sans 14px Rectangular Buttons */}
            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={onNavigateToLogin}
                className="bg-[#181C20] text-white px-6 py-3 rounded-none font-['Work_Sans'] text-[14px] font-medium hover:bg-black transition-colors cursor-pointer shadow-sm"
              >
                Request Access
              </button>
              <button 
                onClick={onNavigateToLogin}
                className="bg-black/5 hover:bg-black/10 text-[#111111] px-6 py-3 rounded-none font-['Work_Sans'] text-[14px] font-medium border border-black/10 transition-colors cursor-pointer flex items-center gap-2"
              >
                Sign Up <span>&rarr;</span>
              </button>
            </div>

          </div>
        </div>

        {/* 3. Bottom Stats Bar */}
        <div className="relative z-20 w-full bg-white border-t border-slate-200">
          <div className="max-w-[1800px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200">
            <div className="py-6 px-8 text-left">
              <div className="text-3xl sm:text-4xl font-serif font-normal text-[#111111]">340+</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">PROJECTS TRACKED</div>
            </div>
            <div className="py-6 px-8 text-left">
              <div className="text-3xl sm:text-4xl font-serif font-normal text-[#111111]">₱2.4B</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">CAPITAL MANAGED</div>
            </div>
            <div className="py-6 px-8 text-left">
              <div className="text-3xl sm:text-4xl font-serif font-normal text-[#111111]">98%</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">ON-TIME DELIVERY</div>
            </div>
            <div className="py-6 px-8 text-left">
              <div className="text-3xl sm:text-4xl font-serif font-normal text-[#111111]">60+</div>
              <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-1">CONTRACTORS REGISTERED</div>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}