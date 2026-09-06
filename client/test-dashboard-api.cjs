const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5001,
  path: '/api/auth/login',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const token = JSON.parse(body).token;
    
    http.get({
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/summary',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res2) => {
      let b2 = '';
      res2.on('data', c => b2 += c);
      res2.on('end', () => console.log('SUMMARY:', b2));
    });

    http.get({
      hostname: 'localhost',
      port: 5001,
      path: '/api/dashboard/analytics',
      headers: { 'Authorization': 'Bearer ' + token }
    }, (res3) => {
      let b3 = '';
      res3.on('data', c => b3 += c);
      res3.on('end', () => console.log('ANALYTICS:', b3));
    });

  });
});
req.write(JSON.stringify({email: 'admin@dealflow360.com', password: 'password123'}));
req.end();
