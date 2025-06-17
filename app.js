let records = [];

function loadRecords() {
    records = JSON.parse(localStorage.getItem('fertilizerRecords') || '[]');
}

function saveRecords() {
    localStorage.setItem('fertilizerRecords', JSON.stringify(records));
}

function addProduction(e) {
    e.preventDefault();
    const r = {
        id: Date.now(),
        item: document.getElementById('prodItem').value,
        prodQty: parseFloat(document.getElementById('prodQty').value) || 0,
        prodDate: document.getElementById('prodDate').value,
        shipQty: 0,
        shipDate: '',
        status: document.getElementById('prodStatus').value,
        notes: document.getElementById('prodNotes').value
    };
    records.push(r);
    saveRecords();
    refresh();
    e.target.reset();
}

function addShipment(e) {
    e.preventDefault();
    const r = {
        id: Date.now(),
        item: document.getElementById('shipItem').value,
        prodQty: 0,
        prodDate: '',
        shipQty: parseFloat(document.getElementById('shipQty').value) || 0,
        shipDate: document.getElementById('shipDate').value,
        status: 'In Progress',
        notes: document.getElementById('shipNotes').value
    };
    records.push(r);
    saveRecords();
    refresh();
    e.target.reset();
}

function getDateValue(r) {
    return r.prodDate || r.shipDate || '';
}

function getWeekString(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const month = d.toLocaleString('default', { month: 'short' }).toUpperCase();
    const week = Math.ceil(d.getDate() / 7);
    return `${month} WEEK ${week}`;
}

function computeStats() {
    const map = {};
    records.forEach(r => {
        if (!map[r.item]) map[r.item] = { prod: 0, ship: 0 };
        map[r.item].prod += r.prodQty;
        map[r.item].ship += r.shipQty;
    });
    return map;
}

function computeInventory() {
    const inventory = {};
    const sorted = [...records].sort((a,b)=>new Date(getDateValue(a)) - new Date(getDateValue(b)));
    sorted.forEach(r => {
        const prev = inventory[r.item] || 0;
        inventory[r.item] = prev + r.prodQty - r.shipQty;
        r.inventory = inventory[r.item];
    });
}

function refreshFilters() {
    const weekSel = document.getElementById('filterWeek');
    const itemSel = document.getElementById('filterItem');
    if (!weekSel || !itemSel) return;
    const weeks = new Set();
    const items = new Set();
    records.forEach(r => {
        weeks.add(getWeekString(getDateValue(r)));
        items.add(r.item);
    });
    weekSel.innerHTML = '<option value="">All Weeks</option>' + Array.from(weeks).map(w=>`<option>${w}</option>`).join('');
    itemSel.innerHTML = '<option value="">All Items</option>' + Array.from(items).map(i=>`<option>${i}</option>`).join('');
}

function openEdit(id) {
    const r = records.find(x=>x.id===id);
    if (!r) return;
    document.getElementById('editId').value = r.id;
    document.getElementById('editItem').value = r.item;
    document.getElementById('editStatus').value = r.status || 'In Progress';
    document.getElementById('editProdQty').value = r.prodQty || '';
    document.getElementById('editProdDate').value = r.prodDate || '';
    document.getElementById('editShipQty').value = r.shipQty || '';
    document.getElementById('editShipDate').value = r.shipDate || '';
    document.getElementById('editNotes').value = r.notes || '';
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

function saveEdit(e) {
    e.preventDefault();
    const id = Number(document.getElementById('editId').value);
    const r = records.find(x=>x.id===id);
    if (!r) return;
    r.item = document.getElementById('editItem').value;
    r.status = document.getElementById('editStatus').value;
    r.prodQty = parseFloat(document.getElementById('editProdQty').value) || 0;
    r.prodDate = document.getElementById('editProdDate').value;
    r.shipQty = parseFloat(document.getElementById('editShipQty').value) || 0;
    r.shipDate = document.getElementById('editShipDate').value;
    r.notes = document.getElementById('editNotes').value;
    saveRecords();
    bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    refresh();
}

function deleteRecord(id) {
    records = records.filter(r=>r.id!==id);
    saveRecords();
    refresh();
}

function buildTable() {
    const tbody = document.querySelector('#recordTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    computeInventory();
    const stats = computeStats();
    const weekFilter = document.getElementById('filterWeek').value;
    const itemFilter = document.getElementById('filterItem').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const sorted = [...records].sort((a,b)=>new Date(getDateValue(a)) - new Date(getDateValue(b)));
    let currentWeek = '';
    sorted.forEach(r => {
        const week = getWeekString(getDateValue(r));
        if (weekFilter && week!==weekFilter) return;
        if (itemFilter && r.item!==itemFilter) return;
        if (statusFilter && r.status!==statusFilter) return;
        if (week !== currentWeek) {
            const trHead = document.createElement('tr');
            trHead.className = 'table-secondary';
            trHead.innerHTML = `<th colspan="10">${week}</th>`;
            tbody.appendChild(trHead);
            currentWeek = week;
        }
        const percent = stats[r.item] ? ((stats[r.item].ship / stats[r.item].prod) * 100).toFixed(1) : '0';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.item}</td>
            <td>${r.prodQty || ''}</td>
            <td>${r.prodDate || ''}</td>
            <td>${r.shipQty || ''}</td>
            <td>${r.shipDate || ''}</td>
            <td>${r.inventory || 0}</td>
            <td>${percent}%</td>
            <td>${r.status || ''}</td>
            <td>${r.notes || ''}</td>
            <td><button class="btn btn-sm btn-outline-primary me-1" onclick="openEdit(${r.id})">Edit</button><button class="btn btn-sm btn-outline-danger" onclick="deleteRecord(${r.id})">Delete</button></td>`;
        tbody.appendChild(tr);
    });
}

function buildDashTable() {
    const tbody = document.querySelector('#dashTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    computeInventory();
    const stats = computeStats();
    const sorted = [...records].sort((a,b)=>new Date(getDateValue(a)) - new Date(getDateValue(b)));
    sorted.forEach(r => {
        const percent = stats[r.item] ? ((stats[r.item].ship / stats[r.item].prod) * 100).toFixed(1) : '0';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.item}</td>
            <td>${r.prodQty || ''}</td>
            <td>${r.prodDate || ''}</td>
            <td>${r.shipQty || ''}</td>
            <td>${r.shipDate || ''}</td>
            <td>${r.inventory || 0}</td>
            <td>${percent}%</td>
            <td>${r.status || ''}</td>
            <td>${r.notes || ''}</td>`;
        tbody.appendChild(tr);
    });
}

function exportExcel() {
    const table = document.getElementById('recordTable') || document.getElementById('dashTable');
    if (!table) return;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(table), 'Records');
    XLSX.writeFile(wb, 'fertilizer_records.xlsx');
}

let barChart, pieChart, lineChart;
function buildCharts() {
    if (!document.getElementById('barChart')) return;
    computeInventory();
    const stats = computeStats();
    const labels = Object.keys(stats);
    const produced = labels.map(l=>stats[l].prod);
    const shipped = labels.map(l=>stats[l].ship);
    const inventory = labels.map(l=>stats[l].prod - stats[l].ship);
    // bar chart
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy();
    barChart = new Chart(barCtx, {
        type:'bar',
        data:{ labels, datasets:[{label:'Produced',data:produced,backgroundColor:'#4e73df'}, {label:'Shipped',data:shipped,backgroundColor:'#1cc88a'}] },
        options:{ responsive:true }
    });
    // pie chart
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();
    pieChart = new Chart(pieCtx, {
        type:'pie',
        data:{ labels, datasets:[{data:inventory, backgroundColor:['#4e73df','#1cc88a','#36b9cc','#f6c23e','#e74a3b']} ] }
    });
    // line chart
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy();
    const weekMap = {};
    records.forEach(r=>{
        const w = getWeekString(getDateValue(r));
        if (!weekMap[w]) weekMap[w]={prod:0,ship:0};
        weekMap[w].prod += r.prodQty;
        weekMap[w].ship += r.shipQty;
    });
    const weekLabels = Object.keys(weekMap);
    const weekProd = weekLabels.map(w=>weekMap[w].prod);
    const weekShip = weekLabels.map(w=>weekMap[w].ship);
    lineChart = new Chart(lineCtx, {
        type:'line',
        data:{ labels:weekLabels, datasets:[{label:'Produced',data:weekProd,borderColor:'#4e73df'},{label:'Shipped',data:weekShip,borderColor:'#1cc88a'}] },
        options:{ responsive:true }
    });
    // update stats
    const totalProd = produced.reduce((a,b)=>a+b,0);
    const totalShip = shipped.reduce((a,b)=>a+b,0);
    document.getElementById('statProduced').innerText = totalProd;
    document.getElementById('statShipped').innerText = totalShip;
    document.getElementById('statInventory').innerText = totalProd - totalShip;
    const percent = totalProd? ((totalShip/totalProd)*100).toFixed(1):0;
    document.getElementById('statPercent').innerText = percent + '%';
}

function refresh() {
    refreshFilters();
    buildTable();
    buildDashTable();
    buildCharts();
}

function init() {
    loadRecords();
    refresh();
    if (document.getElementById('prodForm')) document.getElementById('prodForm').addEventListener('submit', addProduction);
    if (document.getElementById('shipForm')) document.getElementById('shipForm').addEventListener('submit', addShipment);
    if (document.getElementById('editForm')) document.getElementById('editForm').addEventListener('submit', saveEdit);
    if (document.getElementById('filterWeek')) document.getElementById('filterWeek').addEventListener('change', buildTable);
    if (document.getElementById('filterItem')) document.getElementById('filterItem').addEventListener('change', buildTable);
    if (document.getElementById('filterStatus')) document.getElementById('filterStatus').addEventListener('change', buildTable);
    const navExport = document.getElementById('navExport') || document.getElementById('navExportDash');
    if (navExport) navExport.addEventListener('click', exportExcel);
}

document.addEventListener('DOMContentLoaded', init);
