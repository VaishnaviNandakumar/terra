from db.models import Transactions, Session, ProductTag, Expense
from db.models import db
import pandas as pd
from datetime import datetime, timedelta
import logging
import numpy as np

from flask import current_app

from sqlalchemy import text

class DatabaseService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def execute_query(self, query, params=None):
        """Execute a raw SQL query using SQLAlchemy."""
        try:
            result = db.session.execute(text(query), params or {})
            db.session.commit()  # Commit the transaction if required
            return result
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error executing query: {e}")
            raise e

    def save_product_tags(self, mappings, session_id) -> None:
        """Save product tags uploaded via CSV, updating existing tags or inserting new ones."""
        self.logger.info("Saving uploaded product tags.")
        new_entries = []
        try:
            for mapping in mappings:
                product = mapping['product']
                tag = mapping['tag']
                new_entries.append(ProductTag(session_id=session_id, product=product, tag=tag))
            # Commit changes
            if new_entries:
                db.session.bulk_save_objects(new_entries)
                db.session.commit()
                print(f"Inserted {len(new_entries)} new tags.")
            else:
                self.logger.info("No new product tags to insert or update.")
            return {
                'total_saved': len(new_entries)
            }
        except Exception as e:
            print(f"Error saving product tags: {e}")
            db.session.rollback()

    def save_transactions(self, transactions_data: pd.DataFrame) -> None:
        """Write a DataFrame of transactions to the database."""
        self.logger.info(f"Writing {len(transactions_data)} transactions to the database.")
        try:
            # Convert DataFrame to list of dicts
            column_mapping = {
            'SessionID': 'session_id',
            'Date': 'transaction_date',
            'Narration': 'narration',
            'Debit Amount': 'debit_amount',
            'Credit Amount': 'credit_amount',
            'Product': 'product',
            'Mode': 'mode',
            'Tag': 'tag',
            'Source': 'source',
            'Filename': 'filename',
            }

            # Rename columns
            transactions_data.rename(
                columns={col: column_mapping.get(col, col) for col in transactions_data.columns},
                inplace=True
            )

            # Replace all NaNs with None
            transactions_data = transactions_data.where(pd.notnull(transactions_data), None)

            transactions_data = transactions_data.replace({np.nan: None})

            # Convert to list of dicts
            transactions_list = transactions_data.to_dict(orient='records')
            transactions = [Transactions(**data) for data in transactions_list]

            db.session.bulk_save_objects(transactions)
            self.commit_changes()
            print("Transactions successfully written.")

        except Exception as e:
            print(f"Error writing transactions: {e}")
            db.session.rollback()


    def get_product_tag_mapping(self, session_id) -> None:
        try:
            query = f"""
                SELECT 
                product, tag
                FROM product_tags
                WHERE session_id = '{session_id}';
            """
            result = self.execute_query(query)
            data = result.fetchall()  # Fetch actual data
            columns = ['Product', 'Tag']
            df = pd.DataFrame(data, columns=columns)
        except Exception as e:
            print(f"Exception: {e}")
        
        return df

            

    def commit_changes(self) -> None:
        """Commit pending changes to the database."""
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error committing changes: {e}")
            raise

    def _commit(self, entity) -> None:
        """Helper method to add and commit a single entity."""
        try:
            db.session.add(entity)
            self.commit_changes()
        except Exception as e:
            self.logger.error(f"Error committing entity: {e}")
            db.session.rollback()
