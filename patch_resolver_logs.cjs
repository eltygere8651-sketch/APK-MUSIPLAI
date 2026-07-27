const fs = require('fs');
let content = fs.readFileSync('src/lib/ClientStreamResolver.ts', 'utf8');

const oldSuccess = `        console.log(\`[CLIENT_RESOLVER] Success for videoId: \${videoId}\`);
        return url;`;
        
const newSuccess = `        console.log(\`[CLIENT_RESOLVER_TEST]\\nvideoId: \${videoId}\\nplatform: \${platform}\\nresolved: true\\naudioUrl length: \${url.length}\\nformat: \${targetFormat.itag} (\${targetFormat.mime_type})\`);
        console.log(\`[CLIENT_RESOLVER] Success for videoId: \${videoId}\`);
        return url;`;
        
const oldFail = `    console.warn(\`[CLIENT_RESOLVER] No suitable format found for videoId: \${videoId}\`);
    throw new Error('No suitable format found');`;
    
const newFail = `    console.warn(\`[CLIENT_RESOLVER_TEST]\\nvideoId: \${videoId}\\nplatform: \${platform}\\nresolved: false\\nerror: No suitable format found\\nformats available: \${formats.map((f: any) => f.itag).join(', ')}\`);
    throw new Error('No suitable format found');`;
    
const oldCatch = `  } catch (error: any) {
    console.error(\`[CLIENT_RESOLVER] Error for videoId: \${videoId}:\`, error.message || error);
    throw error;
  }`;
  
const newCatch = `  } catch (error: any) {
    console.error(\`[CLIENT_RESOLVER_TEST]\\nvideoId: \${videoId}\\nplatform: \${platform}\\nresolved: false\\nerror:\`, error);
    throw error;
  }`;

content = content.replace(oldSuccess, newSuccess);
content = content.replace(oldFail, newFail);
content = content.replace(oldCatch, newCatch);

fs.writeFileSync('src/lib/ClientStreamResolver.ts', content, 'utf8');
console.log("Patched logs successfully");
