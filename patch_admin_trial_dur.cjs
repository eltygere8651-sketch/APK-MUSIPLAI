const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementAdmin.tsx', 'utf-8');

const target = `            if (user.trialStart && (user.trialStart + 7 * msPerDay) > Date.now()) {
                newEnd = user.trialStart + 7 * msPerDay;`;

const replace = `            const currentTrialDur = user.trialDuration || 7;
            if (user.trialStart && (user.trialStart + currentTrialDur * msPerDay) > Date.now()) {
                newEnd = user.trialStart + currentTrialDur * msPerDay;`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/UserManagementAdmin.tsx', code);
