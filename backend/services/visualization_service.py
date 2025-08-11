import pandas as pd
from datetime import datetime
from .ai_service import ai_service
from flask import current_app
import re

class VisualizationService:

    def getProductAndMode(self, df):
        product_values = []
        mode_values = []


        for narration in df['Narration']:
            if not isinstance(narration, str):
                product_values.append("Unknown")
                mode_values.append("Unknown")
                continue
    
            if 'UPI' in narration:
                pdt = narration.split('-')[1].strip() if '-' in narration else narration.strip()
                mode = "UPI"
            elif 'POS' in narration:
                pdt = " ".join(narration.split(' ')[2:]).strip()
                mode = "POS"
            elif 'ME DC' in narration:
                pdt = " ".join(narration.split(' ')[4:]).strip()
                mode = "Debit Card"
            elif 'ATW' in narration:
                pdt = " ".join(narration.split('-')[1:]).strip()
                mode = "ATM"
            elif 'SI' in narration:
                pdt = "".join(narration.split(' ')[2:]).strip()
                mode = "Automated Payment"
            elif 'CC' in narration:
                pdt = "".join(narration.split(' ')[2:]).strip()
                mode = "Credit Card"
            elif 'INSTALLMENT' in narration:
                pdt = narration.split('-')[1]
                mode = "AUTOPAY"
            else:
                pdt = narration.split('-')[0].strip()
                mode = "Other"

            pdt = re.split(r'@', pdt)[0].strip()
            product_values.append(pdt)
            mode_values.append(mode)

        df['Product'] = product_values
        df['Mode'] = mode_values
        return df

    def clean_amount_columns(self, df):
        for col in ['Debit Amount', 'Credit Amount']:
            df[col] = df[col].replace('', None)  # Replace empty strings with None
            df[col] = df[col].replace('-', None)  # Replace dash with None if present
            df[col] = df[col].astype(str).str.replace(',', '')  # Remove commas in amounts like 1,000.00
            df[col] = pd.to_numeric(df[col], errors='coerce')  # Convert to float, set invalids to NaN

        return df

    def consolidate_transaction_files(self, files_data, product_tag_mapping, session_id=None):
        """Consolidate all transaction files into a single table with derived columns"""
        if not session_id:
            raise ValueError("session_id is required")
        try:
            all_transactions = []
            files_processed = 0
            total_transactions = 0
        
            for file_data in files_data:
                transactions = file_data.get('transactions', [])
                if not transactions:
                    continue

                df = pd.DataFrame(transactions)
                df = df[['Date', 'Narration', 'Debit Amount', 'Credit Amount']]
                df['Filename'] = file_data.get('filename', 'Unknown')
                df['Source'] = file_data.get('source', 'Unknown')
                df['SessionID'] = session_id
            
                # Derive product and mode
                df = self.getProductAndMode(df)
                df = self.clean_amount_columns(df)
                # Join with product_tag_mapping
                
                df = df.merge(product_tag_mapping, on='Product', how='left')

                all_transactions.append(df)
                total_transactions += len(df)
                files_processed += 1


            final_df = pd.concat(all_transactions, ignore_index=True) if all_transactions else pd.DataFrame()
            return {
                'data': final_df,
                'total_transactions': total_transactions,
                'files_processed': files_processed
            }

        except Exception as e:
            raise RuntimeError(f"Error consolidating transaction files: {e}")

    def categorize_transactions(self,empty_products=None):
        try:
            return ai_service.get_tag_suggestions(empty_products)
        except Exception as e:
            current_app.logger.error(f"Exception - {e}")

# Create global instance
visualization_service = VisualizationService()