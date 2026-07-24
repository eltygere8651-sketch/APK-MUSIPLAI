import React from "react";

export function FluxLogo({ className = "w-9 h-9" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full flex items-center justify-center p-[1.5px] shrink-0 select-none`} style={{ backgroundColor: '#000000', border: '2px solid #1ED760', boxShadow: '0 0 18px rgba(30,215,96,0.7)' }}>
      <div className="w-full h-full rounded-full flex items-center justify-center p-[1.5px]" style={{ border: '1px solid rgba(100, 116, 139, 0.5)' }}>
        <div className="w-full h-full rounded-full flex items-center justify-center gap-1.5 px-1" style={{ backgroundColor: '#000000', border: '2px solid #1ED760' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1ED760', boxShadow: '0 0 6px rgba(30,215,96,0.9)' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#1ED760', boxShadow: '0 0 6px rgba(30,215,96,0.9)' }} />
        </div>
      </div>
    </div>
  );
}

export function FluxLogoMini({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full flex items-center justify-center p-[0.8px] shrink-0 select-none`} style={{ backgroundColor: '#000000', border: '1px solid #1ED760' }}>
      <div className="w-full h-full rounded-full flex items-center justify-center p-[0.8px]" style={{ border: '0.5px solid rgba(100, 116, 139, 0.5)' }}>
        <div className="w-full h-full rounded-full flex items-center justify-center gap-[1px] px-[1px]" style={{ backgroundColor: '#000000', border: '1px solid #1ED760' }}>
          <div className="w-[1.5px] h-[1.5px] rounded-full" style={{ backgroundColor: '#1ED760' }} />
          <div className="w-[1.5px] h-[1.5px] rounded-full" style={{ backgroundColor: '#1ED760' }} />
        </div>
      </div>
    </div>
  );
}

export function FluxLogoLarge({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full flex items-center justify-center p-[4px] shrink-0 select-none`} style={{ backgroundColor: '#000000', border: '4px solid #1ED760', boxShadow: '0 0 40px rgba(30,215,96,0.8)' }}>
      <div className="w-full h-full rounded-full flex items-center justify-center p-[4px]" style={{ border: '1px solid rgba(100, 116, 139, 0.5)' }}>
        <div className="w-full h-full rounded-full flex items-center justify-center gap-3 px-2" style={{ backgroundColor: '#000000', border: '4px solid #1ED760' }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1ED760', boxShadow: '0 0 12px rgba(30,215,96,1)' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1ED760', boxShadow: '0 0 12px rgba(30,215,96,1)' }} />
        </div>
      </div>
    </div>
  );
}
