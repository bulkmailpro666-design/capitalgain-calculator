from datetime import datetime

def parse_and_validate_trades(trades_data):
    validated, errors = [], []
    for i, t in enumerate(trades_data):
        try:
            buy = datetime.strptime(t['buy_date'], "%d/%m/%Y")
            sell = datetime.strptime(t['sell_date'], "%d/%m/%Y")
            if sell <= buy:
                errors.append(f"Trade {i+1}: Sell date must be after buy date."); continue
            bp, sp, qty = float(t['buy_price']), float(t['sell_price']), int(t['quantity'])
            if bp <= 0 or sp <= 0 or qty <= 0:
                errors.append(f"Trade {i+1}: Price & quantity must be positive."); continue
            asset = t['asset_type'].lower()
            if asset not in ['equity', 'crypto', 'debt_mf']:
                errors.append(f"Trade {i+1}: Invalid asset type."); continue
            validated.append({"stock_name": str(t['stock_name']), "buy_date": buy, "buy_price": bp,
                              "sell_date": sell, "sell_price": sp, "quantity": qty, "asset_type": asset})
        except Exception as e: errors.append(f"Trade {i+1}: {str(e)}")
    return validated, errors
