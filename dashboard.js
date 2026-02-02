let allData = [];

async function loadAllData() {
    try {
        const response = await fetch('/api/keywords');
        if (response.status === 401) {
            window.location.href = '/';
            return;
        }
        allData = await response.json();
        displayTable(allData);
        updateStats(allData);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

function displayTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; color: #6c757d; padding: 40px;">No data available</td></tr>';
        return;
    }
    
    // Group data by keyword
    const grouped = {};
    data.forEach(item => {
        if (!grouped[item.keyword]) {
            grouped[item.keyword] = {};
        }
        const date = new Date(item.selected_date).toDateString();
        grouped[item.keyword][date] = item.search_volume > 0 ? item.search_volume.toLocaleString() : 'NA';
    });
    
    // Get all unique dates and sort them
    const allDates = [...new Set(data.map(item => new Date(item.selected_date).toDateString()))]
        .sort((a, b) => new Date(a) - new Date(b));
    
    // Create header row with dates
    const headerRow = tbody.insertRow();
    headerRow.insertCell(0).innerHTML = '<strong>Keyword</strong>';
    allDates.forEach(date => {
        const cell = headerRow.insertCell();
        cell.innerHTML = `<strong>${date}</strong>`;
        cell.style.textAlign = 'center';
        cell.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        cell.style.color = 'white';
    });
    
    // Create data rows
    Object.keys(grouped).forEach(keyword => {
        const row = tbody.insertRow();
        
        const keywordCell = row.insertCell(0);
        keywordCell.textContent = keyword;
        keywordCell.className = 'keyword-col';
        
        allDates.forEach(date => {
            const volumeCell = row.insertCell();
            volumeCell.textContent = grouped[keyword][date] || 'NA';
            volumeCell.className = 'volume-col';
            volumeCell.style.textAlign = 'center';
            if (volumeCell.textContent === 'NA') {
                volumeCell.classList.add('na');
            }
        });
    });
}

function showVolumes() {
    const keywordSearch = document.getElementById('keyword-search').value.toLowerCase();
    const dateFrom = document.getElementById('date-from').value;
    const dateTo = document.getElementById('date-to').value;
    
    if (!keywordSearch.trim()) {
        alert('Please enter keywords to search');
        return;
    }
    
    // Ensure data is loaded first
    if (allData.length === 0) {
        loadAllData().then(() => filterAndDisplay());
    } else {
        filterAndDisplay();
    }
    
    function filterAndDisplay() {
        let filtered = allData;
        
        const keywords = keywordSearch.split('\n').map(k => k.trim()).filter(k => k);
        filtered = filtered.filter(item => 
            keywords.some(keyword => item.keyword.toLowerCase().includes(keyword))
        );
        
        if (dateFrom) {
            filtered = filtered.filter(item => 
                new Date(item.selected_date) >= new Date(dateFrom)
            );
        }
        
        if (dateTo) {
            filtered = filtered.filter(item => 
                new Date(item.selected_date) <= new Date(dateTo + 'T23:59:59')
            );
        }
        
        displayTable(filtered);
        updateStats(filtered);
    }
}

function updateStats(data) {
    const totalKeywords = new Set(data.map(item => item.keyword)).size;
    const volumes = data.map(item => item.search_volume).filter(v => v > 0);
    const avgVolume = volumes.length > 0 ? Math.round(volumes.reduce((a, b) => a + b, 0) / volumes.length) : 0;
    const totalVolume = volumes.reduce((a, b) => a + b, 0);
    
    document.getElementById('totalKeywords').textContent = totalKeywords.toLocaleString();
    document.getElementById('avgVolume').textContent = avgVolume.toLocaleString();
    document.getElementById('totalVolume').textContent = totalVolume.toLocaleString();
}

async function clearTable() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        try {
            const response = await fetch('/api/keywords', { method: 'DELETE' });
            if (response.ok) {
                allData = [];
                displayTable([]);
                updateStats([]);
                alert('All data cleared successfully!');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Failed to clear data. Please try again.');
        }
    }
}

function copyTable() {
    const table = document.getElementById('data-table');
    const rows = table.querySelectorAll('tr');
    let text = '';
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('th, td');
        const rowText = Array.from(cells).map(cell => cell.textContent).join('\t');
        text += rowText + '\n';
    });
    
    navigator.clipboard.writeText(text).then(() => {
        alert('Table copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy table. Please try again.');
    });
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/';
    } catch (error) {
        window.location.href = '/';
    }
}

// Load data on page load
window.onload = loadAllData;