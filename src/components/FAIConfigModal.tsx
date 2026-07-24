import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Settings2, Info } from "lucide-react";

interface FAIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  discoveryLevel: number;
  setDiscoveryLevel: (val: number) => void;
}

export const FAIConfigModal: React.FC<FAIConfigModalProps> = ({
  isOpen,
  onClose,
  discoveryLevel,
  setDiscoveryLevel,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#121212] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Settings2 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Configuración de Flux AI</h3>
                  <p className="text-xs text-gray-400">Personaliza tu DJ inteligente</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 active:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-medium text-gray-300">
                    Nivel de Descubrimiento
                  </label>
                  <span className="text-2xl font-black text-purple-400">{discoveryLevel}%</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={discoveryLevel}
                  onChange={(e) => setDiscoveryLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500 active:accent-purple-400 transition-all"
                />

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className={`p-3 rounded-2xl border ${discoveryLevel < 30 ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-transparent'} transition-all`}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Top & Favs</p>
                    <p className="text-xs text-gray-300">Enfoque en lo que ya amas.</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${discoveryLevel >= 30 && discoveryLevel <= 70 ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-transparent'} transition-all`}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Equilibrado</p>
                    <p className="text-xs text-gray-300">Mix perfecto de éxitos y novedades.</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${discoveryLevel > 70 ? 'bg-purple-500/10 border-purple-500/50' : 'bg-white/5 border-transparent'} transition-all`}>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Explorador</p>
                    <p className="text-xs text-gray-300">Descubre nuevas joyas musicales.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-100/70 leading-relaxed">
                  Flux AI utiliza algoritmos avanzados para balancear tu biblioteca. A mayor descubrimiento, más canciones nuevas fuera de tu radar aparecerán en la mezcla.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-white/5 border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full py-4 bg-purple-600 active:bg-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98]"
              >
                Guardar Configuración
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
