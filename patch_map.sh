sed -i '1724c\
              {users.filter(u => userSearchTerm ? (u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.id.toLowerCase().includes(userSearchTerm.toLowerCase())) : true).sort((a, b) => (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "")).map(u => {\
' src/components/UserManagementAdmin.tsx
