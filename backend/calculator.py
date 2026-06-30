def calculate_tax(data):
    # --- INPUTS ---
    age = int(data.get('age', 30))
    basic = float(data.get('basic', 0))
    hra_received = float(data.get('hra_received', 0))
    special = float(data.get('special', 0))
    other_allow = float(data.get('other_allow', 0))
    rental = float(data.get('rental', 0))
    fd_interest = float(data.get('fd_interest', 0))
    other_income = float(data.get('other_income', 0))
    
    city = data.get('city', 'non-metro')
    rent_paid_annual = float(data.get('rent_paid', 0)) * 12  # Monthly to Annual
    
    sec_80c = min(float(data.get('sec_80c', 0)), 150000)
    sec_80d_cap = 50000 if age >= 60 else 25000
    sec_80d = min(float(data.get('sec_80d', 0)), sec_80d_cap)
    home_loan = min(float(data.get('home_loan', 0)), 200000)
    sec_80ccd1b = min(float(data.get('sec_80ccd1b', 0)), 50000)
    sec_80e = float(data.get('sec_80e', 0))
    sec_80tta = min(float(data.get('sec_80tta', 0)), 10000)
    sec_80g = float(data.get('sec_80g', 0))

    gross_income = basic + hra_received + special + other_allow + rental + fd_interest + other_income

    # --- HRA EXEMPTION (Old Regime Only) ---
    hra_exempt = 0.0
    if hra_received > 0 and rent_paid_annual > 0 and basic > 0:
        hra_pct = 0.5 if city == 'metro' else 0.4
        hra_exempt = min(
            hra_received,
            hra_pct * basic,
            max(0, rent_paid_annual - (0.1 * basic))
        )

    # --- NEW REGIME ---
    new_std_ded = 75000
    new_taxable = max(0, gross_income - new_std_ded)
    new_tax = _calc_slab_tax(new_taxable, [
        (400000, 0.0), (800000, 0.05), (1200000, 0.10),
        (1600000, 0.15), (2000000, 0.20), (2400000, 0.25), (float('inf'), 0.30)
    ])
    new_rebate = min(new_tax, 60000) if new_taxable <= 1200000 else 0
    new_after_rebate = max(0, new_tax - new_rebate)
    new_cess = new_after_rebate * 0.04
    new_final = new_after_rebate + new_cess

    # --- OLD REGIME ---
    old_std_ded = 50000
    old_exempt_limit = 250000
    if 60 <= age < 80: old_exempt_limit = 300000
    elif age >= 80: old_exempt_limit = 500000

    total_old_deductions = sec_80c + sec_80d + hra_exempt + home_loan + sec_80ccd1b + sec_80e + sec_80tta + sec_80g
    old_taxable = max(0, gross_income - old_std_ded - total_old_deductions)

    old_slabs = [(old_exempt_limit, 0.0), (500000, 0.05), (1000000, 0.20), (float('inf'), 0.30)]
    old_tax = _calc_slab_tax(old_taxable, old_slabs)
    old_rebate = min(old_tax, 12500) if old_taxable <= 500000 else 0
    old_after_rebate = max(0, old_tax - old_rebate)
    old_cess = old_after_rebate * 0.04
    old_final = old_after_rebate + old_cess

    # --- COMPARISON ---
    winner = "New Regime" if new_final <= old_final else "Old Regime"
    saving = abs(new_final - old_final)

    return {
        "gross_income": round(gross_income, 2),
        "new": {"std_ded": new_std_ded, "taxable": new_taxable, "tax": new_tax, "rebate": new_rebate, "cess": new_cess, "final_tax": new_final},
        "old": {"std_ded": old_std_ded, "deductions": total_old_deductions, "taxable": old_taxable, "tax": old_tax, "rebate": old_rebate, "cess": old_cess, "final_tax": old_final},
        "winner": winner, "saving": round(saving, 2)
    }

def _calc_slab_tax(taxable, slabs):
    tax = 0.0
    prev = 0
    for limit, rate in slabs:
        if taxable > prev:
            taxable_in_slab = min(taxable, limit) - prev
            tax += taxable_in_slab * rate
            prev = limit
        else:
            break
    return tax
