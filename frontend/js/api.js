document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/result')) return;
    const payload = JSON.parse(localStorage.getItem('cgc_current_payload'));
    if (!payload) { window.location.href = '/'; return; }
    fetch('/calculate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    .then(res => res.json()).then(data => {
        if (data.success) { localStorage.setItem('cgc_current_result', JSON.stringify(data)); window.dispatchEvent(new CustomEvent('calcReady', { detail: data })); }
        else { alert('Error: ' + (data.error || 'Calculation failed')); window.location.href = '/'; }
    }).catch(() => { alert('Server connection failed.'); window.location.href = '/'; });
});
