from dataclasses import dataclass
from datetime import datetime

@dataclass
class Trade:
    stock_name: str
    buy_date: datetime
    buy_price: float
    sell_price: float
    quantity: int
    asset_type: str
    gain: float = 0.0
    holding_days: int = 0
    gain_type: str = ""