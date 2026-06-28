async function fetchTaxResult() {
    const payload = JSON.parse(localStorage.getItem('cgc_current_payload'));
    if (!payload) { window.location.href = '/'; return; }

    try {
        const res = await fetch('/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('cgc_current_result', JSON.stringify(data));
            window.dispatchEvent(new CustomEvent('calcReady', { detail: data }));
        } else {
            alert('Error: ' + (data.error || 'Calculation failed'));
            window.location.href = '/';
        }
    } catch (err) {
        alert('Server connection failed.');
        window.location.href = '/';
    }
}

window.addEventListener('DOMContentLoaded', fetchTaxResult);