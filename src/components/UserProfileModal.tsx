import React, { useState, useRef } from "react";
import { useFirebase } from "./FirebaseProvider";
import { auth, db } from "../lib/firebase";
import { 
  updateProfile, 
  updateEmail, 
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from "firebase/auth";
import { 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  Calendar, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  Camera,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserProfileModalProps {
  onClose: () => void;
}

// Elite Colección de Avatares Premium Rediseñados con Glow y Gradientes de Lujo
const PRESET_AVATARS = [
  { name: "Diva del Pop 🎤", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Bella&backgroundType=gradientLinear&backgroundRotation=135&backgroundColor=ec4899,8b5cf6", rarity: "Leyenda", border: "border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)]" },
  { name: "Melómana Golden ✨", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Sophia&backgroundType=gradientLinear&backgroundRotation=45&backgroundColor=b45309,f59e0b", rarity: "Soberano", border: "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]" },
  { name: "Rey del Ritmo 🎧", url: "https://api.dicebear.com/7.x/micah/svg?seed=Jordan&backgroundType=gradientLinear&backgroundRotation=225&backgroundColor=311042,701a75", rarity: "Místico", border: "border-fuchsia-500 shadow-[0_0_15px_rgba(162,28,175,0.35)]" },
  { name: "Cyber Punk Jade 🟢", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=NeoJade&backgroundType=gradientLinear&backgroundRotation=90&backgroundColor=064e3b,10b981", rarity: "Leyenda", border: "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]" },
  { name: "Atleta Élite ⚡", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundType=gradientLinear&backgroundRotation=45&backgroundColor=0284c7,0ea5e9", rarity: "Élite", border: "border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.35)]" },
  { name: "Estrella de Neón 🌟", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Stella&backgroundType=gradientLinear&backgroundRotation=270&backgroundColor=db2777,fda4af", rarity: "Místico", border: "border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.35)]" },
  { name: "Urban Golden Classic 🕶️", url: "https://api.dicebear.com/7.x/micah/svg?seed=Ray&backgroundType=gradientLinear&backgroundRotation=145&backgroundColor=eab308,ca8a04", rarity: "Soberano", border: "border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.35)]" },
  { name: "Guerrero Neón ⚔️", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Viper&backgroundType=gradientLinear&backgroundRotation=120&backgroundColor=1e1b4b,4f46e5", rarity: "Élite", border: "border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.35)]" },
  { name: "Cyber Diva 🔮", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Evelyn&backgroundType=gradientLinear&backgroundRotation=180&backgroundColor=4c0519,db2777", rarity: "Leyenda", border: "border-pink-500 shadow-[0_0_15px_rgba(219,39,119,0.35)]" },
  { name: "Mago del Sonido 🎵", url: "https://api.dicebear.com/7.x/micah/svg?seed=Prestige&backgroundType=gradientLinear&backgroundRotation=0&backgroundColor=022c22,059669", rarity: "Místico", border: "border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.35)]" },
  { name: "Hechicera de Hielo ❄️", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Yuki&backgroundType=gradientLinear&backgroundRotation=60&backgroundColor=0f172a,2563eb", rarity: "Soberano", border: "border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.35)]" },
  { name: "Aventurero Flux 🗺️", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Atlas&backgroundType=gradientLinear&backgroundRotation=300&backgroundColor=1f2937,4b5563", rarity: "Élite", border: "border-slate-400 shadow-[0_0_15px_rgba(156,163,175,0.35)]" }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { user, accessData } = useFirebase();
  const isAdmin = user?.email === "eltygere8651@gmail.com";

  // Basic form states
  const [nickname, setNickname] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  
  // Custom Avatar Picker & Upload states
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-auth requirements
  const [showReauth, setShowReauth] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [reauthError, setReauthError] = useState<string | null>(null);

  // Layout states
  const [showPass, setShowPass] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user) return null;

  // Check if provider is Google
  const isGoogleProvider = user.providerData?.some(
    (provider) => provider.providerId === "google.com"
  );

  const getTrialOrPlanName = () => {
    if (user.email === "eltygere8651@gmail.com") return "Administrador Supremo";
    if (accessData?.plan === "free") return "Prueba de 7 Días";
    if (accessData?.plan === "1mo") return "Plan Mensual Premium";
    if (accessData?.plan === "3mo") return "Plan Trimestral Premium";
    if (accessData?.plan === "6mo") return "Plan Semestral Premium";
    if (accessData?.plan === "12mo") return "Plan Anual Premium";
    return "Socio Premium";
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("La imagen de perfil no debe superar los 10MB para optimización.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Canvas compression to 128x128 max keeping aspects
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          setPhotoURL(compressedDataUrl);
          setSuccessMsg("¡Imagen cargada y optimizada con éxito! Pulsa guardar para guardar los cambios.");
        }
        setIsLoading(false);
      };
      img.onerror = () => {
        setErrorMsg("Error al procesar el archivo como imagen.");
        setIsLoading(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg("No se pudo leer el archivo seleccionado.");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg("El nombre de usuario no puede estar vacío");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Update basic profile info (Display Name & photoURL)
      const isNameChanged = nickname.trim() !== (user.displayName || "");
      const isPhotoChanged = photoURL !== (user.photoURL || "");

      if (isNameChanged || isPhotoChanged) {
        // Bypass Firebase Auth photoURL length limits by passing plain text/empty value for large data URLs
        const authPhotoURL = photoURL && photoURL.startsWith("data:") ? "" : photoURL;
        await updateProfile(user, {
          displayName: nickname.trim(),
          photoURL: authPhotoURL
        });
        
        // Also update Firestore users database copy with the full avatar picture
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          displayName: nickname.trim(),
          photoURL: photoURL
        });
      }

      // Check if critical credentials (email or password) are being updated
      const isEmailChanged = email.trim().toLowerCase() !== (user.email || "").toLowerCase() && !isGoogleProvider;
      const isPasswordChanged = newPassword.trim().length > 0 && !isGoogleProvider;

      if (isEmailChanged || isPasswordChanged) {
        // These can trigger auth/requires-recent-login
        try {
          if (isEmailChanged) {
            await updateEmail(user, email.trim());
            // Update Firestore doc email representation
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              email: email.trim()
            });
          }

          if (isPasswordChanged) {
            if (newPassword.trim().length < 6) {
              throw new Error("weak-password");
            }
            await updatePassword(user, newPassword.trim());
          }
        } catch (authError: any) {
          console.warn("Critical change auth error", authError);
          const errorCode = authError?.code || "";
          
          if (errorCode === "auth/requires-recent-login" || authError?.message?.includes("recent-login")) {
            // Need re-authentication
            setShowReauth(true);
            setIsLoading(false);
            return;
          } else if (errorCode === "auth/weak-password" || authError?.message === "weak-password") {
            setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
            setIsLoading(false);
            return;
          } else if (errorCode === "auth/invalid-email") {
            setErrorMsg("La dirección de correo electrónico es inválida.");
            setIsLoading(false);
            return;
          } else if (errorCode === "auth/email-already-in-use") {
            setErrorMsg("Esta dirección de correo ya se encuentra registrada por otro usuario.");
            setIsLoading(false);
            return;
          } else {
            throw authError;
          }
        }
      }

      setSuccessMsg("¡Tu perfil ha sido actualizado con éxito!");
      setNewPassword("");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error("Profile change failed:", err);
      setErrorMsg(err?.message || "Ocurrió un error al actualizar tus datos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReauthenticateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setReauthError("Por favor ingresa tu contraseña de seguridad actual.");
      return;
    }

    setIsLoading(true);
    setReauthError(null);

    try {
      const emailCredential = EmailAuthProvider.credential(user.email || "", currentPassword);
      await reauthenticateWithCredential(user, emailCredential);
      
      // Successfully re-authenticated, continue changes!
      const isEmailChanged = email.trim().toLowerCase() !== (user.email || "").toLowerCase();
      const isPasswordChanged = newPassword.trim().length > 0;

      if (isEmailChanged) {
        await updateEmail(user, email.trim());
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          email: email.trim()
        });
      }

      if (isPasswordChanged) {
        await updatePassword(user, newPassword.trim());
      }

      if (nickname.trim() !== (user.displayName || "")) {
        await updateProfile(user, { displayName: nickname.trim() });
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          displayName: nickname.trim()
        });
      }

      setSuccessMsg("¡Credenciales re-verificadas y perfil actualizado con éxito!");
      setShowReauth(false);
      setCurrentPassword("");
      setNewPassword("");

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (e: any) {
      console.error("Re-authentication failed:", e);
      const code = e?.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setReauthError("Contraseña incorrecta. Por favor vuelve a intentarlo.");
      } else {
        setReauthError(e?.message || "Error al verificar la seguridad.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        id="profile-custom-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
      >
        <div className="absolute inset-0 z-0" onClick={onClose} />

        <motion.div
          initial={{ scale: 0.95, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[30px] overflow-hidden shadow-[0_0_80px_rgba(30,215,96,0.12)] flex flex-col z-10 max-h-[92vh]"
        >
          {/* Top aesthetic green ribbon */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-emerald-500 via-[#1ED760] to-teal-500" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 active:bg-white/5 text-slate-400 active:text-white rounded-full transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main Content Area */}
          <div className="p-6 overflow-y-auto premium-scrollbar flex-1">
            {!showReauth ? (
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                {/* Visual Avatar Header */}
                <div className="flex flex-col items-center text-center pb-4 pt-1 border-b border-white/5 space-y-2.5">
                  <div className="relative group">
                    <div className="relative w-20 h-20 bg-black/40 rounded-full flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-black/40 select-none overflow-hidden border-2 border-[#1ED760]">
                      <img 
                        src={photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.uid || 'flux')}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-active:scale-110" 
                        alt="Avatar Premium"
                        onError={(e) => {
                          (e.target as any).src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user?.uid || 'flux')}`;
                        }}
                        referrerPolicy="no-referrer"
                      />
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-active:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white gap-1 cursor-pointer animate-fade-in"
                          title="Subir nueva foto"
                        >
                          <Camera className="w-5 h-5 text-[#1ED760]" />
                          <span className="text-[7.5px] uppercase font-black tracking-widest text-[#1ED760]">Subir</span>
                        </button>
                      )}
                    </div>
                    <span className="absolute bottom-0.5 right-0.5 w-6 h-6 bg-black border border-white/10 rounded-full flex items-center justify-center shadow-md shadow-black/40">
                      <Sparkles className="w-3.5 h-3.5 text-[#1ED760]" />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-white text-sm font-black tracking-tight flex items-center justify-center gap-1.5">{nickname || "Usuario Premium"}</h2>
                    <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider truncate max-w-xs">{user.email}</p>
                  </div>

                  {/* Custom image input */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  {/* Preset & Upload Toggler */}
                  <div className="w-full max-w-sm pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                      className="text-[9px] font-black uppercase tracking-widest text-[#1ED760] active:text-[#18b550] border border-[#1ED760]/20 bg-[#1ED760]/5 active:bg-[#1ED760]/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span>🎨 Personalizar Foto / Avatar</span>
                    </button>
                  </div>

                  {/* Avatar Picker Panel */}
                  <AnimatePresence>
                    {showAvatarPicker && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="w-full bg-[#121214] border border-white/5 rounded-2xl p-4 space-y-4 overflow-hidden text-left shadow-2xl relative"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2.5 px-0.5">
                            <p className="text-[10px] font-black uppercase text-[#1ED760] tracking-widest font-sans flex items-center gap-1.5">
                              <span>⚜️ Colección de Avatares Élite</span>
                              <span className="text-[7.5px] bg-[#1ED760]/10 text-[#1ED760] border border-[#1ED760]/20 px-1.5 py-0.5 rounded font-bold animate-pulse">PREMIUM</span>
                            </p>
                          </div>
                          
                          <p className="text-[8px] text-slate-400 font-semibold mb-3 tracking-wide leading-normal">
                            Diseños exclusivos con fondos y efectos ultrallamativos de alta calidad. ¡Presume de perfil estelar en la comunidad!
                          </p>

                          <div className="grid grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto pr-1 premium-scrollbar">
                            {PRESET_AVATARS.map((av) => {
                              const isSelected = photoURL === av.url;
                              
                              // Subtle background tag classes based on rarity
                              let rarityBadgeColor = "bg-white/10 text-white";
                              if (av.rarity === "Soberano") rarityBadgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                              if (av.rarity === "Leyenda") rarityBadgeColor = "bg-pink-500/10 text-pink-400 border border-pink-500/20";
                              if (av.rarity === "Místico") rarityBadgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                              if (av.rarity === "Élite") rarityBadgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                              if (av.rarity === "Administrador Supremo") rarityBadgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";

                              return (
                                <button
                                  key={av.name}
                                  type="button"
                                  onClick={() => {
                                    setPhotoURL(av.url);
                                    setSuccessMsg(`Avatar seleccionado: "${av.name}". Recuerda hacer clic en Guardar.`);
                                  }}
                                  className={`relative aspect-square rounded-xl overflow-hidden border bg-black/40 active:scale-[1.08] active:scale-95 transition-all duration-300 cursor-pointer p-0.5 group flex flex-col justify-between ${isSelected ? `${av.border} scale-[1.02]` : 'border-white/5 active:border-white/20'}`}
                                  title={`${av.name} (${av.rarity})`}
                                >
                                  <img 
                                    src={av.url} 
                                    alt={av.name} 
                                    className="w-full h-full object-cover rounded-lg group-active:rotate-1 transition-transform duration-300" 
                                    referrerPolicy="no-referrer"
                                  />
                                  
                                  {/* Rarity label on hover */}
                                  <span className="absolute bottom-1 inset-x-1 text-[6.5px] font-black text-center truncate uppercase tracking-tight py-0.5 rounded opacity-0 group-active:opacity-100 transition-opacity bg-black/80 text-white select-none">
                                    {av.name.split(" ")[0]}
                                  </span>

                                  {/* Level pill on card */}
                                  <span className={`absolute top-1 left-1 px-1 py-[1px] text-[4.5px] uppercase font-black tracking-widest rounded ${rarityBadgeColor} scale-[0.8] origin-top-left select-none`}>
                                    {av.rarity.split(" ")[0]}
                                  </span>

                                  {isSelected && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#1ED760] rounded-full flex items-center justify-center shadow-lg z-10 animate-fade-in">
                                      <Check className="w-2.5 h-2.5 text-black stroke-[4px]" strokeWidth={4} />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Show custom image uploads only if the user is Admin */}
                        {isAdmin ? (
                          <div className="border-t border-white/[0.04] pt-3 flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 py-1.5 bg-[#1ED760]/10 active:bg-[#1ED760]/20 text-[#1ED760] font-black text-[9px] uppercase tracking-widest rounded-lg border border-[#1ED760]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir de tu Galería (Solo Admin)</span>
                            </button>
                            
                            {isGoogleProvider && (
                              <button
                                type="button"
                                onClick={() => {
                                  const googlePhoto = user.providerData.find(p => p.providerId === "google.com")?.photoURL || "";
                                  setPhotoURL(googlePhoto);
                                  setSuccessMsg("Imagen Google cargada. Haz click en Guardar para confirmar.");
                                }}
                                className="flex-1 py-1.5 bg-black active:bg-white/[0.02] text-slate-400 active:text-white font-black text-[9.5px] uppercase tracking-widest rounded-lg border border-white/5 transition-colors cursor-pointer flex items-center justify-center gap-1"
                              >
                                <span>Restablecer Google</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="border-t border-white/[0.04] pt-2.5 text-center px-1">
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                              <span>✨ Galería de Selección Exclusiva de Socios Premium</span>
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Subscription Status Panel */}
                <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-left">
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tipo de Membresía</p>
                      <p className="text-xs font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#1ED760]" />
                        {getTrialOrPlanName()}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-[8px] font-black uppercase tracking-widest bg-[#1ED760]/10 text-[#1ED760] border border-[#1ED760]/20 rounded-full">
                      PREMIO ACTIVO
                    </span>
                  </div>

                  <div className="border-t border-white/[0.03] pt-3 flex items-center gap-3">
                    <Calendar className="w-4.5 h-4.5 text-slate-500" />
                    <div className="text-left">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tiempo disponible</p>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {accessData?.daysRemaining !== undefined 
                          ? `${accessData.daysRemaining} días restantes` 
                          : "Calculando..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="space-y-4">
                  {/* Nickname / Display Name */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] uppercase font-black tracking-widest text-[#1ED760] px-1">
                      Nombre / Nickname
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Ingresa tu nickname..."
                        className="w-full pl-11 pr-4 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  {!user.isAnonymous && (
                    <>
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1 flex justify-between items-center">
                          <span>Correo Electrónico</span>
                          {isGoogleProvider && (
                            <span className="text-[9px] text-[#1ED760] normal-case font-bold bg-[#1ED760]/5 border border-[#1ED760]/10 px-2 py-0.5 rounded">
                              Cuenta Google
                            </span>
                          )}
                        </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-11 pr-4 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isGoogleProvider}
                      />
                    </div>
                    {isGoogleProvider && (
                      <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold px-1 pt-1">
                        Las cuentas de Google requieren cambiar el correo en su panel correspondiente de Google.
                      </p>
                    )}
                  </div>

                  {/* Password Modification (Not for Google accounts) */}
                  {!isGoogleProvider && (
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 px-1">
                        Nueva Contraseña (Opcional)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                        <input
                          type={showPass ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres (Dejar vacío para mantener)"
                          className="w-full pl-11 pr-11 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-3 active:text-white text-slate-500 transition-colors"
                        >
                          {showPass ? (
                            <EyeOff className="w-4 h-4 cursor-pointer" />
                          ) : (
                            <Eye className="w-4 h-4 cursor-pointer" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  </>
                  )}
                </div>

                {/* Alerts / Error messages */}
                {errorMsg && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-xl flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-[#1ED760]/10 border border-[#1ED760]/20 text-[#1ED760] text-[10px] font-bold rounded-xl flex items-start gap-2 text-left">
                    <Check className="w-4 h-4 text-[#1ED760] shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-white/10 active:bg-white/5 text-slate-300 font-black uppercase text-[10px] rounded-xl tracking-wider transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 bg-[#1ED760] active:bg-[#1fdf64] disabled:bg-opacity-50 text-black font-black uppercase text-[10px] rounded-xl tracking-wider shadow-[0_5px_15px_rgba(30,215,96,0.2)] active:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <span>Guardar</span>
                    )}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.dispatchEvent(new Event("open-notifications"));
                    }}
                    className="text-[9px] uppercase font-black tracking-widest text-[#1ED760]/65 active:text-[#1ED760] transition-colors cursor-pointer font-bold"
                  >
                    🚀 Ver Historial de Actualizaciones (Novedades)
                  </button>
                </div>
              </form>
            ) : (
              /* Re-Authentication Required Form */
              <form onSubmit={handleReauthenticateAndSave} className="space-y-4 pt-2">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-400 border border-amber-500/20 mx-auto select-none">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                  <h3 className="text-white text-sm font-black uppercase tracking-wider">Confirmar Seguridad</h3>
                  <p className="text-slate-400 text-[10.5px] leading-relaxed font-semibold">
                    Para realizar cambios de seguridad críticos (como modificar tu contraseña o tu correo), 
                    es necesario confirmar tu identidad volviendo a ingresar tu contraseña actual.
                  </p>
                </div>

                <div className="space-y-1.5 text-left pt-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-[#1ED760] px-1">
                    Tu contraseña actual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Ingrese su contraseña actual..."
                      className="w-full pl-11 pr-11 py-2.5 bg-[#121214] border border-white/10 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#1ED760]/50 transition-all font-semibold"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-3 active:text-white text-slate-500 transition-colors"
                    >
                      {showCurrentPass ? (
                        <EyeOff className="w-4 h-4 cursor-pointer" />
                      ) : (
                        <Eye className="w-4 h-4 cursor-pointer" />
                      )}
                    </button>
                  </div>
                </div>

                {reauthError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-xl flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{reauthError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReauth(false);
                      setCurrentPassword("");
                      setReauthError(null);
                    }}
                    className="flex-1 py-1.5 border border-white/10 active:bg-white/5 text-slate-300 font-extrabold uppercase text-[10px] rounded-xl tracking-wider transition-colors cursor-pointer"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-1.5 bg-[#1ED760] active:bg-[#1fdf64] disabled:bg-opacity-50 text-black font-extrabold uppercase text-[10px] rounded-xl tracking-wider shadow-[0_5px_15px_rgba(30,215,96,0.2)] active:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 animate-spin" />
                    ) : (
                      <span>Verificar y Guardar</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
