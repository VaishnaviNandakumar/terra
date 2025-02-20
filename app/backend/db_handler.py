from models import Transactions, Session, ProductTag, Expense
from models import db
import uuid
from datetime import datetime, timedelta
import logging

from flask import session
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
        
    def get_all_embeddings(self, session_id):
        """Fetch all stored embeddings from the database."""
        query = "SELECT product, tag, embedding FROM product_tags WHERE session_id = :session_id AND embedding IS NOT NULL and tag IS NOT NULL"
        results = self.execute_query(query, {"session_id":session_id})

        return [(row[0], row[1], row[2]) for row in results] 


    def session_exists(self, session_id: str) -> bool:
        """Check if a session ID already exists in the database."""
        try:
            return db.session.query(Session.id).filter_by(id=session_id).first() is not None
        except Exception as e:
            self.logger.error(f"Error checking session existence: {e}")
            return False

    def add_session(self, session_id, username, expiration_hours: int = 1) -> None:
        """Add a new session with an expiration time."""
        expiration = datetime.utcnow() + timedelta(hours=expiration_hours)
        new_session = Session(
            session_id=session_id,
            username=username,
            expires_at=expiration,
            created_at=datetime.utcnow(),
        )
        self._commit(new_session)
        self.logger.info(f"Created new session ID: {session_id}")

    def write_transactions(self, transactions_data: list) -> None:
        """Write a list of transactions to the database."""
        self.logger.info(f"Writing {len(transactions_data)} transactions to the database.")
        try:
            transactions = [Transactions(**data) for data in transactions_data]
            db.session.bulk_save_objects(transactions)
            self.commit_changes()
            self.logger.info("Transactions successfully written.")
        except Exception as e:
            self.logger.error(f"Error writing transactions: {e}")
            db.session.rollback()

    def save_distinct_products(self, products: list, session_id) -> None:
        """Save unique products to the product_tags table with NULL tags."""
        self.logger.info(f"Saving distinct products for session ID: {session_id}")
        try:
            existing_products = {
                p[0]
                for p in db.session.query(ProductTag.product).filter_by(session_id=session_id).all()
            }
            new_products = [
                ProductTag(session_id=session_id, product=product, tag=None)
                for product in products
                if product not in existing_products
            ]
            if new_products:
                db.session.bulk_save_objects(new_products)
                self.commit_changes()
                self.logger.info(f"Inserted {len(new_products)} new products.")
            else:
                self.logger.info("No new products to insert.")
        except Exception as e:
            self.logger.error(f"Error saving distinct products: {e}")
            db.session.rollback()

    def save_uploaded_product_tags(self, df, session_id) -> None:
        """Save product tags uploaded via CSV, updating existing tags or inserting new ones."""
        self.logger.info("Saving uploaded product tags.")
        try:
            df = df.dropna(subset=['Product', 'Tag']).drop_duplicates(subset=['Product'])

            # Fetch existing products for the session
            existing_tags = {
                tag.product: tag for tag in ProductTag.query.filter_by(session_id=session_id).all()
            }

            products = df['Product'].tolist()
            new_entries = []
            update_count = 0

            for _, row in df.iterrows():
                product = row['Product']
                new_tag = row['Tag']

                if product in existing_tags:
                    # Update existing tag
                    existing_tags[product].tag = new_tag
                    update_count += 1
                else:
                    # Insert new entry
                    new_entries.append(ProductTag(session_id=session_id, product=product, tag=new_tag))

            # Commit changes
            if update_count > 0 or new_entries:
                if new_entries:
                    db.session.bulk_save_objects(new_entries)
                db.session.commit()
                self.logger.info(f"Updated {update_count} product tags and inserted {len(new_entries)} new tags.")
            else:
                self.logger.info("No new product tags to insert or update.")
        except Exception as e:
            self.logger.error(f"Error saving product tags: {e}")
            db.session.rollback()


    def get_missing_products(self, session_id) -> list:
        """Fetch products with NULL tags along with their average debit amount."""
        query = f"""
            SELECT product, 
                COALESCE(AVG(debit_amount), 0) AS avg_spend 
            FROM expense_data 
            WHERE session_id = '{session_id}' AND tag IS NULL
            GROUP BY product;
        """
        result = self.execute_query(query)
        data = result.fetchall()  # Fetch actual data
        return data


    def update_product_embedding(self, product_id, embedding_json):
        query = "UPDATE product_tags SET embedding = %s WHERE id = %s"
        self.execute_query(query, (embedding_json, product_id))

    def update_product_tags(self, tag_list: list) -> None:
        """Update product tags in the database."""
        self.logger.info(f"Updating product tags for session ID: {session_id}")
        try:
            for item in tag_list:
                try:
                    tag_id, _, new_tag = item.split('-')
                    db.session.query(ProductTag).filter_by(id=int(tag_id), session_id=session_id).update(
                        {"tag": new_tag}
                    )
                except ValueError as e:
                    self.logger.warning(f"Skipping invalid tag format: {item}. Error: {e}")
            self.commit_changes()
            self.logger.info("Product tags updated successfully.")
        except Exception as e:
            self.logger.error(f"Error updating product tags: {e}")
            db.session.rollback()

            

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
