const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const targetRemoveSub = `  const removeSub = async (userId: string) => {
    askConfirm("¿Remover suscripción y prueba de este usuario?", async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          plan: "free",
          subscriptionEnd: null,
          trialStart: 0 // trial expired forever
        });
        showAlert("Suscripción removida.");
        fetchUsers();
      } catch (e) {
        console.error(e);
      }
    });
  };`;

const replacementRemoveSub = `  const removeSub = async (userId: string) => {
    askConfirm("¿Remover suscripción y prueba de este usuario?", async () => {
      try {
        await updateDoc(doc(db, "users", userId), {
          plan: "free",
          subscriptionEnd: null,
          trialStart: 0 // trial expired forever
        });
        showAlert("Suscripción removida.");
        fetchUsers();
      } catch (e) {
        console.error(e);
      }
    });
  };

  const handleDeleteUser = async (userId: string) => {
    askConfirm("¿Estás seguro de que deseas ELIMINAR a este usuario por completo de Firestore?", async () => {
      try {
        await deleteDoc(doc(db, "users", userId));
        await deleteDoc(doc(db, "trial_requests", userId)).catch(() => {});
        await deleteDoc(doc(db, "vip_activations", userId)).catch(() => {});
        showAlert("Usuario eliminado de Firestore.");
        fetchUsers();
      } catch (e) {
        console.error(e);
        showAlert("Error al eliminar usuario.");
      }
    });
  };`;

code = code.replace(targetRemoveSub, replacementRemoveSub);

const targetButtons = `                         {/* Quitar Suscripción (Botón primario de ancho completo para evitar errores) */}
                         <button 
                           onClick={() => removeSub(u.id)} 
                           className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                         >
                           <UserX className="w-3.5 h-3.5" />
                           <span>Quitar Suscripción / Expirar</span>
                         </button>
                       </div>`;

const replacementButtons = `                         {/* Quitar Suscripción y Eliminar Usuario */}
                         <div className="grid grid-cols-2 gap-2 mt-2">
                           <button 
                             onClick={() => removeSub(u.id)} 
                             className="py-2.5 bg-orange-500/10 hover:bg-orange-500/20 active:scale-[0.98] text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                             title="Remover Suscripción"
                           >
                             <UserX className="w-3.5 h-3.5" />
                             <span>Quitar Susc.</span>
                           </button>
                           <button 
                             onClick={() => handleDeleteUser(u.id)} 
                             className="py-2.5 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.98] text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-red-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                             title="Eliminar Usuario de BD"
                           >
                             <Trash className="w-3.5 h-3.5" />
                             <span>Borrar Usuario</span>
                           </button>
                         </div>
                       </div>`;

code = code.replace(targetButtons, replacementButtons);

fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
console.log('Fixed Delete User');
