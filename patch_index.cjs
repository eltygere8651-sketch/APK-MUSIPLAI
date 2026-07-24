const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');

const targetLines = `    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png" />`;

const newLines = `    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=5" />
    <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152.png?v=5" />
    <link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167.png?v=5" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180.png?v=5" />
    <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png?v=5" />`;

if (indexHtml.includes(targetLines)) {
  indexHtml = indexHtml.replace(targetLines, newLines);
  fs.writeFileSync('index.html', indexHtml);
  console.log('patched index.html');
} else {
  console.log('target not found in index.html');
}
