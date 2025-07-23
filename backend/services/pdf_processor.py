import pdfplumber
import re
import openai
import pandas as pd
from io import StringIO
from typing import List
import os
import PyPDF2
from config import Config

class PDFProcessor:
    def __init__(self):
        # Set your API key from environment variable for security
        openai.api_key = Config.OPENAI_API_KEY

    def load(self, file_path, password):
        extracted_blocks = self.extract_transaction_blocks(file_path, password)
        df = self.parse_transactions_batch(extracted_blocks)
        return df
    
    def is_password_protected(self,file_path):
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return pdf_reader.is_encrypted
        except Exception as e:
            print(f"Error: {e}")
            return False 
    
    def is_junk_line(self, line: str) -> bool:
        """Filter out junk lines from PDF text"""
        line = line.strip().lower()
        if not line:
            return True
        if any(kw in line for kw in ["credit limit", "cash limit", "payment due", "account summary", "https://", "dues"]):
            return True
        return False

    def is_possibly_transaction_block(self, block: List[str]) -> bool:
        """Check if a block of text might contain transaction data"""
        combined = ' '.join(block)
        has_date = bool(re.search(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2} \w{3}', combined, re.IGNORECASE))
        has_amount = bool(re.search(r'[\d,]+\.\d{2}', combined))
        return has_date and has_amount

    def extract_transaction_blocks(self, pdf_path: str, password: str = None) -> List[str]:
        """Extract potential transaction blocks from PDF"""
        blocks = []
        current_block = []

        try:
            with pdfplumber.open(pdf_path, password=password) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if not text:
                        continue

                    for line in text.split('\n'):
                        stripped = line.strip()
                        if self.is_junk_line(stripped):
                            continue
                        if not stripped or re.fullmatch(r'[A-Z ]{4,}', stripped):
                            continue

                        current_block.append(stripped)

                        if len(current_block) >= 3 or self.is_possibly_transaction_block(current_block):
                            if self.is_possibly_transaction_block(current_block):
                                blocks.append(' '.join(current_block))
                            current_block = []

                if current_block and self.is_possibly_transaction_block(current_block):
                    blocks.append(' '.join(current_block))

            print(f"Extracted {len(blocks)} potential transaction blocks")
            return blocks

        except Exception as e:
            print(f"Error extracting transaction blocks: {e}")
            raise

    def detect_statement_source(self, pdf_path: str, password: str = None) -> str:
        """Detect if the PDF is a credit or debit statement"""
        try:
            with pdfplumber.open(pdf_path, password=password) as pdf:
                all_text = ""
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text.lower()

            credit_keywords = ["credit", "payment due", "total outstanding", "billed amount"]
            debit_keywords = ["available balance", "savings account", "current account", "ifsc"]

            if any(kw in all_text for kw in debit_keywords):
                return "Debit"
            elif any(kw in all_text for kw in credit_keywords):
                return "Credit"
            else:
                return "Unknown"

        except Exception as e:
            print(f"Error detecting source type: {e}")
            return "unknown"


    def parse_transactions_batch(self, lines: List[str], batch_size: int = 50) -> pd.DataFrame:
        """Parse transaction lines using GPT-4"""
        all_dataframes = []

        for i in range(0, len(lines), batch_size):
            batch = lines[i:i + batch_size]

            prompt = f"""
            You are an assistant extracting valid bank transactions from raw text.
            From the lines below, extract only real transactions—those with:

            Dates (dd/mm/yyyy or dd/mm/yy)
            Modes (e.g., UPI, POS, AUTOPAY)
            Merchants (e.g., ZOMATO, GOOGLEPLAY, PAY*)
            Amounts (debit or credit)

            Optional reference or reward point info

            ⚠️ Output rules:

            Format as CSV with exactly 4 fields: Date, Description, Debit, Credit

            Use yyyy-mm-dd for Date

            Wrap Description in quotes if it contains commas

            Ignore non-transactional lines (headers, summaries, footnotes, etc.)

            If "Cr" is present, treat as Credit; else, Debit

            ⚠️ Do not add an extra comma at the end of any line.
            Each line must have exactly 3 commas (4 fields total).

            Respond only in CSV strictly with this header containing 4 columns:
            Date,Narration,Debit Amount,Credit Amount

            Transaction lines:
            """ + "\n".join(f"{j+1}. {line}" for j, line in enumerate(batch))

            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0
                )
                result_text = response['choices'][0]['message']['content'].strip()
                cleaned_text = []
                for line in result_text.splitlines():
                    if line.count(',') > 3 and line.endswith(','):
                        cleaned_text.append(line.rstrip(','))
                    else:
                        cleaned_text.append(line)

                result_text = "\n".join(cleaned_text)
                
                df = pd.read_csv(StringIO(result_text))
                all_dataframes.append(df)

            except Exception as e:
                print(f"Error parsing batch starting at line {i}: {e}")
                continue

        if all_dataframes:
            final_df = pd.concat(all_dataframes, ignore_index=True)
            return final_df
        else:
            return pd.DataFrame(columns=["Date", "Description", "Debit", "Credit"])
    

