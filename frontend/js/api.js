document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.pathname.includes('/result')) return;

    const payload = JSON.parse(localStorage.getItem('taxcompare_input'));
    if (!payload) { window.location.href = '/'; return; }

    fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('taxcompare_result', JSON.stringify(data.data));
            window.dispatchEvent(new CustomEvent('resultReady', { detail: data.data }));
        } else {
            alert('Calculation Error: ' + (data.error || 'Unknown'));
            window.location.href = '/';
        }
    })
    .catch(err => {
        console.error(err);
        alert('Server connection failed. Make sure Flask is running.');
    });
});
