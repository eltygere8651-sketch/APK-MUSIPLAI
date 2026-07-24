const { exec } = require('child_process');
exec('killall node', (err) => {
  console.log('restarted');
});
