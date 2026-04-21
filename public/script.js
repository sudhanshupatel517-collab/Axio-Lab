// State Management
let currentUser = null;
const API_URL = 'http://localhost:3000/api';

// Utilities
const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const msg = document.getElementById('toast-msg');
    toast.className = `toast ${type}`;
    msg.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
};

const openModal = (id) => {
    document.getElementById(id).classList.add('active');
};

const closeModal = (id) => {
    document.getElementById(id).classList.remove('active');
};

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-date').textContent = formatDate(new Date());

    // Navigation
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.addEventListener('click', (e) => {
            const viewId = li.getAttribute('data-view');
            if(!viewId) return;
            
            // Remove active from all
            document.querySelectorAll('.nav-links li').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            
            // Add active
            li.classList.add('active');
            document.getElementById(`view-${viewId}`).classList.add('active');
            
            // Load data based on view
            loadViewData(viewId);
        });
    });

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('proceed-form').addEventListener('submit', handleProceedForm);
    document.getElementById('upload-report-form').addEventListener('submit', handleReportUpload);
    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('login-form').reset();
    });
});

// --- Auth ---
async function handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            document.getElementById('logged-user-name').textContent = currentUser.name;
            document.getElementById('logged-user-role').textContent = currentUser.role;
            
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            
            loadViewData('dashboard');
        } else {
            showToast('Invalid login credentials', 'error');
        }
    } catch (err) {
        showToast('Server error. Ensure backend is running.', 'error');
    }
}

// --- View Data Loading ---
function loadViewData(viewId) {
    loadDashboardStats(); // always refresh stats when loading
    if (viewId === 'dashboard') renderCharts();
    if (viewId === 'requests') loadRequests();
    if (viewId === 'tests') loadTests();
    if (viewId === 'processing') loadProcessing();
    if (viewId === 'reports') loadReports();
}

// --- Dynamic API Fetcher Tool ---
async function changeStatus(id, newStatus, extraData = {}) {
    try {
        await fetch(`${API_URL}/requests/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, ...extraData })
        });
        return true;
    } catch(err) {
        console.error(err);
        return false;
    }
}

// --- Dashboard ---
let globalStats = null;
let charts = {
    line: null,
    bar: null,
    pie: null
};

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/dashboard/stats`);
        const stats = await res.json();
        globalStats = stats;
        
        // Sum total requests across workflow
        const total = Object.values(stats.statuses).reduce((a, b) => a + b, 0);
        
        document.getElementById('kpi-requested').textContent = total;
        document.getElementById('kpi-approved').textContent = stats.statuses['Approved'] || 0;
        document.getElementById('kpi-tests').textContent = stats.statuses['Approved'] || 0; // Using Approved as "In Queue / Tests"
        document.getElementById('kpi-processing').textContent = stats.statuses['Processing'] || 0;
        document.getElementById('kpi-completed').textContent = stats.statuses['Completed'] || 0;
        document.getElementById('kpi-sent').textContent = stats.statuses['Report Sent'] || 0;
        
        renderCharts(stats);
    } catch (err) { console.error(err); }
}

function renderCharts(stats) {
    if(!stats) return;

    // Line Chart (Timeline)
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        const labels = Object.keys(stats.timeline);
        const data = Object.values(stats.timeline);
        
        if (charts.line) {
            charts.line.data.labels = labels;
            charts.line.data.datasets[0].data = data;
            charts.line.update();
        } else {
            charts.line = new Chart(lineCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Requests Added',
                        data: data,
                        borderColor: '#3b82f6',
                        tension: 0.4
                    }]
                }
            });
        }
    }

    // Pie Chart (Status Distribution)
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        const statusKeys = ['Requested', 'Approved', 'Processing', 'Completed', 'Report Sent'];
        const statusData = statusKeys.map(k => stats.statuses[k] || 0);

        if (charts.pie) {
            charts.pie.data.datasets[0].data = statusData;
            charts.pie.update();
        } else {
            charts.pie = new Chart(pieCtx, {
                type: 'doughnut',
                data: {
                    labels: statusKeys,
                    datasets: [{
                        data: statusData,
                        backgroundColor: ['#94a3b8', '#3b82f6', '#f97316', '#10b981', '#22c55e']
                    }]
                }
            });
        }
    }

    // Bar Chart (Test Types)
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        const labels = Object.keys(stats.testTypes);
        const data = Object.values(stats.testTypes);
        
        if (charts.bar) {
            charts.bar.data.labels = labels;
            charts.bar.data.datasets[0].data = data;
            charts.bar.update();
        } else {
            charts.bar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Test Count',
                        data: data,
                        backgroundColor: '#10b981'
                    }]
                }
            });
        }
    }
}

// --- Requests View ---
async function loadRequests() {
    try {
        const res = await fetch(`${API_URL}/requests?status=Requested`);
        const data = await res.json();
        const tbody = document.getElementById('requests-table-body');
        tbody.innerHTML = '';
        
        if (data.requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No incoming patient requests.</td></tr>';
            return;
        }

        data.requests.forEach(r => {
            let payBadge = r.paymentStatus === 'Paid' ? '<span class="badge" style="background:#e8f5ec; color:#10b981;">Paid</span>' : '<span class="badge badge-pending">Pending</span>';
            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.axiovitalId}</strong></td>
                    <td>${r.name} <br><small style="color:var(--text-muted)">${r.age} yrs / ${r.gender}</small></td>
                    <td>${r.disease}</td>
                    <td><span class="badge" style="background:var(--blue-light); color:var(--blue);"><i class="fa-solid fa-person-walking-arrow-right"></i> ${r.collectionMethod}</span></td>
                    <td>${payBadge}</td>
                    <td>
                        <div style="display:flex; gap:8px;">
                            <button class="btn btn-primary small" onclick="approveRequest(${r.id})">Approve</button>
                            <button class="btn btn-outline small" onclick="rejectRequest(${r.id})">Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function approveRequest(id) {
    if (await changeStatus(id, 'Approved')) {
        showToast('Request Approved and moved to Tests Section');
        loadRequests();
    }
}

async function rejectRequest(id) {
    if (await changeStatus(id, 'Rejected')) {
        showToast('Request Rejected', 'error');
        loadRequests();
    }
}


// --- Tests View ---
async function loadTests() {
    try {
        const res = await fetch(`${API_URL}/requests?status=Approved`);
        const data = await res.json();
        const tbody = document.getElementById('tests-table-body');
        tbody.innerHTML = '';
        
        if (data.requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No approved tests ready.</td></tr>';
            return;
        }

        data.requests.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.axiovitalId}</strong></td>
                    <td>${r.name} <br><small style="color:var(--text-muted)">${r.age} yrs / ${r.gender}</small></td>
                    <td>${r.disease}</td>
                    <td>${r.collectionMethod}</td>
                    <td>
                        <button class="btn btn-primary" onclick="openProceedModal(${r.id})">Proceed <i class="fa-solid fa-arrow-right"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

function openProceedModal(id) {
    document.getElementById('proceed-req-id').value = id;
    document.getElementById('proceed-order-id').value = '';
    document.getElementById('proceed-pin').value = '';
    openModal('proceed-modal');
}

async function handleProceedForm(e) {
    e.preventDefault();
    const reqId = document.getElementById('proceed-req-id').value;
    // Prototype: accepts any input
    if (await changeStatus(reqId, 'Processing')) {
        showToast('Moved to Lab Processing successfully!');
        closeModal('proceed-modal');
        loadTests();
    }
}


// --- Lab Processing View ---
async function loadProcessing() {
    try {
        const res = await fetch(`${API_URL}/requests?status=Processing`);
        const data = await res.json();
        const tbody = document.getElementById('processing-table-body');
        tbody.innerHTML = '';
        
        if (data.requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No tests actively processing.</td></tr>';
            return;
        }

        data.requests.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.axiovitalId}</strong></td>
                    <td>${r.name}</td>
                    <td>${r.disease}</td>
                    <td><span class="badge" style="background:var(--blue-light); color:var(--blue);"><span class="pulse-dot" style="background:var(--blue)"></span> Processing</span></td>
                    <td>
                        <button id="btn-proc-${r.id}" class="btn btn-outline" style="color:var(--green); border-color:var(--green);" onclick="completeProcessing(${r.id}, this)"><i class="fa-solid fa-check"></i> Complete Checkup</button>
                    </td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

async function completeProcessing(id, btnElement) {
    if (await changeStatus(id, 'Completed')) {
        showToast('Lab test processing completed! Data synced.', 'success');
        
        // Swap button out instead of instantly clearing the row
        if (btnElement) {
            btnElement.outerHTML = `<button class="btn btn-primary" onclick="goToReports()"><i class="fa-solid fa-arrow-right"></i> Go to Reports</button>`;
        }
        
        // Update dashboard invisibly
        loadDashboardStats();
    }
}

function goToReports() {
    document.querySelector('.nav-links li[data-view="reports"]').click();
}


// --- Reports View ---
async function loadReports() {
    try {
        const res = await fetch(`${API_URL}/requests?status=Completed`);
        const data = await res.json();
        const tbody = document.getElementById('reports-table-body');
        tbody.innerHTML = '';
        
        if (data.requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No pending reports to send.</td></tr>';
            return;
        }

        data.requests.forEach(r => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>${r.axiovitalId}</strong></td>
                    <td>${r.name}</td>
                    <td>${r.disease}</td>
                    <td><span style="color:var(--text-muted);"><i class="fa-solid fa-triangle-exclamation"></i> Required</span></td>
                    <td>
                        <button class="btn btn-primary" onclick="openUploadModal(${r.id}, '${r.name}', '${r.disease}')"><i class="fa-solid fa-upload"></i> Upload</button>
                    </td>
                </tr>
            `;
        });
    } catch(err) { console.error(err); }
}

function openUploadModal(id, ptName, testName) {
    document.getElementById('report-req-id').value = id;
    document.getElementById('report-pt-name').textContent = ptName;
    document.getElementById('report-test-name').textContent = testName;
    openModal('upload-report-modal');
}

async function handleReportUpload(e) {
    e.preventDefault();
    const reqId = document.getElementById('report-req-id').value;
    const fileInput = document.getElementById('report-file');
    
    if(!fileInput.files.length) {
        showToast('Please attach a file first!', 'error');
        return;
    }
    
    // Simulate File Uploading
    const fakeFileName = fileInput.files[0].name;

    if (await changeStatus(reqId, 'Report Sent', { reportFile: fakeFileName })) {
        showToast('Report uploaded and securely sent to User App!');
        closeModal('upload-report-modal');
        document.getElementById('upload-report-form').reset();
        loadReports();
    }
}
