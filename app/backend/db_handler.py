from models import Transactions, Session, ProductTag
from models import db  
import uuid
from datetime import datetime, timedelta
import logging
from flask import session

class DatabaseService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def add_session(self, expiration_hours=1):
        """Adds a new session with an expiration time."""
        if(session.get('current_session_id')== None):
            session_id = str(uuid.uuid4())
            expiration = datetime.now() + timedelta(hours=expiration_hours)
            new_session = Session(session_id=session_id, expires_at=expiration)
            self._commit(new_session)
            session['current_session_id'] = session_id 
            self.logger.info(f"Setting current session ID to { session.get('current_session_id')}")
        else:
            self.logger.info(f"Using existing session { session.get('current_session_id')}")

    def write_transactions(self, transactions_data):
        """Writes a list of transactions to the database."""
        self.logger.info(f"Overwriting the transactions table with {len(transactions_data)} new records")
        try:
            # db.session.query(Transactions).delete()
            transactions = [Transactions(**data) for data in transactions_data]
            db.session.bulk_save_objects(transactions)
            db.session.commit()
            self.logger.info(f"Successfully wrote {len(transactions)} transactions to the database")
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error writing transactions to the database: {e}")

    def save_distinct_products(self, products):
        """Saves unique products to the product_tags table with NULL tags for the current session ID."""
        self.logger.info(f"Saving distinct products to the database for session id {session.get('current_session_id')}" )
        try:
            # Fetch existing products associated with the current session ID
            existing_products = {p[0] for p in db.session.query(ProductTag.product).filter(ProductTag.session_id ==  session.get('current_session_id')).all()}
            
            # Create new product entries with the session ID
            new_products = [ProductTag(session_id= session.get('current_session_id'), product=product, tag=None) for product in products if product not in existing_products]
            
            if new_products:
                db.session.bulk_save_objects(new_products)
                db.session.commit()
                self.logger.info(f"Inserted {len(new_products)} new products into product_tags")
            else:
                self.logger.info("No new products to insert")
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving distinct products to the database: {e}")

    
    def save_uploaded_pdt_tags(self, df):
        session_id = session.get('current_session_id')
        self.logger.info(f"Saving uploaded product tags")
        try:

            df = df.dropna(subset=['Product', 'Tag'])
            df = df.drop_duplicates(subset=['Product'])

            # Extract products and tags from the DataFrame
            products = df['Product'].tolist()
            tags = df['Tag'].tolist()
            
            # Create new ProductTag entries only for products not already in the database
            product_tags = [
                ProductTag(session_id=session_id, product=product, tag=tag)
                for product, tag in zip(products, tags)
            ]

            if product_tags:
                db.session.bulk_save_objects(product_tags)
                db.session.commit()
                self.logger.info(f"Inserted {len(product_tags)} new products into product_tags")
            else:
                self.logger.info("No new products to insert")
            
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error saving distinct products to the database.", exc_info=True)


    def get_missing_products(self):
        """Fetches products with NULL tags from product_tags."""
        self.logger.info("Fetching products with NULL tags")
        return db.session.query(ProductTag.id, ProductTag.product).filter(ProductTag.tag.is_(None), ProductTag.session_id == session.get('current_session_id')).all()

    
    def update_product_tags_in_db(self, tag_list):
        """
        Update the product_tags table using a list formatted as:
        ['<primary_key>-<product_name>-<tag>', ...]
        
        The method extracts the primary key and the tag from each entry
        and updates the corresponding record in the database.
        """
        try:
            for item in tag_list:
                try:
                    # Split the item into primary key, product name, and tag
                    data  = item.split('-')  # Split into 3 parts            
                    # Update the product_tags table using the primary key
                    db.session.query(ProductTag).filter(
                        ProductTag.id == int(data[0]), 
                        ProductTag.session_id ==  session.get('current_session_id')
                    ).update({"tag": data[-1]})
                except ValueError as e:
                    self.logger.warning(f"Skipping invalid item: {item}. Error: {e}")
                    continue
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error updating products tags to the database: {e}")

    
    def commit_changes(self):
        """Commits any pending transactions in the session."""
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            self.logger.error(f"Error committing changes to the database: {e}")
            raise

    def _commit(self, entity):
        """Helper method to add and commit a single entity."""
        db.session.add(entity)
        self.commit_changes()
