TAX_RULES = {
    "equity": {"stcg_rate": 0.20, "ltcg_exemption": 125000, "ltcg_rate": 0.125},
    "crypto": {"flat_rate": 0.30}
}
CESS_RATE = 0.04

def calculate_tax(trades, user_slab=0.0):
    summary = {
        "total_stcg_gain": 0.0, "total_ltcg_gain": 0.0,
        "stcg_tax": 0.0, "ltcg_tax": 0.0,
        "crypto_tax": 0.0, "debt_mf_tax": 0.0,
        "total_tax_before_cess": 0.0, "cess": 0.0, "total_tax": 0.0,
        "ltcg_exemption_used": 0.0, "ltcg_exemption_remaining": 0.0
    }
    trade_results = []
    total_ltcg_gain = 0.0

    for t in trades:
        holding_days = (t['sell_date'] - t['buy_date']).days
        gain = (t['sell_price'] - t['buy_price']) * t['quantity']

        if t['asset_type'] == 'equity':
            gain_type = "LTCG" if holding_days >= 365 else "STCG"
        elif t['asset_type'] == 'crypto':
            gain_type = "Crypto"
        else:
            gain_type = "Debt MF"

        trade_results.append({
            "stock_name": t['stock_name'],
            "buy_date": t['buy_date'].strftime("%d/%m/%Y"),
            "sell_date": t['sell_date'].strftime("%d/%m/%Y"),
            "quantity": t['quantity'], "buy_price": t['buy_price'],
            "sell_price": t['sell_price'], "asset_type": t['asset_type'],
            "gain": round(gain, 2), "holding_days": holding_days,
            "gain_type": gain_type, "tax": 0.0
        })

    for tr in trade_results:
        if tr['gain'] <= 0: continue
        if tr['asset_type'] == 'equity':
            if tr['gain_type'] == 'STCG': summary['total_stcg_gain'] += tr['gain']
            else:
                summary['total_ltcg_gain'] += tr['gain']
                total_ltcg_gain += tr['gain']
        elif tr['asset_type'] == 'crypto':
            summary['crypto_tax'] += tr['gain'] * TAX_RULES['crypto']['flat_rate']
        elif tr['asset_type'] == 'debt_mf':
            summary['debt_mf_tax'] += tr['gain'] * user_slab

    if total_ltcg_gain > 0:
        exempt = TAX_RULES['equity']['ltcg_exemption']
        taxable = max(0, total_ltcg_gain - exempt)
        summary['ltcg_exemption_used'] = min(total_ltcg_gain, exempt)
        summary['ltcg_exemption_remaining'] = max(0, exempt - total_ltcg_gain)
        summary['ltcg_tax'] = taxable * TAX_RULES['equity']['ltcg_rate']

    summary['total_tax_before_cess'] = (
        summary['stcg_tax'] + summary['ltcg_tax'] +
        summary['crypto_tax'] + summary['debt_mf_tax']
    )
    summary['cess'] = summary['total_tax_before_cess'] * CESS_RATE
    summary['total_tax'] = summary['total_tax_before_cess'] + summary['cess']

    if total_ltcg_gain > 0 and summary['ltcg_tax'] > 0:
        ratio = summary['ltcg_tax'] / total_ltcg_gain
        for tr in trade_results:
            if tr['asset_type'] == 'equity' and tr['gain_type'] == 'LTCG' and tr['gain'] > 0:
                tr['tax'] = round(tr['gain'] * ratio, 2)

    for tr in trade_results:
        if tr['asset_type'] == 'equity' and tr['gain_type'] == 'STCG' and tr['gain'] > 0:
            tr['tax'] = round(tr['gain'] * TAX_RULES['equity']['stcg_rate'], 2)
        elif tr['asset_type'] == 'crypto' and tr['gain'] > 0:
            tr['tax'] = round(tr['gain'] * TAX_RULES['crypto']['flat_rate'], 2)
        elif tr['asset_type'] == 'debt_mf' and tr['gain'] > 0:
            tr['tax'] = round(tr['gain'] * user_slab, 2)

    return summary, trade_results