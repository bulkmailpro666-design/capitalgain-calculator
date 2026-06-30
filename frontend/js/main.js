function fmt(n) { return '₹' + Number(n).toLocaleString('en-IN', {maximumFractionDigits: 0}); }

function renderDetails(id, d, title) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `
        <div class="detail-row"><span>Gross Income</span><span>${fmt(d.gross)}</span></div>
        <div class="detail-row"><span>Standard Deduction</span><span>-${fmt(d.std_ded)}</span></div>
        ${title==='old' ? `<div class="detail-row"><span>Total Deductions</span><span>-${fmt(d.deductions)}</span></div>` : ''}
        <div class="detail-row"><span>Taxable Income</span><span>${fmt(d.taxable)}</span></div>
        <div class="detail-row"><span>Slab Tax</span><span>${fmt(d.tax)}</span></div>
        <div class="detail-row"><span>Rebate 87A</span><span>-${fmt(d.rebate)}</span></div>
        <div class="detail-row"><span>Cess (4%)</span><span>+${fmt(d.cess)}</span></div>
        <div class="detail-row total"><span>FINAL TAX</span><span>${fmt(d.final_tax)}</span></div>
    `;
}

window.addEventListener('resultReady', (e) => {
    const d = e.detail;
    const banner = document.getElementById('winnerBanner');
    if (banner) banner.innerHTML = `✅ ${d.winner} Saves You <strong>${fmt(d.saving)}</strong> / Year`;
    
    renderDetails('newDetails', {gross: d.gross_income, ...d.new}, 'new');
    renderDetails('oldDetails', {gross: d.gross_income, ...d.old}, 'old');

    const chartCtx = document.getElementById('taxChart');
    if (chartCtx) {
        new Chart(chartCtx, {
            type: 'bar',
            data: { labels: ['New Regime', 'Old Regime'], datasets: [{ data: [d.new.final_tax, d.old.final_tax], backgroundColor: ['#10b981', '#3b82f6'] }] },
            options: { responsive: true, plugins: { title: {display: true, text: 'Final Tax Comparison'} } }
        });
    }

    const sug = document.getElementById('suggestions');
    if (sug) {
        sug.innerHTML = d.winner === 'New Regime' 
            ? '💡 <strong>Tip:</strong> Maximize HRA & Home Loan benefits to make Old Regime better next year.'
            : '💡 <strong>Tip:</strong> Invest in 80C & NPS to reduce taxable income under Old Regime.';
    }

    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.onclick = () => {
            const {jsPDF} = window.jspdf;
            const doc = new jsPDF();
            doc.text('TaxCompare Report', 105, 20, {align:'center'});
            doc.autoTable({ startY: 30, head: [['Regime', 'Taxable Income', 'Final Tax']], 
                body: [['New Regime', fmt(d.new.taxable), fmt(d.new.final_tax)], ['Old Regime', fmt(d.old.taxable), fmt(d.old.final_tax)]] });
            doc.save('TaxCompare_Report.pdf');
        };
    }

    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.onclick = () => {
            const txt = `My Tax Result: ${d.winner} saves ${fmt(d.saving)}. New: ${fmt(d.new.final_tax)}, Old: ${fmt(d.old.final_tax)}`;
            navigator.clipboard.writeText(txt).then(() => alert('Summary copied to clipboard!'));
        };
    }
});
