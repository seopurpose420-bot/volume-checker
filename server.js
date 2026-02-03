const express = require('express');
const app = express();

app.use(express.json());

let keywordData = [];
let authenticated = false;

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Store keywords (no auth required for posting)
app.post('/api/keywords', (req, res) => {
  console.log('Received POST request:', req.body);
  const { data } = req.body;
  if (data && Array.isArray(data)) {
    keywordData.push(...data);
    console.log('Data stored. Total items:', keywordData.length);
    res.json({ success: true, count: data.length });
  } else {
    console.log('Invalid data format:', data);
    res.status(400).json({ error: 'Invalid data' });
  }
});

// Get keywords
app.get('/api/keywords', (req, res) => {
  console.log('GET request - Auth status:', authenticated, 'Data count:', keywordData.length);
  if (!authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(keywordData);
});

// Clear keywords
app.delete('/api/keywords', (req, res) => {
  if (!authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  keywordData = [];
  res.json({ success: true });
});

// Login page
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Keyword Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; text-align: center; }
        h1 { margin-bottom: 30px; color: #333; }
        input { width: 100%; padding: 15px; margin: 10px 0; border: 2px solid #ddd; border-radius: 10px; font-size: 16px; }
        button { width: 100%; padding: 15px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; }
        .error { color: red; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Login</h1>
        <input type="text" id="username" placeholder="Username" value="admin">
        <input type="password" id="password" placeholder="Password" value="admin123">
        <button onclick="login()">Sign In</button>
        <div id="error" class="error"></div>
    </div>
    <script>
        async function login() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (response.ok) {
                    window.location.href = '/dashboard';
                } else {
                    document.getElementById('error').textContent = 'Invalid credentials';
                }
            } catch (error) {
                document.getElementById('error').textContent = 'Login failed';
            }
        }
    </script>
</body>
</html>`);
});

// Dashboard page
app.get('/dashboard', (req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Keyword Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; display: flex; justify-content: space-between; align-items: center; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { background: white; padding: 30px; margin: 20px 0; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        textarea { width: 100%; height: 100px; padding: 15px; border: 2px solid #ddd; border-radius: 10px; }
        button { padding: 12px 24px; margin: 5px; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        .btn-primary { background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
        .btn-danger { background: #dc3545; color: white; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px; }
        td { padding: 15px; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Keyword Dashboard</h1>
        <button onclick="window.location.href='/'" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 10px 20px; border-radius: 25px; cursor: pointer;">Logout</button>
    </div>
    <div class="container">
        <div class="card">
            <h2>🔍 Search Keywords</h2>
            <div style="display: flex; gap: 15px; margin-bottom: 15px; flex-wrap: wrap;">
                <input type="date" id="dateFrom" style="padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <input type="date" id="dateTo" style="padding: 10px; border: 2px solid #ddd; border-radius: 8px;">
                <button class="btn-primary" onclick="filterByDate()">📅 Filter by Date</button>
            </div>
            <textarea id="keywords" placeholder="Enter keywords (one per line)"></textarea>
            <button class="btn-primary" onclick="showVolumes()">📊 Show Volumes</button>
            <button class="btn-primary" onclick="loadAll()">📋 Show All</button>
        </div>
        <div class="card">
            <h2>📈 Data Table</h2>
            <div style="margin-bottom: 15px;">
                <button class="btn-primary" onclick="copyTable()">📋 Copy Table</button>
                <button class="btn-danger" onclick="clearData()">🗑️ Clear All</button>
            </div>
            <table>
                <thead>
                    <tr><th>Keyword</th><th>Volume</th><th>Date</th></tr>
                </thead>
                <tbody id="tableBody"></tbody>
            </table>
        </div>
    </div>
    <script>
        let allData = [];
        
        async function loadAll() {
            try {
                const response = await fetch('/api/keywords');
                if (response.ok) {
                    allData = await response.json();
                    displayData(allData);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
        
        function displayData(data) {
            const tbody = document.getElementById('tableBody');
            tbody.innerHTML = '';
            data.forEach(item => {
                const row = tbody.insertRow();
                row.insertCell(0).textContent = item.keyword;
                row.insertCell(1).textContent = item.search_volume > 0 ? item.search_volume.toLocaleString() : 'NA';
                row.insertCell(2).textContent = new Date(item.selected_date).toLocaleDateString();
            });
        }
        
        function showVolumes() {
            const keywords = document.getElementById('keywords').value.split('\\n').map(k => k.trim()).filter(k => k);
            if (!keywords.length) return alert('Enter keywords');
            
            let filtered = allData.filter(item => 
                keywords.some(keyword => item.keyword.toLowerCase().includes(keyword.toLowerCase()))
            );
            
            filtered = applyDateFilter(filtered);
            displayData(filtered);
        }
        
        function filterByDate() {
            const filtered = applyDateFilter(allData);
            displayData(filtered);
        }
        
        function applyDateFilter(data) {
            const dateFrom = document.getElementById('dateFrom').value;
            const dateTo = document.getElementById('dateTo').value;
            
            let filtered = data;
            
            if (dateFrom) {
                filtered = filtered.filter(item => 
                    new Date(item.selected_date) >= new Date(dateFrom)
                );
            }
            
            if (dateTo) {
                filtered = filtered.filter(item => 
                    new Date(item.selected_date) <= new Date(dateTo)
                );
            }
            
            return filtered;
        }
        
        function copyTable() {
            const table = document.querySelector('table');
            const rows = table.querySelectorAll('tr');
            let text = '';
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                const rowText = Array.from(cells).map(cell => cell.textContent).join('\\t');
                text += rowText + '\\n';
            });
            
            navigator.clipboard.writeText(text).then(() => {
                alert('Table copied to clipboard!');
            }).catch(() => {
                alert('Failed to copy table');
            });
        }
        
        async function clearData() {
            if (confirm('Clear all data?')) {
                try {
                    await fetch('/api/keywords', { method: 'DELETE' });
                    allData = [];
                    displayData([]);
                } catch (error) {
                    alert('Failed to clear');
                }
            }
        }
        
        loadAll();
    </script>
</body>
</html>`);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
