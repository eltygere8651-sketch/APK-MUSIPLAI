import React, { useState } from "react";
import { useFirebase } from "./FirebaseProvider";
import { AlertTriangle, Copy, Check, ExternalLink, X, Shield, RefreshCw } from "lucide-react";
import firebaseConfig from "../../firebase-applet-config.json";

export const AuthErrorModal: React.FC = () => {
  const { authError, clearAuthError } = useFirebase();
  const [copied, setCopied] = useState(false);

  if (!authError) return null;

  const errorCode = authError.code || "";
  const errorMessage = authError.message || String(authError);
  const currentHostname = window.location.hostname;
  const projectId = firebaseConfig.projectId || "tu-proyecto-firebase";

  const handleCopyHost = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  // Determine specific troubleshooting guidance
  let title = "Error de Autenticación";
  let description = "Ocurrió un problema de seguridad de Firebase al intentar iniciar sesión.";
  let solutionSteps: string[] = [];
  let isUnauthorizedDomain = false;

  if (errorCode === "auth/unauthorized-domain") {
    isUnauthorizedDomain = true;
    title = "Dominio No Autorizado en Firebase";
    description = `Firebase ha bloqueado el inicio de sesión porque este dominio (${currentHostname}) no está en la lista de dominios autorizados de su proyecto Firebase. IMPORTANTE: Haberlo añadido a Firestore o Hosting no es suficiente.`;
    solutionSteps = [
      "Abre la Consola de Firebase: https://console.firebase.google.com/",
      `Selecciona el proyecto: '${projectId}'`,
      "Sección 'Authentication' -> clic en la pestaña 'Settings' (Ajustes).",
      "Columna izquierda -> 'Authorized domains' (Dominios autorizados).",
      `Haz clic en 'Add domain' y pega exactamente: ${currentHostname}`,
      "Asegúrate de pulsar 'Añadir' y espera 30 segundos antes de intentar de nuevo."
    ];
  } else if (errorCode === "auth/popup-blocked") {
    title = "Ventana Emergente Bloqueada";
    description = "Tu navegador o dispositivo ha bloqueado la ventana emergente de inicio de sesión con Google.";
    solutionSteps = [
      "Permite las ventanas emergentes (Popups) para este sitio en los ajustes de tu navegador.",
      "En iPhone/iOS: Ve a Ajustes -> Safari -> Desactiva 'Bloquear ventanas emergentes'.",
      "Vuelve a intentarlo; el sistema intentará redirigirte automáticamente si se bloquea la ventana."
    ];
  } else if (errorCode === "auth/operation-not-allowed") {
    title = "Proveedor de Google Desactivado";
    description = "El inicio de sesión con Google no está habilitado en tu consola de Firebase.";
    solutionSteps = [
      "Inicia sesión en la consola de Firebase.",
      "Ve a Authentication -> Sign-in method.",
      "Haz clic en 'Añadir nuevo proveedor', selecciona Google y actívalo.",
      "Guarda los cambios y recarga esta aplicación."
    ];
  } else if (errorMessage.toLowerCase().includes("network") || errorCode.includes("network")) {
    title = "Error de Red o Conexión";
    description = "No se pudo establecer conexión con los servidores de autenticación de Google/Firebase.";
    solutionSteps = [
      "Asegúrate de estar conectado a Internet.",
      "Si estás en una red corporativa o pública con restricciones, verifica que no haya firewalls bloqueando '*.firebaseapp.com'.",
      "Intenta de nuevo en unos minutos."
    ];
  } else {
    // Standard Safari/iOS cross-origin or third-party cookie issue (very common with ITP)
    title = "Restricción de Dispositivo o Navegador";
    description = `Si usas iPhone (Safari) u otros dispositivos móviles, Apple bloquea por defecto las cookies de autenticación de terceros necesarias para iniciar sesión en dominios externos.`;
    solutionSteps = [
      "En iPhone (iOS): Ve a Ajustes -> Safari y desactiva temporalmente 'Prevenir seguimiento entre sitios' (Prevent Cross-Site Tracking).",
      "Alternativamente: Copia el enlace de esta aplicación y ábrela en Google Chrome u otro navegador compatible.",
      "Asegúrate de que el dominio está añadido en Dominios Autorizados de Firebase."
    ];
  }

  return (
    <div id="auth-error-modal" className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#111112] border border-white/10 rounded-[28px] overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Header decoration */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600" />

        {/* Modal Header */}
        <div className="p-6 md:p-8 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white">
                {title}
              </h2>
              <p className="text-[11px] font-bold text-red-400 mt-0.5 font-mono">
                CÓDIGO: {errorCode || "ERROR_CONFIG"}
              </p>
            </div>
          </div>
          <button
            onClick={clearAuthError}
            className="p-1.5 active:bg-white/5 text-slate-400 active:text-white rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Block */}
        <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-6 md:pb-8 space-y-5">
          <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            {description}
          </p>

          {isUnauthorizedDomain && (
            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Tu Dominio Actual
                </span>
                <span className="text-[9px] text-slate-400">Copiar para añadir a Firebase</span>
              </div>
              <div className="flex items-center gap-2 bg-black/40 border border-white/5 p-2 px-3 rounded-xl justify-between">
                <code className="text-xs font-mono text-slate-200 select-all truncate">
                  {currentHostname}
                </code>
                <button
                  onClick={handleCopyHost}
                  className="p-1.5 rounded-lg bg-emerald-500 text-black active:bg-white active:text-black transition-all active:scale-95 shrink-0 flex items-center justify-center"
                  title="Copiar Dominio"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 stroke-[2.5px]" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase text-white/50 tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Pasos para resolver este problema:
            </h4>
            <ol className="space-y-2">
              {solutionSteps.map((step, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-slate-400 leading-relaxed font-sans">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/70 font-mono">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-5 py-3 bg-emerald-500 text-black font-black uppercase text-[10px] text-center rounded-xl active:bg-white transition-all shadow-xl flex items-center justify-center gap-1.5"
            >
              Abir Consola Firebase
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5px]" />
            </a>
            <button
              onClick={() => window.location.reload()}
              className="flex-shrink-0 px-5 py-3 bg-white/5 border border-white/10 text-slate-300 font-black uppercase text-[10px] rounded-xl active:bg-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recargar Sitio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
