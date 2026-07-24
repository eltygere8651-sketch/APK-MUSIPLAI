const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const target = `  const handleDeleteUser = async (userId: string) => {
    askConfirm("¿Estás seguro de que deseas ELIMINAR a este usuario por completo de Firebase y Firestore?", async () => {
      try {
        const res = await fetch(\`/api/admin/users/\${userId}\`, {
          method: 'DELETE',
          headers: {
            'x-admin-email': 'eltygere8651@gmail.com'
          }
        });
        
        if (res.ok) {
          showAlert("Usuario eliminado completamente de Auth y Firestore.");
          fetchUsers();
        } else {
          const err = await res.json();
          showAlert("Error: " + (err.error || "No se pudo eliminar el usuario."));
        }
      } catch (e) {
        console.error(e);
        showAlert("Error de red al eliminar usuario.");
      }
    });
  };`;

const replace = `  const handleDeleteUser = async (userId: string) => {
    askConfirm("¿Estás seguro de que deseas ELIMINAR a este usuario de Firestore?", async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        let foundHash = null;
        if (userDoc.exists()) {
           const data = userDoc.data();
           if (data && data.deviceHash) foundHash = data.deviceHash;
        }

        const vipActDocRef = doc(db, "vip_activations", userId);
        const vipActDoc = await getDoc(vipActDocRef);
        if (vipActDoc.exists()) {
           const data = vipActDoc.data();
           if (data && data.deviceHash) foundHash = data.deviceHash;
        }

        if (foundHash) {
          await updateDoc(doc(db, "vip_devices", foundHash), { activatedAt: 0 }).catch(() => {});
        }

        await deleteDoc(userDocRef);
        await deleteDoc(doc(db, "trial_requests", userId)).catch(() => {});
        await deleteDoc(vipActDocRef).catch(() => {});

        showAlert("Usuario borrado correctamente. El acceso al sistema ha sido revocado.");
        fetchUsers();
      } catch (e) {
        console.error(e);
        showAlert("Error al eliminar usuario en Firestore.");
      }
    });
  };`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
