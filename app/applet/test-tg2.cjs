fetch("http://localhost:3000/api/support/telegram", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userEmail: "tvson@test.com",
    userName: "tvson",
    message: "Test Message",
  })
}).then(res => res.json()).then(data => console.log(data));
