sed -i '1731,1732d' src/components/UserManagementAdmin.tsx
sed -i '1730c\
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\
              {users.filter(u => userSearchTerm ? (u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.displayName?.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.id.toLowerCase().includes(userSearchTerm.toLowerCase())) : true).sort((a, b) => (a.displayName || a.email || "").localeCompare(b.displayName || b.email || "")).map(u => {\
' src/components/UserManagementAdmin.tsx
