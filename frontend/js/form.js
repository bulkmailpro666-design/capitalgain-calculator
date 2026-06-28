document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('tradesContainer');
    const addBtn = document.getElementById('addTradeBtn');
    const form = document.getElementById('tradeForm');
    const errorBox = document.getElementById('formError');
    let tradeCount = 0;

    function createTradeCard(data = {}) {
        tradeCount++;
        const card = document.createElement('div');
        card.className = 'trade-card';
        card.innerHTML = `
            <div class="trade-header">
                <span class="trade-number">Trade #${tradeCount}</span>
                <div class="trade-actions">
                    <button type="button" class="duplicate-btn">📋 Copy</button>
                    <button type="button" class="remove-btn" ${tradeCount === 1 ? 'disabled' : ''}>✕ Remove</button>
                </div>
            </div>
            <div class="grid">
                <div class="form-group"><label>Asset Type</label>
                    <select class="asset-type" required>
                        <option value="equity" ${data.asset_type==='equity'?'selected':''}>Equity Stock / MF</option>
                        <option value="crypto" ${data.asset_type==='crypto'?'selected':''}>Crypto</option>
                        <option value="debt_mf" ${data.asset_type==='debt_mf'?'selected':''}>Debt Mutual Fund</option>
                        <option value="property" ${data.asset_type==='property'?'selected':''}>Property / Real Estate</option>
                    </select>
                </div>
                <div class="form-group"><label>Asset Name</label><input type="text" class="stock-name" value="${data.stock_name||''}" required></div>
                <div class="form-group"><label>Buy Date (DD/MM/YYYY)</label><input type="text" class="buy-date" value="${data.buy_date||''}" placeholder="01/01/2023" required></div>
                <div class="form-group"><label>Buy Price (₹)</label><input type="number" step="0.01" class="buy-price" value="${data.buy_price||''}" required></div>
                <div class="form-group"><label>Sell Date (DD/MM/YYYY)</label><input type="text" class="sell-date" value="${data.sell_date||''}" placeholder="15/06/2024" required></div>
                <div class="form-group"><label>Sell Price (₹)</label><input type="number" step="0.01" class="sell-price" value="${data.sell_price||''}" required></div>
                <div class="form-group"><label>Quantity / Unit</label><input type="number" class="quantity" value="${data.quantity||''}" required></div>
                <div class="form-group indexed-cost-field" style="display:none;"><label>Indexed Cost (₹) <small>(Optional, for pre-July 2024 Property)</small></label><input type="number" step="0.01" class="indexed-cost" value="${data.indexed_cost||''}"></div>
            </div>`;
        
        // Show/Hide Indexed Cost based on Asset & Date
        const updateIndexedField = () => {
            const type = card.querySelector('.asset-type').value;
            const bDate = card.querySelector('.buy-date').value;
            const field = card.querySelector('.indexed-cost-field');
            if(type === 'property' && bDate) {
                const [d,m,y] = bDate.split('/');
                const buyDt = new Date(y, m-1, d);
                field.style.display = buyDt < new Date(2024, 6, 23) ? 'flex' : 'none';
            } else {
                field.style.display = 'none';
            }
        };
        card.querySelector('.asset-type').addEventListener('change', updateIndexedField);
        card.querySelector('.buy-date').addEventListener('input', updateIndexedField);
        updateIndexedField();

        // Real-time validation
        card.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', () => {
                if(inp.classList.contains('quantity')) inp.value = Math.floor(parseFloat(inp.value)||'');
                if(inp.value < 0) inp.value = 0;
            });
        });

        card.querySelector('.remove-btn').addEventListener('click', () => {
            if(container.children.length > 1) { card.remove(); renumberTrades(); }
        });
        card.querySelector('.duplicate-btn').addEventListener('click', () => {
            const cloneData = {
                asset_type: card.querySelector('.asset-type').value,
                stock_name: card.querySelector('.stock-name').value,
                buy_date: card.querySelector('.buy-date').value,
                buy_price: card.querySelector('.buy-price').value,
                sell_date: '', sell_price: '', quantity: card.querySelector('.quantity').value,
                indexed_cost: card.querySelector('.indexed-cost').value
            };
            container.appendChild(createTradeCard(cloneData));
        });

        card.querySelectorAll('input, select').forEach((el, idx, arr) => {
            el.addEventListener('keydown', (e) => {
                if(e.key === 'Enter') { e.preventDefault(); arr[idx+1]?.focus(); }
            });
        });

        return card;
    }

    function renumberTrades() {
        tradeCount = 0;
        document.querySelectorAll('.trade-card').forEach(card => {
            tradeCount++;
            card.querySelector('.trade-number').textContent = `Trade #${tradeCount}`;
            card.querySelector('.remove-btn').disabled = (tradeCount === 1);
        });
    }

    addBtn.addEventListener('click', () => container.appendChild(createTradeCard()));
    container.appendChild(createTradeCard());

    document.getElementById('loadLastBtn').addEventListener('click', () => {
        const last = JSON.parse(localStorage.getItem('cgc_last_calc'));
        if(last && last.trades) {
            container.innerHTML = '';
            document.getElementById('userSlab').value = last.user_slab || 0.3;
            last.trades.forEach(t => container.appendChild(createTradeCard(t)));
            renumberTrades();
        } else alert('No previous calculation found.');
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorBox.textContent = '';
        const trades = [];
        let valid = true;

        document.querySelectorAll('.trade-card').forEach((card, idx) => {
            const bd = card.querySelector('.buy-date').value;
            const sd = card.querySelector('.sell-date').value;
            const bp = parseFloat(card.querySelector('.buy-price').value);
            const sp = parseFloat(card.querySelector('.sell-price').value);
            const qty = parseInt(card.querySelector('.quantity').value);
            const ic = parseFloat(card.querySelector('.indexed-cost').value) || 0;

            if(!bd || !sd || isNaN(bp) || isNaN(sp) || isNaN(qty) || bp<=0 || sp<=0 || qty<=0) {
                errorBox.textContent = `Trade ${idx+1}: Invalid input.`; valid = false; return;
            }
            if(new Date(sd.split('/').reverse().join('-')) <= new Date(bd.split('/').reverse().join('-'))) {
                errorBox.textContent = `Trade ${idx+1}: Sell date must be after buy date.`; valid = false; return;
            }

            trades.push({
                stock_name: card.querySelector('.stock-name').value,
                buy_date: bd, buy_price: bp, sell_date: sd, sell_price: sp,
                quantity: qty, asset_type: card.querySelector('.asset-type').value,
                indexed_cost: ic
            });
        });

        if(valid) {
            const payload = { user_slab: parseFloat(document.getElementById('userSlab').value), trades };
            localStorage.setItem('cgc_last_calc', JSON.stringify(payload));
            localStorage.setItem('cgc_current_payload', JSON.stringify(payload));
            window.location.href = '/result';
        }
    });

    document.addEventListener('keydown', (e) => {
        if(e.ctrlKey && e.key === 'Enter') form.dispatchEvent(new Event('submit'));
    });
});
