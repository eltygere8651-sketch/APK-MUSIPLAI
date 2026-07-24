const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const targetStr = `  const handleDeleteUser = async (userId: string) => {
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

const replaceStr = `  const handleDeleteUser = async (userId: string) => {
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

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
