sed -i '1697c\
                     onChange={(e) => {\
                        setUsersPageSize(Number(e.target.value));\
                        setUsersPage(0);\
                        setHasMoreUsers(true);\
                        fetchUsers(0, null, true);\
                     }}\
' src/components/UserManagementAdmin.tsx
