from models import Transactions, Session, ProductTag
from models import db
import uuid
from datetime import datetime, timedelta
import logging
from flask import session


class DatabaseService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

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

    def save_distinct_products(self, products: list) -> None:
        """Save unique products to the product_tags table with NULL tags."""
        session_id = session.get('current_session_id')
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

    def save_uploaded_product_tags(self, df) -> None:
        """Save product tags uploaded via CSV."""
        session_id = session.get('current_session_id')
        self.logger.info("Saving uploaded product tags.")
        try:
            df = df.dropna(subset=['Product', 'Tag']).drop_duplicates(subset=['Product'])
            product_tags = [
                ProductTag(session_id=session_id, product=row['Product'], tag=row['Tag'])
                for _, row in df.iterrows()
            ]
            if product_tags:
                db.session.bulk_save_objects(product_tags)
                self.commit_changes()
                self.logger.info(f"Inserted {len(product_tags)} product tags.")
            else:
                self.logger.info("No new product tags to insert.")
        except Exception as e:
            self.logger.error(f"Error saving product tags: {e}")
            db.session.rollback()

    def get_missing_products(self) -> list:
        """Fetch products with NULL tags."""
        session_id = session.get('current_session_id')
        self.logger.info(f"Fetching products with NULL tags for session ID: {session_id}")
        try:
            return db.session.query(ProductTag.id, ProductTag.product).filter(
                ProductTag.tag.is_(None), ProductTag.session_id == session_id
            ).all()
        except Exception as e:
            self.logger.error(f"Error fetching missing products: {e}")
            return []

    def update_product_tags(self, tag_list: list) -> None:
        """Update product tags in the database."""
        session_id = session.get('current_session_id')
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
