const { URL } = require('url');
try {
  const url = new URL("/\\attacker.com", "http://localhost");
  console.log(url.href);
} catch (e) {
  console.error(e.message);
}
