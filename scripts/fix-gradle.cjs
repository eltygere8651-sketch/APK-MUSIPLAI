const fs = require('fs');
const https = require('https');
const path = require('path');

const jarPath = path.join(process.cwd(), 'android', 'gradle', 'wrapper', 'gradle-wrapper.jar');
const dirPath = path.dirname(jarPath);

if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true });
}

console.log('Downloading fresh gradle-wrapper.jar to avoid corruption issues...');
const file = fs.createWriteStream(jarPath);

// Usamos la URL raw de github para descargar un gradle-wrapper.jar intacto
https.get('https://raw.githubusercontent.com/gradle/gradle/v8.2.1/gradle/wrapper/gradle-wrapper.jar', (response) => {
  // Manejo de redirecciones
  if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
    https.get(response.headers.location, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ gradle-wrapper.jar descargado con éxito.');
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('✅ gradle-wrapper.jar descargado con éxito.');
    });
  }
}).on('error', (err) => {
  console.error('Error descargando el jar:', err.message);
});
