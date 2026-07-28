const fs = require('fs');

let code = fs.readFileSync('src/domain/audio/YoutubePlayerWrapper.ts', 'utf8');

const badCreate = `  private createPlayer() {
    this.container = document.createElement('div');
    this.container.id = 'yt-audio-player-' + Math.random().toString(36).substring(7);
    this.container.style.position = 'absolute';
    this.container.style.left = '-9999px';
    this.container.style.top = '-9999px';
    this.container.style.width = '200px';
    this.container.style.height = '200px';
    this.container.style.opacity = '1';
    
    document.body.appendChild(this.container);

    this.player = new (window as any).YT.Player(this.container.id, {`;

const goodCreate = `  private createPlayer() {
    this.container = document.createElement('div');
    this.container.id = 'yt-audio-player-wrapper-' + Math.random().toString(36).substring(7);
    this.container.style.position = 'absolute';
    this.container.style.left = '-9999px';
    this.container.style.top = '-9999px';
    this.container.style.width = '200px';
    this.container.style.height = '200px';
    this.container.style.opacity = '1';
    this.container.style.pointerEvents = 'none'; // Prevent interacting when hidden

    const innerDiv = document.createElement('div');
    innerDiv.id = 'yt-audio-player-inner-' + Math.random().toString(36).substring(7);
    innerDiv.style.width = '100%';
    innerDiv.style.height = '100%';
    this.container.appendChild(innerDiv);
    
    document.body.appendChild(this.container);

    this.player = new (window as any).YT.Player(innerDiv.id, {`;

code = code.replace(badCreate, goodCreate);

fs.writeFileSync('src/domain/audio/YoutubePlayerWrapper.ts', code);
console.log("Patched YoutubePlayerWrapper 2");
