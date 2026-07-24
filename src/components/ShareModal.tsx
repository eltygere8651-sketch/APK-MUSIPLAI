import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Link as LinkIcon, Download, Smartphone } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanShare(true);
    }
  }, []);

  const shareTitle = "FluxPlay";
  const shareText = "🎵 Estoy usando FluxPlay y me está encantando.\n\nDisfruta de música en streaming sin anuncios y pruébalo gratis durante 7 días.";
  const shareUrl = "https://www.fluxplay.cc/vip";

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      console.warn("No se pudo compartir:", err);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;
    window.open(url, "_blank");
  };

  const handleTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleShareQR = () => {
    const canvas = document.getElementById("share-qr-canvas") as HTMLCanvasElement;
    if (!canvas) {
      alert("El QR no está listo aún.");
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        alert("Error al generar el QR.");
        return;
      }

      const file = new File([blob], "fluxplay-qr.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "FluxPlay QR",
            text: shareText,
          });
        } catch (error) {
          console.warn("Error al compartir QR de forma nativa:", error);
          downloadQR(canvas);
        }
      } else {
        downloadQR(canvas);
      }
    }, "image/png", 1.0);
  };

  const downloadQR = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fluxplay-qr.png";
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#121212] border border-white/10 p-6 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 active:bg-white/10 text-white/70 active:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-8 mt-2">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">❤️ Comparte FluxPlay</h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-[280px] mx-auto">
              Ayuda a que más personas descubran FluxPlay. Compártelo fácilmente con tus amigos y familiares.
            </p>
          </div>

          {/* Ocultamos el canvas para no romper el diseño, pero lo mantenemos en el DOM para poder exportarlo */}
          <div style={{ display: 'none' }}>
             <QRCodeCanvas 
                id="share-qr-canvas"
                value={shareUrl}
                size={460}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"H"}
                includeMargin={false}
                imageSettings={{
                  src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='rgba(100,116,139,0.5)' stroke-width='1'/%3E%3Ccircle cx='50' cy='50' r='34' fill='%23000' stroke='%231ED760' stroke-width='4'/%3E%3Ccircle cx='38' cy='50' r='6' fill='%231ED760'/%3E%3Ccircle cx='62' cy='50' r='6' fill='%231ED760'/%3E%3C/svg%3E",
                  height: 100,
                  width: 100,
                  excavate: true,
                }}
              />
          </div>

          {canShare ? (
            <button
              onClick={handleNativeShare}
              className="w-full bg-emerald-500 active:bg-emerald-400 text-black font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <Smartphone className="w-5 h-5" />
              📲 Compartir FluxPlay
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleWhatsApp}
                className="w-full bg-[#25D366] active:bg-[#20bd5a] text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                🟢 Compartir por WhatsApp
              </button>
              <button
                onClick={handleTelegram}
                className="w-full bg-[#0088cc] active:bg-[#007ab8] text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                🔵 Compartir por Telegram
              </button>
              <button
                onClick={handleCopyLink}
                className="w-full bg-white/10 active:bg-white/15 text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <LinkIcon className="w-4 h-4" />
                {copied ? "¡Enlace copiado!" : "📋 Copiar enlace"}
              </button>
              <button
                onClick={handleShareQR}
                className="w-full bg-white/10 active:bg-white/15 text-white font-bold text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                🖼 Compartir código QR
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
