from datetime import datetime

def parse_and_validate_trades(trades_data):
    validated = []
    errors = []

    for i, t in enumerate(trades_data):
        try:
            buy_date = datetime.strptime(t['buy_date'], "%d/%m/%Y")
            sell_date = datetime.strptime(t['sell_date'], "%d/%m/%Y")
            if sell_date <= buy_date:
                errors.append(f"Trade {i+1}: Sell date must be after buy date.")
                continue

            buy_price = float(t['buy_price'])
            sell_price = float(t['sell_price'])
            quantity = int(t['quantity'])

            if buy_price <= 0 or sell_price <= 0 or quantity <= 0:
                errors.append(f"Trade {i+1}: Price & quantity must be positive.")
                continue

            asset_type = t['asset_type'].lower()
            if asset_type not in ['equity', 'crypto', 'debt_mf', 'property']:
                errors.append(f"Trade {i+1}: Invalid asset type.")
                continue

            indexed_cost = float(t.get('indexed_cost', 0)) if t.get('indexed_cost') else 0.0

            validated.append({
                "stock_name": str(t['stock_name']),
                "buy_date": buy_date, "buy_price": buy_price,
                "sell_date": sell_date, "sell_price": sell_price,
                "quantity": quantity, "asset_type": asset_type,
                "indexed_cost": indexed_cost
            })
        except Exception as e:
            errors.append(f"Trade {i+1}: {str(e)}")

    return validated, errors
