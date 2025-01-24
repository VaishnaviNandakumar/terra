from flask import current_app
from models import Transactions
import pandas as pd
from db_handler import DatabaseService
from datetime import datetime

db_service = DatabaseService()

from datetime import datetime

DATE_FORMATS = [
    '%Y-%m-%d %H:%M:%S',  # e.g., 2024-01-01 00:00:00
    '%d/%m/%Y',           # e.g., 01/01/2024
    '%d/%m/%y',           # e.g., 01/01/24
    '%Y-%m-%d',           # e.g., 2024-01-01
    '%m/%d/%Y',           # e.g., 01/01/2024 (US format)
]

def parse_date(date_str):
    """Parse a date string using multiple formats."""
    if isinstance(date_str, str):
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
    return None  # Return None if no format matches or invalid type

def write_db(df, session_id):
    """Transforms data and writes it to the database using DatabaseService."""
    try:
        # Ensure 'Date' column is converted to string
        df['Date'] = df['Date'].apply(lambda x: str(x).strip() if not pd.isna(x) else '')  # Convert everything to string
        
        # Apply the custom date parser
        df['Date'] = df['Date'].apply(parse_date)

        # Handle invalid dates (NaT after parsing)
        if df['Date'].isnull().any():
            invalid_dates = df[df['Date'].isnull()]
            print(f"Invalid date rows: {invalid_dates}")
            # Option 1: Drop rows with invalid dates
            df = df.dropna(subset=['Date'])  # Drop rows with invalid dates
            # Option 2: Replace 'NaT' with a default date (e.g., 1970-01-01 or NULL)
            # df['Date'].fillna(pd.to_datetime('1970-01-01'), inplace=True)  # Or use pd.NaT or None for NULL if supported by your DB

        # Prepare transaction data
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

        # Write to database
        db_service.write_transactions(transactions_data)

    except Exception as e:
        raise
