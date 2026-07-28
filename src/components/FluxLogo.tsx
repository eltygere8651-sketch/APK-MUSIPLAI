import React from "react";

const FluxIcon = () => (
  <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <linearGradient id="fluxGrad" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="45%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
      <linearGradient id="fluxGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="innerShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feComponentTransfer in="SourceAlpha">
          <feFuncA type="linear" slope="0.6"/>
        </feComponentTransfer>
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feOffset dx="2" dy="4" />
        <feComposite operator="in" in2="SourceAlpha" />
        <feComposite operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
        <feFlood floodColor="#000" floodOpacity="0.8" />
        <feComposite operator="in" in2="shadowDiff" />
        <feComposite operator="over" in2="SourceGraphic" />
      </filter>
    </defs>
    
    {/* Background Circle */}
    <circle cx="60" cy="60" r="56" fill="url(#bgGrad)" stroke="#1ED760" strokeWidth="1.5" strokeOpacity="0.3" filter="url(#innerShadow)" />
    
    {/* Outer Glow Ring */}
    <circle cx="60" cy="60" r="44" stroke="url(#fluxGradGlow)" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="4 8" filter="url(#glow)" />
    
    {/* Inner Shapes - Abstract F */}
    <path
      d="M45 35C45 31.6863 47.6863 29 51 29H65C73.8366 29 81 36.1634 81 45C81 50.1517 78.5663 54.7337 74.8384 57.657L82.1648 68.3245C84.3411 71.4925 82.0734 76 78.2235 76H68.8074C67.2475 76 65.7762 75.3138 64.8117 74.1287L57.2561 64.8465C56.6353 64.084 55.6983 63.6334 54.7061 63.6334H45V35Z"
      fill="url(#fluxGrad)"
      filter="url(#glow)"
    />
    <path
      d="M45 68C45 65.7909 46.7909 64 49 64H53.0769C55.286 64 57.0769 65.7909 57.0769 68V87C57.0769 89.2091 55.286 91 53.0769 91H49C46.7909 91 45 89.2091 45 87V68Z"
      fill="url(#fluxGrad)"
    />
    
    {/* Play Triangle Cutout overlay */}
    <path d="M54 44L68 53L54 62V44Z" fill="#0F172A" />
  </svg>
);

export function FluxLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`${className} shrink-0 select-none transition-transform hover:scale-105 flex items-center justify-center`}>
      <FluxIcon />
    </div>
  );
}

export function FluxLogoMini({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <div className={`${className} shrink-0 select-none flex items-center justify-center`}>
      <FluxIcon />
    </div>
  );
}

export function FluxLogoLarge({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <div className={`${className} shrink-0 select-none flex items-center justify-center`}>
      <FluxIcon />
    </div>
  );
}

