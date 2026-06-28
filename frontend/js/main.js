function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount || 0);
}

// Dark Mode
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    if(localStorage.getItem('cgc_dark_mode') === 'true') document.body.classList.add('dark-mode');
    toggle?.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('cgc_dark_mode', document.body.classList.contains('dark-mode'));
    });
}

// Charts
function renderCharts(data) {
    const ctxPie = document.getElementById('gainPieChart');
    const ctxBar = document.getElementById('gainTaxBarChart');
    if(!ctxPie || !ctxBar) return;

    const stcg = data.summary.total_stcg_gain;
    const ltcg = data.summary.total_ltcg_gain;
    const crypto = data.summary.crypto_gain;
    const totalGain = stcg + ltcg + crypto;
    const totalTax = data.summary.total_tax;

    new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['STCG', 'LTCG', 'Crypto'],
            datasets: [{ data: [stcg, ltcg, crypto], backgroundColor: ['#3b82f6', '#10b981', '#f97316'], borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Gain Breakdown' } } }
    });

    new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: ['Total Gain', 'Total Tax'],
            datasets: [{ data: [totalGain, totalTax], backgroundColor: ['#10b981', '#ef4444'], borderRadius: 6 }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Gain vs Tax' } }, scales: { y: { beginAtZero: true } } }
    });
}

// Tax Suggestions
function renderSuggestions(data) {
    const box = document.getElementById('taxSuggestions');
    const ltcg = data.summary.total_ltcg_gain;
    const hasCrypto = data.summary.crypto_gain > 0;
    let html = '';

    if(ltcg < 125000) {
        html += `<div class="suggestion-box green">✅ LTCG ₹${formatCurrency(ltcg)} hai. ₹1,25,000 tak tax-free hai. Aap aur ${formatCurrency(125000-ltcg)} profit book kar sakte ho - ZERO TAX.</div>`;
    } else {
        html += `<div class="suggestion-box yellow">⚠️ LTCG limit se ${formatCurrency(ltcg-125000)} zyada hai. Tax bachane ke liye loss-making stocks identify karo.</div>`;
    }

    if(hasCrypto) {
        html += `<div class="suggestion-box orange">🔸 Crypto pe 30% flat tax + 4% cess = 31.2% lagta hai. Loss set-off allowed nahi hai.</div>`;
    }

    if(ltcg === 0 && !hasCrypto) {
        html += `<div class="suggestion-box blue">ℹ️ Is saal koi taxable gain nahi. ₹1,25,000 LTCG limit use karo.</div>`;
    }
    box.innerHTML = html;
}

// Quick Stats
function renderStats(data) {
    const stats = document.getElementById('quickStats');
    if(!stats) return;
    const trades = data.trades;
    const profitable = trades.filter(t=>t.gain>0).length;
    const loss = trades.filter(t=>t.gain<0).length;
    const avgHold = trades.length ? trades.reduce((a,t)=>a+t.holding_days,0)/trades.length : 0;
    const totalGain = trades.reduce((a,t)=>a+t.gain,0);
    const effTax = totalGain > 0 ? (data.summary.total_tax / totalGain * 100).toFixed(2) : 0;

    stats.innerHTML = `
        <div class="stat-item"><span>Total Trades</span><strong>${trades.length}</strong></div>
        <div class="stat-item"><span>Profitable</span><strong>${profitable}</strong></div>
        <div class="stat-item"><span>Loss Making</span><strong>${loss}</strong></div>
        <div class="stat-item"><span>Avg Holding</span><strong>${Math.round(avgHold)} days</strong></div>
        <div class="stat-item"><span>Effective Tax Rate</span><strong>${effTax}%</strong></div>
    `;
}

// PDF Generation
function generatePDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const s = data.summary;

    doc.setFontSize(20); doc.text('Capital Gains Tax Report', 105, 20, {align:'center'});
    doc.setFontSize(10); doc.text(`Date: ${new Date().toLocaleDateString('en-IN')} | FY: 2025-26`, 105, 28, {align:'center'});
    
    doc.autoTable({ startY: 35, head: [['Metric', 'Amount (INR)']], body: [
        ['Total STCG Gain', s.total_stcg_gain.toFixed(2)],
        ['Total LTCG Gain', s.total_ltcg_gain.toFixed(2)],
        ['Crypto Gain', s.crypto_gain.toFixed(2)],
        ['LTCG Exemption Used', s.ltcg_exemption_used.toFixed(2)],
        ['Total Tax Payable', s.total_tax.toFixed(2)]
    ]});

    doc.addPage();
    doc.text('Trade Breakdown', 105, 20, {align:'center'});
    doc.autoTable({ startY: 25, head: [['Asset','Type','Buy','Sell','Qty','Gain','Tax']], 
        body: data.trades.map(t=>[t.stock_name, t.asset_type, t.buy_date, t.sell_date, t.quantity, t.gain.toFixed(2), t.tax.toFixed(2)]) });

    doc.save(`CapitalGains_${Date.now()}.pdf`);
}

// Share & History
function initShare() {
    document.getElementById('shareBtn')?.addEventListener('click', async () => {
        const res = JSON.parse(localStorage.getItem('cgc_current_result') || '{}');
        const text = `Capital Gains Summary:\nSTCG: ${formatCurrency(res.summary?.total_stcg_gain)}\nLTCG: ${formatCurrency(res.summary?.total_ltcg_gain)}\nCrypto: ${formatCurrency(res.summary?.crypto_gain)}\nTotal Tax: ${formatCurrency(res.summary?.total_tax)}\nCalculated via Capital Gains Calculator`;
        if(navigator.share) navigator.share({ text });
        else { navigator.clipboard.writeText(text); alert('Summary copied!'); }
    });

    document.getElementById('printBtn')?.addEventListener('click', () => window.print());
    document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
        const data = JSON.parse(localStorage.getItem('cgc_current_result'));
        if(data) generatePDF(data);
    });

    document.getElementById('saveReportBtn')?.addEventListener('click', () => {
        const history = JSON.parse(localStorage.getItem('cgc_history') || '[]');
        const result = JSON.parse(localStorage.getItem('cgc_current_result'));
        if(history.length >= 5) history.shift();
        history.push({ date: new Date().toLocaleString(), data: result });
        localStorage.setItem('cgc_history', JSON.stringify(history));
        alert('Report saved!');
    });

    document.getElementById('viewHistoryBtn')?.addEventListener('click', () => {
        const modal = document.getElementById('historyModal');
        const list = document.getElementById('historyList');
        const history = JSON.parse(localStorage.getItem('cgc_history') || '[]');
        list.innerHTML = history.length ? history.map((h,i)=>`<div class="history-item"><span>${h.date}</span><button onclick="loadHistory(${i})">Load</button></div>`).join('') : '<p>No history saved.</p>';
        modal?.classList.remove('hidden');
    });

    document.getElementById('closeModal')?.addEventListener('click', () => document.getElementById('historyModal')?.classList.add('hidden'));
    window.loadHistory = (i) => {
        const history = JSON.parse(localStorage.getItem('cgc_history'));
        localStorage.setItem('cgc_current_result', JSON.stringify(history[i].data));
        window.location.reload();
    };
}

// ✅ INIT & STRICT UI MAPPING
window.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initShare();
    
    window.addEventListener('calcReady', (e) => {
        const data = e.detail;
        const s = data.summary;

        // STRICT CARD MAPPING (NO MIXING)
        document.getElementById('stcgGain').textContent = formatCurrency(s.total_stcg_gain);
        document.getElementById('ltcgGain').textContent = formatCurrency(s.total_ltcg_gain);
        document.getElementById('cryptoGain').textContent = formatCurrency(s.crypto_gain);
        document.getElementById('ltcgExempt').textContent = `${formatCurrency(s.ltcg_exemption_used)} / ₹1,25,000`;
        document.getElementById('totalTax').textContent = formatCurrency(s.total_tax);

        // TABLE
        const tbody = document.getElementById('tradeTableBody');
        if(tbody) {
            tbody.innerHTML = data.trades.map(t=>`
                <tr>
                    <td>${t.stock_name}</td>
                    <td>${t.asset_type.toUpperCase()}</td>
                    <td>${t.buy_date}</td>
                    <td>${t.sell_date}</td>
                    <td>${t.quantity}</td>
                    <td>${formatCurrency(t.gain)}</td>
                    <td>${formatCurrency(t.tax)}</td>
                </tr>
            `).join('');
        }

        renderCharts(data);
        renderSuggestions(data);
        renderStats(data);
    });
});
