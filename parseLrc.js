const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
const text = "[01:23.456] hello world\n[01:25.00] test";
for (const line of text.split('\n')) {
  console.log(line.match(regex));
}
