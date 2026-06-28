from datetime import datetime

# FY 2025-26 Constants
CESS_RATE = 0.04
LTCG_EXEMPTION = 125000
EQUITY_STCG_RATE = 0.20
EQUITY_LTCG_RATE = 0.125
CRYPTO_RATE = 0.30
DEBT_MF_OLD_LTCG_RATE = 0.125

DEBT_MF_CUTOFF = datetime(2023, 4, 1)

def calculate_tax(trades, user_slab=0.0):
    summary = {
        "total_stcg_gain": 0.0,
        "total_ltcg_gain": 0.0,
        "crypto_gain": 0.0,
        "stcg_tax": 0.0,
        "ltcg_tax": 0.0,
        "crypto_tax": 0.0,
        "debt_mf_tax": 0.0,
        "total_tax_before_cess": 0.0,
        "cess": 0.0,
        "total_tax": 0.0,
        "ltcg_exemption_used": 0.0,
        "ltcg_exemption_remaining": 0.0
    }
    trade_results = []
    total_equity_ltcg = 0.0

    for t in trades:
        holding_days = (t['sell_date'] - t['buy_date']).days
        gain = (t['sell_price'] - t['buy_price']) * t['quantity']
        asset = t['asset_type']

        # STRICT HOLDING PERIOD LOGIC
        if asset == 'equity':
            gain_type = "LTCG" if holding_days >= 365 else "STCG"
        elif asset == 'crypto':
            gain_type = "Crypto"
        elif asset == 'debt_mf':
            is_old = t['buy_date'] < DEBT_MF_CUTOFF
            gain_type = "LTCG" if (is_old and holding_days >= 1095) else "Slab"
        else:
            gain_type = "Other"

        tax = 0.0
        if gain > 0:
            if asset == 'equity':
                if gain_type == 'STCG':
                    tax = gain * EQUITY_STCG_RATE
                    summary['total_stcg_gain'] += gain
                    summary['stcg_tax'] += tax
                else:
                    total_equity_ltcg += gain
            elif asset == 'crypto':
                tax = gain * CRYPTO_RATE
                summary['crypto_gain'] += gain
                summary['crypto_tax'] += tax
            elif asset == 'debt_mf':
                if gain_type == 'LTCG':
                    tax = gain * DEBT_MF_OLD_LTCG_RATE
                else:
                    tax = gain * user_slab
                summary['debt_mf_tax'] += tax

        trade_results.append({
            "stock_name": t['stock_name'],
            "buy_date": t['buy_date'].strftime("%d/%m/%Y"),
            "sell_date": t['sell_date'].strftime("%d/%m/%Y"),
            "quantity": t['quantity'],
            "buy_price": t['buy_price'],
            "sell_price": t['sell_price'],
            "asset_type": asset,
            "gain": round(gain, 2),
            "holding_days": holding_days,
            "gain_type": gain_type,
            "tax": round(tax, 2)
        })

    # LTCG EXEMPTION: STRICTLY EQUITY ONLY
    if total_equity_ltcg > 0:
        taxable_ltcg = max(0, total_equity_ltcg - LTCG_EXEMPTION)
        summary['total_ltcg_gain'] = total_equity_ltcg
        summary['ltcg_exemption_used'] = min(total_equity_ltcg, LTCG_EXEMPTION)
        summary['ltcg_exemption_remaining'] = max(0, LTCG_EXEMPTION - total_equity_ltcg)
        summary['ltcg_tax'] = taxable_ltcg * EQUITY_LTCG_RATE
    else:
        summary['total_ltcg_gain'] = 0.0

    # 4% CESS ON TOTAL TAX
    summary['total_tax_before_cess'] = (
        summary['stcg_tax'] + summary['ltcg_tax'] +
        summary['crypto_tax'] + summary['debt_mf_tax']
    )
    summary['cess'] = summary['total_tax_before_cess'] * CESS_RATE
    summary['total_tax'] = summary['total_tax_before_cess'] + summary['cess']

    # DISTRIBUTE LTCG TAX PROPORTIONALLY TO TRADES
    if total_equity_ltcg > 0 and summary['ltcg_tax'] > 0:
        ratio = summary['ltcg_tax'] / total_equity_ltcg
        for tr in trade_results:
            if tr['asset_type'] == 'equity' and tr['gain_type'] == 'LTCG' and tr['gain'] > 0:
                tr['tax'] = round(tr['gain'] * ratio, 2)

    return summary, trade_results
