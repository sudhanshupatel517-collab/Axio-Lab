const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'dashboard', 'src', 'App.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Overview Page Stats
content = content.replace(
  "fetch('/api/dashboard/stats')",
  "fetch('/reports', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })"
);
content = content.replace(
  "then(data => setStats(data))",
  `then(data => {
        const statuses = { Requested: 0, Processing: 0, Approved: 0, Completed: 0 };
        const testTypes = {};
        if (Array.isArray(data)) {
          data.forEach(r => {
             const st = r.status === 'pending' ? 'Requested' : r.status === 'reviewed' ? 'Approved' : 'Completed';
             statuses[st] = (statuses[st] || 0) + 1;
             const type = r.reportData || 'General Test';
             testTypes[type] = (testTypes[type] || 0) + 1;
          });
        }
        setStats({ statuses, testTypes, timeline: {} });
      })`
);

// 2. Samples Page
content = content.replace(
  "fetch('/api/requests?status=Requested,Approved')",
  "fetch('/reports', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })"
);
content = content.replace(
  "then(res => setData(res.requests || []));",
  `then(res => {
        if (!Array.isArray(res)) return setData([]);
        const mapped = res.filter(r => r.status === 'pending' || r.status === 'reviewed').map(r => ({
          id: r._id,
          axiovitalId: r._id.substring(r._id.length - 8).toUpperCase(),
          name: r.patientId ? r.patientId.name : 'Unknown',
          disease: r.reportData || 'General Test',
          collectionMethod: 'Walk-in',
          status: 'Requested'
        }));
        setData(mapped);
      });`
);
content = content.replace(
  "fetch(`/api/requests/${id}/status`, {",
  "fetch(`/reports/${id}`, {"
);
content = content.replace(
  "body: JSON.stringify({ status: 'Processing' })",
  "headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ status: 'reviewed' })"
);

// 3. Processing Page
content = content.replace(
  "fetch(`/api/requests`).then(r => r.json()).then(all => {",
  "fetch(`/reports`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }).then(r => r.json()).then(res => { const all = { requests: (res||[]).map(r => ({ id: r._id, axiovitalId: r._id.substring(r._id.length - 8).toUpperCase(), disease: r.reportData, name: r.patientId?.name })) };"
);
content = content.replace(
  "fetch(`/api/requests/${activeTest.id}/status`, {",
  "fetch(`/reports/${activeTest.id}`, {"
);
content = content.replace(
  "body: JSON.stringify({ status: 'Completed', reportFile: 'Report_Generated.pdf' })",
  "headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ status: 'completed' })"
);

// 4. Reports Page
content = content.replace(
  "fetch('/api/requests?status=Completed')",
  "fetch('/reports', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })"
);
content = content.replace(
  "then(res => setData(res.requests || []));",
  `then(res => {
        if (!Array.isArray(res)) return setData([]);
        const mapped = res.filter(r => r.status === 'completed').map(r => ({
          id: r._id,
          axiovitalId: r._id.substring(r._id.length - 8).toUpperCase(),
          name: r.patientId ? r.patientId.name : 'Unknown',
          disease: r.reportData || 'General Test',
          updatedAt: r.updatedAt
        }));
        setData(mapped);
      });`
);

// 5. Test Orders Page
content = content.replace(
  "fetch('/api/requests')",
  "fetch('/reports', { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })"
);
content = content.replace(
  "then(result => { if (result.requests) setData(result.requests); setIsLoading(false); })",
  `then(result => { 
        if (Array.isArray(result)) {
          const mapped = result.map(r => ({
            id: r._id,
            axiovitalId: r._id.substring(r._id.length - 8).toUpperCase(),
            name: r.patientId ? r.patientId.name : 'Unknown',
            age: '--', gender: '--',
            disease: r.reportData || 'General Test',
            collectionMethod: 'Walk-in',
            paymentStatus: 'Paid',
            status: r.status === 'pending' ? 'Requested' : r.status === 'reviewed' ? 'Approved' : 'Completed',
            updatedAt: r.updatedAt
          }));
          setData(mapped);
        }
        setIsLoading(false); 
      })`
);
content = content.replace(
  "fetch(`/api/requests/${id}/status`, {",
  "fetch(`/reports/${id}`, {"
);
content = content.replace(
  "body: JSON.stringify({ status })",
  "headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') }, body: JSON.stringify({ status: status === 'Completed' ? 'completed' : status === 'Processing' ? 'reviewed' : 'pending' })"
);

// 6. Login
content = content.replace(
  "const res = await fetch('/api/login', {",
  "const res = await fetch('/auth/login', {"
);
content = content.replace(
  "localStorage.setItem('isAuthenticated', 'true');",
  "localStorage.setItem('isAuthenticated', 'true'); localStorage.setItem('token', data.token);"
);
content = content.replace(
  "setAdminData(data.user);",
  "setAdminData({ id: data._id, name: data.name, email: data.email, role: data.role });"
);

// 7. Register
content = content.replace(
  "const res = await fetch('/api/register', {",
  "const res = await fetch('/auth/signup', {"
);
content = content.replace(
  "body: JSON.stringify({ name, email, password })",
  "body: JSON.stringify({ name, email, password, role: 'hospital' })"
);

// 8. Forgot Password -> update-password
content = content.replace(
  "const res = await fetch('/api/forgot-password', {",
  "const res = await fetch('/auth/update-password', {"
);

// 9. Profile & Settings
content = content.replace(
  "fetch(`/api/users/${adminData.id}/profile`, {",
  "fetch(`/api/users/profile`, {" 
);
content = content.replace(
  "fetch(`/api/users/${adminData.id}/password`, {",
  "fetch(`/auth/update-password`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token'), 'Content-Type': 'application/json' }," 
);

fs.writeFileSync(filePath, content);
console.log('App.jsx updated for new API.');
