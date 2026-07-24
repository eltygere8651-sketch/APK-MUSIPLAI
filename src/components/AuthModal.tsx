import React, { useState } from "react";
import { useFirebase } from "./FirebaseProvider";
import { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { X, LogIn, Mail, Lock, Shield, Check, AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen } = useFirebase();
  const [authType, setAuthType] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState(() => localStorage.getItem("gym_music_saved_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("gym_music_saved_password") || "");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("gym_music_remember_login") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginWithGoogle();
      setAuthModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const code = err?.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setErrorMsg("Google cerró la ventana.");
        setIsLoading(false);
        return;
      }
      
      if (code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        setErrorMsg(
          `DOMINIO NO AUTORIZADO: Debes añadir "${currentDomain}" a la lista de "Dominios Autorizados" en tu Consola de Firebase (Authentication -> Settings).`
        );
      } else {
        setErrorMsg(err?.message || "Error al iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authType === "reset") {
      if (!email.trim()) {
        setErrorMsg("Por favor, introduce tu correo electrónico.");
        return;
      }
      setIsLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      try {
        await resetPassword(email.trim());
        setSuccessMsg("Enlace de recuperación enviado. Si no lo visualizas, revisa la carpeta de correo no deseado.");
        setPassword("");
        if (typeof localStorage !== "undefined") {
           localStorage.removeItem("gym_music_saved_password");
        }
        setTimeout(() => setAuthType("login"), 4500);
      } catch (err: any) {
        setErrorMsg(err?.message || "Error al enviar el correo de recuperación.");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Por favor, rellena todos los campos.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      if (authType === "login") {
        await loginWithEmail(cleanEmail, cleanPassword);
        setSuccessMsg("¡Sesión iniciada con éxito! Iniciando...");
        if (rememberMe) {
          localStorage.setItem("gym_music_saved_email", cleanEmail);
          localStorage.setItem("gym_music_saved_password", cleanPassword);
          localStorage.setItem("gym_music_remember_login", "true");
        } else {
          localStorage.removeItem("gym_music_saved_email");
          localStorage.removeItem("gym_music_saved_password");
          localStorage.setItem("gym_music_remember_login", "false");
        }
      } else {
        const randomId = Math.floor(1000 + Math.random() * 9000);
        const prefixes = ['FluxUser', 'MusicFan', 'Listener', 'FluxRock', 'Player'];
        const randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${randomId}`;
        const userCred = await signupWithEmail(cleanEmail, cleanPassword, randomName);

        setSuccessMsg("¡Cuenta creada y sesión iniciada con éxito! Iniciando...");
      }

      setTimeout(() => {
        setAuthModalOpen(false);
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.warn("Unified Auth error:", err.code || err.message);
      const code = err?.code || "";
      if (
        code === "auth/user-not-found" || 
        code === "auth/invalid-credential" || 
        code === "auth/wrong-password" ||
        err?.message?.toLowerCase().includes("not-found") || 
        err?.message?.toLowerCase().includes("no user record")
      ) {
        if (authType === "login") {
          setErrorMsg("Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.");
        } else {
          setErrorMsg("No se pudo registrar la cuenta. Comprueba los campos.");
        }
      } else if (code === "auth/email-already-in-use") {
        setErrorMsg("Este correo electrónico ya está registrado. Por favor, selecciona Iniciar Sesión.");
      } else if (code === "auth/weak-password") {
        setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      } else if (code === "auth/invalid-email") {
        setErrorMsg("La dirección de correo electrónico es inválida.");
      } else {
        setErrorMsg(err?.message || "Por favor verifica tus datos de acceso.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        id="auth-selection-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
      >
        {/* Backdrop transparent click area */}
        <div className="absolute inset-0" onClick={() => setAuthModalOpen(false)} />

        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#0d0d0f] border border-white/10 rounded-[28px] overflow-hidden shadow-[0_0_50px_rgba(30,215,96,0.15)] flex flex-col z-10 max-h-[92vh]"
        >
          {/* Top border ambient glow accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-[#1ED760] to-teal-500" />

          {/* Modal Close Button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setAuthModalOpen(false)}
              className="p-2 active:bg-white/5 text-slate-400 active:text-white rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Premium Logo & Text Info Header */}
          <div className="p-6 pb-4 text-center shrink-0 border-b border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[20px] filter drop-shadow">⚡</span>
              <h2 className="text-lg font-black uppercase tracking-widest text-[#1ED760]">
                FLUX MUSIC
              </h2>
            </div>
            
            {/* Spotify-style compact tabs for toggling sign-in vs sign-up */}
            <div className="flex bg-white/[0.03] p-1 rounded-full border border-white/5 w-full max-w-[290px] mx-auto mt-2">
              <button
                type="button"
                onClick={() => {
                  setAuthType("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 px-4 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 text-center cursor-pointer ${
                  authType === "login"
                    ? "bg-[#1ED760] text-black shadow-lg font-black"
                    : "text-slate-400 active:text-white"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthType("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 px-4 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 text-center cursor-pointer ${
                  authType === "signup"
                    ? "bg-[#1ED760] text-black shadow-lg font-black"
                    : "text-slate-400 active:text-white"
                }`}
              >
                Registrarme
              </button>
            </div>
          </div>

          {/* Scrollable content container for perfect viewport support */}
          <div className="overflow-y-auto px-6 pb-6 pt-5 space-y-5 max-h-[64vh] scrollbar-thin scrollbar-thumb-white/5 flex flex-col items-center">
            
            {/* Form Fields & Submit Form */}
            <form onSubmit={handleEmailAction} className="space-y-4 w-full">
              {/* Error messages */}
              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug font-medium">{errorMsg}</span>
                </div>
              )}

              {/* Success messages */}
              {successMsg && (
                <div className="p-3 bg-[#1ED760]/10 border border-[#1ED760]/20 text-[#1ED760] text-xs rounded-xl flex items-start gap-2">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 animate-bounce" />
                  <span className="leading-snug font-medium">{successMsg}</span>
                </div>
              )}

              {/* Input for Email */}
              <div className="space-y-1">
                <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase block pl-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    className="w-full pl-10 pr-4 py-3 bg-[#121214] border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-medium"
                    required
                  />
                </div>
              </div>

              {/* Input for Password */}
              {authType !== "reset" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black tracking-widest text-slate-400 uppercase block pl-1">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-[#121214] border border-white/5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 focus:border-[#1ED760] transition-all font-medium"
                      required={authType !== "reset"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 active:text-white transition-all cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Remember Login Checkbox */}
              {authType === "login" && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-slate-600 bg-[#121214] text-[#1ED760] focus:ring-[#1ED760]/50 accent-[#1ED760] cursor-pointer"
                    />
                    <label htmlFor="rememberMe" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider cursor-pointer select-none pb-[1px]">
                      Recordar acceso
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType("reset");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[10px] uppercase font-bold text-[#1ED760] active:text-white transition-colors cursor-pointer tracking-wider"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
              {authType === "reset" && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType("login");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[10px] uppercase font-bold text-slate-400 active:text-white transition-colors cursor-pointer tracking-wider"
                  >
                    Volver a iniciar sesión
                  </button>
                </div>
              )}

              {/* Action main button based on tab */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#1ED760] font-black uppercase tracking-wider text-[10px] text-black rounded-xl active:bg-white active:text-black active:scale-[1.01] transition-all active:scale-[0.99] shadow-lg shadow-[#1ED760]/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : authType === "login" ? (
                  <>
                    <LogIn className="w-4 h-4 text-black" />
                    <span>Iniciar Sesión</span>
                  </>
                ) : authType === "reset" ? (
                  <>
                    <Mail className="w-4 h-4 text-black" />
                    <span>Enviar correo de recuperación</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-black" />
                    <span>Crear Cuenta Gratis</span>
                  </>
                )}
              </button>
            </form>

            {/* Premium Separator indicator */}
            <div className="relative flex py-1 items-center w-full">
              <div className="flex-grow border-t border-white/5" />
              <span className="flex-shrink mx-3 text-[8.5px] font-black uppercase text-slate-500 tracking-widest leading-none select-none">
                {authType === "login" ? "o iniciar sesión con" : "o registrarse con"}
              </span>
              <div className="flex-grow border-t border-white/5" />
            </div>

            {/* Google provider button login alternative */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[9px] rounded-xl active:bg-white/10 active:border-white/20 active:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-1 shrink-0 text-[#1ED760]" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Bottom secure certificate indicator badge */}
            <div className="text-[9px] text-slate-500 text-center flex items-center justify-center gap-1.5 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl w-full">
              <Shield className="w-3.5 h-3.5 text-[#1ED760]" />
              <span>Conexión segura SSL. Datos protegidos.</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
