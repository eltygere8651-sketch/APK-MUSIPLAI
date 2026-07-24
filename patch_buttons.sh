sed -i '1824,1844c\
                         <div className="grid grid-cols-5 gap-1.5 mt-2">\
                           <button onClick={() => updateSub(u.id, "12mo", 365)} className="py-2 bg-amber-500/10 hover:bg-amber-500/20 active:scale-[0.98] text-amber-300 text-[9px] font-black rounded-lg transition-all border border-amber-500/20 cursor-pointer text-center" title="12 Meses">12M</button>\
                           <button onClick={() => adjustSubDays(u, 30)} className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center" title="1 Mes">+1M</button>\
                           <button onClick={() => adjustSubDays(u, 60)} className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center" title="2 Meses">+2M</button>\
                           <button onClick={() => adjustSubDays(u, 90)} className="py-2 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-300 text-[9px] font-black rounded-lg transition-all border border-emerald-500/20 cursor-pointer text-center" title="3 Meses">+3M</button>\
                           <button onClick={() => adjustSubDays(u, "custom")} className="py-2 bg-purple-500/10 hover:bg-purple-500/20 active:scale-[0.98] text-purple-300 text-[9px] font-black rounded-lg transition-all border border-purple-500/20 cursor-pointer text-center" title="Días personalizados">+/- Días</button>\
                         </div>\
' src/components/UserManagementAdmin.tsx
