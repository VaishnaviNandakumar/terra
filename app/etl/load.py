from flask import current_app
from app import db
from app.models import Transactions
import pandas as pd
from ..db_handler import DatabaseService

db_service = DatabaseService()

def write_db(df, session_id):
    """Transforms data and writes it to the database using DatabaseService."""
    df['Date'] = df['Date'].str.strip()
    df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%y')
    
    transactions_data = [
        {
            "session_id": session_id,
            "transaction_date": row['Date'],
            "narration": row['Narration'],
            "debit_amount": row['Debit Amount'],
            "product": row.get('Product'),
            "mode": row.get('Mode'),
        }
        for _, row in df.iterrows()
    ]
    db_service.write_transactions(transactions_data)