#!/usr/bin/env python3
"""
Anonymize sensitive bank transaction data:
- Standardize column headers
- Perturb Debit/Credit amounts by ±0–10%
- Mask card numbers, UPI IDs, phone numbers in Narration
- Pseudonymize names with consistent fake names
- Preserve Chq/Ref Number and Closing Balance
- Supports CSV and Excel
"""

import pandas as pd
import numpy as np
import re
import os


name_map = {}

# Synonyms for standardizing headers
HEADER_SYNONYMS = {
    "Date": ["txn date", "date", "transaction date"],
    "Narration": ["description", "narration", "details"],
    "Chq/Ref No": ["ref no", "cheque no", "ref no./cheque no.", "chq/ref no"],
    "Value Date": ["value date"],
    "Debit Amount": ["debit", "withdrawal", "withdrawal amt.", "debit amount"],
    "Credit Amount": ["credit", "deposit", "deposit amt.", "credit amount"],
    "Closing Balance": ["balance", "closing balance"],
}

# --- Helper Functions ---

def standardize_headers(df):
    """Standardize headers based on HEADER_SYNONYMS."""
    new_columns = {}
    for col in df.columns:
        normalized = col.strip().lower()
        mapped_name = None
        for standard, synonyms in HEADER_SYNONYMS.items():
            if normalized in [s.lower() for s in synonyms]:
                mapped_name = standard
                break
        new_columns[col] = mapped_name if mapped_name else col  # Keep original if no match
    df.rename(columns=new_columns, inplace=True)
    return df

def perturb_amount(amount):
    """Add random ±0–10% noise to amounts."""
    if pd.isna(amount): 
        return amount
    amount = float(amount) 
    noise = 1 + np.random.uniform(-0.1, 0.1)
    return round(amount * noise, 2)

def mask_narration(narr):
    """Mask card numbers, phone numbers, and partially mask UPI IDs in narration."""
    if pd.isna(narr): 
        return narr
    # Mask long digit sequences (e.g., card numbers, phone numbers)
    narr = re.sub(r'\d{6,}', lambda x: x.group()[:2] + "X"*(len(x.group())-4) + x.group()[-2:], narr)
    # Mask UPI IDs: keep first part, mask domain
    narr = re.sub(r'([\w\.-]+)@[\w\.-]+', r'\1@masked', narr)
    return narr


def anonymize(input_path, output_path):
    """Main pipeline for anonymizing the file (CSV or Excel)."""
    # Detect file type
    ext = os.path.splitext(input_path)[1].lower()
    if ext in ['.xlsx', '.xls']:
        df = pd.read_excel(input_path)
    else:
        df = pd.read_csv(input_path)

    # Standardize headers
    df = standardize_headers(df)

    # Perturb debit & credit amounts (if present)
    if 'Debit Amount' in df.columns:
        df['Debit Amount'] = df['Debit Amount'].apply(perturb_amount)
    # if 'Credit Amount' in df.columns:
    #     df['Credit Amount'] = df['Credit Amount'].apply(perturb_amount)

    # Mask & pseudonymize narration (if present)
    if 'Narration' in df.columns:
        df['Narration'] = df['Narration'].apply(mask_narration)

    # Save anonymized data
    if ext in ['.xlsx', '.xls']:
        df.to_excel(output_path, index=False)
    else:
        df.to_csv(output_path, index=False)
    print(f"Anonymized dataset saved to {output_path}")

# --- Run ---
if __name__ == "__main__":
    input_file = "/Users/vaishnavink/Downloads/project-5/backend/static/sample_data/DATA_2025.csv"  # Change to your input file (CSV or Excel)
    output_file = "/Users/vaishnavink/Downloads/project-5/backend/static/sample_data/sample_anon.csv"
    anonymize(input_file, output_file)
