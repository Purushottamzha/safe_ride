const http = require('http');

function req(method, path, token, body) {
  return new Promise((resolve) => {
    const opts = { hostname: '127.0.0.1', port: 3000, path, method, headers: {} };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) { const b = JSON.stringify(body); opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(b); }
    const r = http.request(opts, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',() => resolve({ status: res.statusCode, body: d })); });
    r.on('error', (e) => resolve({ status: 0, body: e.message }));
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  const login = await req('POST', '/api/v1/auth/login', null, { email: 'admin@saferide.com', password: 'Admin@123456' });
  console.log('LOGIN:', login.status);
  const j = JSON.parse(login.body);
  const token = j.data.tokens.accessToken;

  const schools = await req('GET', '/api/v1/schools', token);
  const sbody = JSON.parse(schools.body);
  const schoolId = sbody.data.data[0].id;
  console.log('SCHOOL:', sbody.data.data[0].name, 'ID:', schoolId);

  let pass = 0, fail = 0;
  function t(name, p, s, e) {
    if (s < 400) { console.log('  PASS:', name); pass++; }
    else { console.log('  FAIL:', name, '->', s, e ? e.substring(0,200) : ''); fail++; }
  }

  console.log('\n--- CRUD: Student ---');
  let r = await req('POST', '/api/v1/students', token, { firstName: 'Test', lastName: 'Student', grade: '5', section: 'A', dateOfBirth: '2015-06-15', studentId: 'TST-' + Date.now(), schoolId });
  t('Create Student', 'POST', r.status, r.body);
  if (r.status === 201) {
    const stuId = JSON.parse(r.body).data.id;
    r = await req('GET', '/api/v1/students/' + stuId, token); t('Get Student', 'GET', r.status);
    r = await req('PATCH', '/api/v1/students/' + stuId, token, { firstName: 'Updated' }); t('Update Student', 'PATCH', r.status);
    r = await req('DELETE', '/api/v1/students/' + stuId, token); t('Delete Student', 'DELETE', r.status);
  }

  console.log('\n--- QR ---');
  r = await req('GET', '/api/v1/qr/dashboard', token); t('QR Dashboard', 'GET', r.status);
  const stuList = await req('GET', '/api/v1/students', token);
  if (stuList.status === 200) {
    const firstStu = JSON.parse(stuList.body).data.data[0];
    if (firstStu) {
      r = await req('GET', '/api/v1/qr/student/' + firstStu.id, token); t('QR Student Info', 'GET', r.status);
      r = await req('POST', '/api/v1/qr/student/' + firstStu.id + '/generate', token); t('QR Generate', 'POST', r.status);
      r = await req('GET', '/api/v1/qr/print/' + firstStu.id, token); t('QR Print Card', 'GET', r.status);
    }
  }

  console.log('\n--- Attendance ---');
  r = await req('GET', '/api/v1/attendance/today?schoolId=' + schoolId, token); t('Attendance Today', 'GET', r.status);
  r = await req('GET', '/api/v1/attendance/range/' + schoolId + '?start=2026-07-01&end=2026-07-31', token); t('Attendance Range', 'GET', r.status);

  console.log('\n--- Reports ---');
  r = await req('GET', '/api/v1/reports/daily-attendance?schoolId=' + schoolId + '&date=2026-07-10', token); t('Daily Report', 'GET', r.status);
  r = await req('GET', '/api/v1/reports/monthly-attendance?schoolId=' + schoolId + '&month=7&year=2026', token); t('Monthly Report', 'GET', r.status);
  r = await req('GET', '/api/v1/reports/driver-performance?schoolId=' + schoolId, token); t('Driver Perf Report', 'GET', r.status);
  r = await req('GET', '/api/v1/reports/bus-utilization?schoolId=' + schoolId, token); t('Bus Utilization Report', 'GET', r.status);
  r = await req('GET', '/api/v1/reports/trip-summary?schoolId=' + schoolId, token); t('Trip Summary Report', 'GET', r.status);

  console.log('\n--- Notifications ---');
  r = await req('GET', '/api/v1/notifications?schoolId=' + schoolId, token); t('List Notifications', 'GET', r.status);

  console.log('\n--- Incidents ---');
  r = await req('GET', '/api/v1/incidents?schoolId=' + schoolId, token); t('List Incidents', 'GET', r.status);

  console.log('\n--- Export ---');
  r = await req('GET', '/api/v1/export/attendance?schoolId=' + schoolId, token); t('Export Attendance', 'GET', r.status);
  r = await req('GET', '/api/v1/export/report?type=daily&schoolId=' + schoolId, token); t('Export Report', 'GET', r.status);

  console.log('\n--- Auth ---');
  r = await req('POST', '/api/v1/auth/refresh', null, { refreshToken: j.data.tokens.refreshToken }); t('Token Refresh', 'POST', r.status);
  r = await req('POST', '/api/v1/auth/change-password', token, { currentPassword: 'Admin@123456', newPassword: 'Admin@123456' }); t('Change Password', 'POST', r.status);
  r = await req('POST', '/api/v1/auth/logout', token); t('Logout', 'POST', r.status);

  console.log('\n--- Unauthorized ---');
  r = await req('GET', '/api/v1/schools', null); t('No Auth -> 401', 'GET', r.status);
  console.log('  401 check:', r.status === 401 ? 'PASS' : 'FAIL');

  console.log('\n=== RESULTS: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(0);
}

main().catch(e => { console.log('FATAL:', e.message); process.exit(1); });
