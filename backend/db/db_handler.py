from db.models import Transactions, Session, ProductTag, Expense
from db.models import db
import pandas as pd
from datetime import datetime, timedelta
import logging
import numpy as np

from flask import current_app

from sqlalchemy import text
from uuid import uuid4
from datetime import datetime, timedelta

class DatabaseService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def save_session_if_not_exists(self, session_id, expires_in_minutes=60):
        """Save session to DB if it doesn't already exist."""
        try:
            existing_session = Session.query.filter_by(session_id=session_id).first()
            if not existing_session:
                new_session = Session(
                    session_id=session_id,
                    created_at=datetime.utcnow(),
                    expires_at=datetime.utcnow() + timedelta(minutes=expires_in_minutes)
                )
                db.session.add(new_session)
                self.commit_changes()
                current_app.logger.info(f"Session saved: {session_id}")
            else:
                current_app.logger.info(f"Session already exists: {session_id}")
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error saving session: {e}")
            raise
    
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
                current_app.logger.info(f"Inserted {len(new_entries)} new tags.")
            else:
                self.logger.info("No new product tags to insert or update.")
            return {
                'total_saved': len(new_entries)
            }
        except Exception as e:
            current_app.logger.info(f"Error saving product tags: {e}")
            db.session.rollback()

    def save_transaction_product_tags(self, transactions_data: pd.DataFrame) -> None:
        """Extract product and tag info from transactions and save them to product_tags."""
        self.logger.info(f"Saving product-tag mappings for {len(transactions_data)} transactions.")
        try:
            # Ensure columns exist
            if not {'SessionID', 'Product', 'Tag'}.issubset(transactions_data.columns):
                raise ValueError("Missing required columns: SessionID, Product, Tag")

            # Replace NaN with None
            transactions_data = transactions_data.where(pd.notnull(transactions_data), None)

            # Extract only needed columns
            product_tags_data = transactions_data[['SessionID', 'Product', 'Tag']].copy()
            product_tags_data.rename(
                columns={'SessionID': 'session_id', 'Product': 'product', 'Tag': 'tag'},
                inplace=True
            )
            product_tags_data.drop_duplicates(subset=['session_id', 'product'], inplace=True)


            # Convert to list of dicts
            product_tags_list = product_tags_data.to_dict(orient='records')

            # Create ProductTag objects
            product_tags = [ProductTag(**data) for data in product_tags_list]

            # Bulk insert
            db.session.bulk_save_objects(product_tags)
            self.commit_changes()
            current_app.logger.info("Product tags successfully written.")

        except Exception as e:
            current_app.logger.info(f"Error writing product tags: {e}")
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
            current_app.logger.info("Transactions successfully written.")

        except Exception as e:
            current_app.logger.info(f"Error writing transactions: {e}")
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
            current_app.logger.info(f"Exception: {e}")
        
        return df

    def get_empty_products(self, session_id):
        try:
            query = """
                SELECT 
                    product, 
                    AVG(debit_amount) 
                FROM transactions
                WHERE session_id = :session_id and tag is NULL
                GROUP BY product
            """
            result = self.execute_query(query,  {"session_id": session_id})
            rows = result.fetchall()
            data = [{"product": row[0], "avg_spend": row[1]} for row in rows]
            return data
        except Exception as e:
            current_app.logger.info(f"Exception: {e}") 

    
    def update_product_tags_in_db(self, batch_suggestions, sessionId):
        """Updates product tags in the database."""
        for suggestion in batch_suggestions:
            parts = suggestion.split("-")
            if len(parts) != 2:
                current_app.logger.info(f"Invalid format in suggestion: {suggestion}")
                continue

            product_name, tag = parts
            query = "UPDATE product_tags SET tag = :tag WHERE product = :product and session_id = :session_id"
            self.execute_query(query, {"tag": tag, "product": product_name, "session_id": sessionId}) 
        current_app.logger.info("Successfully executed product tag update")     

