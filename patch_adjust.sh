sed -i '1125,1145c\
  const adjustSubDays = async (user: any, daysToAdjust: number | "custom") => {\
    let finalDays = 0;\
    if (daysToAdjust === "custom") {\
      const val = window.prompt("Ingresa los días a sumar (usa - para restar):", "0");\
      if (!val) return;\
      finalDays = parseInt(val, 10);\
      if (isNaN(finalDays) || finalDays === 0) return;\
    } else {\
      finalDays = daysToAdjust;\
    }\
    askConfirm(`¿Confirmar ${finalDays > 0 ? "+" : ""}${finalDays} día(s) para este usuario?`, async () => {\
      try {\
        const msPerDay = 1000 * 60 * 60 * 24;\
        let newEnd = user.subscriptionEnd;\
        if (!newEnd || newEnd <= Date.now()) {\
            const currentTrialDur = user.trialDuration || 7;\
            if (user.trialStart && (user.trialStart + currentTrialDur * msPerDay) > Date.now()) {\
                newEnd = user.trialStart + currentTrialDur * msPerDay;\
            } else {\
                newEnd = Date.now();\
            }\
        }\
        newEnd += (finalDays * msPerDay);\
        await updateDoc(doc(db, "users", user.id), {\
          subscriptionEnd: newEnd,\
          plan: "premium"\
        });\
' src/components/UserManagementAdmin.tsx
