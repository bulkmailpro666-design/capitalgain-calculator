document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('taxForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        document.getElementById('formError').textContent = '';
        const data = {
            age: document.getElementById('age').value,
            city: document.getElementById('city').value,
            basic: document.getElementById('basic').value || 0,
            hra_received: document.getElementById('hra_received').value || 0,
            special: document.getElementById('special').value || 0,
            other_allow: document.getElementById('other_allow').value || 0,
            rental: document.getElementById('rental').value || 0,
            fd_interest: document.getElementById('fd_interest').value || 0,
            sec_80c: document.getElementById('sec_80c').value || 0,
            sec_80d: document.getElementById('sec_80d').value || 0,
            home_loan: document.getElementById('home_loan').value || 0,
            rent_paid: document.getElementById('rent_paid').value || 0,
            sec_80ccd1b: document.getElementById('sec_80ccd1b').value || 0,
            sec_80e: document.getElementById('sec_80e').value || 0,
            sec_80tta: document.getElementById('sec_80tta').value || 0,
            sec_80g: document.getElementById('sec_80g').value || 0
        };
        if(data.basic <= 0) {
            document.getElementById('formError').textContent = 'Basic Salary is required.';
            return;
        }
        localStorage.setItem('taxcompare_input', JSON.stringify(data));
        window.location.href = '/result';
    });
});
