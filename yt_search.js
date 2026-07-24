fetch("http://localhost:3000/api/youtube/search?q=cuica+ptazeta+quevedo").then(r => r.json()).then(data => {
    data.slice(0, 5).forEach(d => console.log(d.id, d.title, d.artist, d.duration));
});
