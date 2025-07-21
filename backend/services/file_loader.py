from services.csv_processor import CSVProcessor
from services.excel_processor import ExcelProcessor
from services.pdf_processor import PDFProcessor
import pandas as pd
import os 
import re

class FileLoader:
    def __init__(self):
        self.processors = {
            '.pdf': PDFProcessor(),
            '.xls': ExcelProcessor(),
            '.xlsx': ExcelProcessor(),
            '.csv': CSVProcessor(),
        }

        self.HEADER_SYNONYMS = {
            "Date": ["txn date", "date", "transaction date"],
            "Narration": ["description", "narration", "details"],
            "Chq/Ref No": ["ref no", "cheque no", "ref no./cheque no.", "chq/ref no"],
            "Value Date": ["value date"],
            "Debit Amount": ["debit", "withdrawal", "withdrawal amt.", "debit amount"],
            "Credit Amount": ["credit", "deposit", "deposit amt.", "credit amount"],
            "Closing Balance": ["balance", "closing balance"],
        }
        self.STANDARD_COLUMNS = list(self.HEADER_SYNONYMS.keys())


    def standardize_columns(self, df):
        """Map columns to standard names"""
        col_map = {}
        for col in df.columns:
            lower_col = col.lower().strip()
            matched = False
            for standard, variants in self.HEADER_SYNONYMS.items():
                if any(variant in lower_col for variant in variants):
                    col_map[col] = standard
                    matched = True
                    break
            if not matched:
                col_map[col] = col  # Preserve original if no match

        df = df.rename(columns=col_map)
    
            # Ensure all standard columns exist
        for col in self.STANDARD_COLUMNS:
            if col not in df.columns:
                df[col] = None

        return df[self.STANDARD_COLUMNS]


    def clean_special_characters(self, df):
        """Clean special characters from object columns"""
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].apply(lambda x: re.sub(r'[^A-Za-z0-9\s]+', '', str(x)) if isinstance(x, str) else x)
        return df
    

    

    def load(self, file_path: str, password: str = None):
        if not os.path.isfile(file_path):
            raise FileNotFoundError(f"No such file: {file_path}")
        
        ext = os.path.splitext(file_path)[1].lower()
        if ext not in self.processors:
            raise ValueError(f"Unsupported file type: {ext}")
        

        processor = self.processors[ext]

        if processor.is_password_protected(file_path) and not password:
            return {
                'status': 'error',
                'message': 'Password required for this file',
                'password_required': True
            }
        df = processor.load(file_path, password)
        df = self.standardize_columns(df)
        df = self.clean_special_characters(df)
        df['Date'] = df['Date'].apply(safe_parse_date)
        return df

def safe_parse_date(x):
    try:
        return pd.to_datetime(x).strftime('%Y-%m-%d')
    except:
        return None