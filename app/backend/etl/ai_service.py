import json
import logging
from openai import OpenAI
from models import db, ProductTag
from flask import current_app
from db_handler import DatabaseService
from scipy.spatial.distance import cosine

# Initialize logger
db_service = DatabaseService()
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.client = OpenAI(api_key="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")
        self.embedding_model = "text-embedding-ada-002"

    def generate_embeddings(self, products):
        """
        Generate embeddings for a list of products using OpenAI's API.
        Processes up to 10 products per request to optimize cost and efficiency.
        """
        embeddings = {}
        batch_size = 10  # OpenAI allows batch processing
        logger.info(f"Generating embeddings")

        try:
            for i in range(0, len(products), batch_size):
                batch = products[i:i + batch_size]
                response = self.client.embeddings.create(input=batch, model=self.embedding_model)
                
                for product, data in zip(batch, response.data):  # Fix: `response['data']` -> `response.data`
                    embeddings[product] = data.embedding  # Fix: `data['embedding']` -> `data.embedding`

        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return {}

        return embeddings

    def store_embeddings(self, session_id, product_embeddings):
        """
        Store new product embeddings in the database.
        """
        try:
            for product, embedding in product_embeddings.items():
                update_query = """
                    UPDATE product_tags 
                    SET embedding = :embedding 
                    WHERE session_id = :session_id AND product = :product
                """
                db_service.execute_query(update_query, {
                    "embedding": json.dumps(embedding),
                    "session_id": session_id,
                    "product": product
                })
            
            logger.info(f"Stored {len(product_embeddings)} product embeddings successfully.")

        except Exception as e:
            logger.error(f"Error storing embeddings: {e}")

    def process_and_store_embeddings(self, session_id, products):
        """
        Generate embeddings for all products in a session and store them.
        """
        logger.info(f"Generating embeddings for session {session_id}, {len(products)} products.")
        
        product_embeddings = self.generate_embeddings(products)
        
        if product_embeddings:
            self.store_embeddings(session_id, product_embeddings)
        else:
            logger.warning("No embeddings generated.")
    
    def get_product_embeddings(self, products):
        """
        Generate and return embeddings for given products.
        """
        return self.generate_embeddings(products)
    
    def find_closest_match(self, product_name, sessionId):
        """Finds the closest product match based on embeddings, returns (product, tag) if found."""
        new_embedding = self.get_product_embeddings([product_name])[product_name]
        
        # Fetch stored embeddings from DB
        stored_data = db_service.get_all_embeddings(sessionId)  # Returns (product_name, tag, embedding)
        
        best_match = None
        best_score = float('inf')  # Lower cosine distance = better match
        for stored_product, stored_tag, stored_embedding_json in stored_data:
            stored_embedding = json.loads(stored_embedding_json)
            similarity = cosine(new_embedding, stored_embedding)
            if similarity < best_score:
                best_score = similarity
                best_match = (stored_product, stored_tag)
        
        return best_match if best_score < 0.08 else None  # Threshold = 0.2
    
    def get_tag_suggestions(self, products_with_amounts, sessionId):
        results = []
        unmatched_products = []

        # Directly process batched input
        for item in products_with_amounts:
            product = item["product"]
            amount = item["avg_spend"]
            unmatched_products.append((product, amount))

        if unmatched_products:
            formatted_inputs = [f"{p}: {a}" for p, a in unmatched_products]

            prompt = f"""
                Task: Categorize each product into one of these tags:
                Rent, Bills, Groceries, Salon, Shopping, Contact, Investments, Travel, Dineout, Food, Fun, TBD.

                Rules:
                - If the amount is between 80 and 350, classify as 'Travel'
                - If the product resembles a person's name, classify as 'Contact'
                - Otherwise, categorize based on common sense

                Products:
                {', '.join(formatted_inputs)}

                Respond with ONLY product-tag pairs, one per line, exactly like this format:
                ProductName-Tag
                """

            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5
            )

            try:
                # Clean and validate each suggestion
                suggestions = response.choices[0].message.content.strip().split("\n")
                for suggestion in suggestions:
                    suggestion = suggestion.strip('- ').strip()  # Remove any leading/trailing dashes and spaces
                    if '-' in suggestion:
                        product, tag = suggestion.split('-', 1)
                        clean_suggestion = f"{product.strip()}-{tag.strip()}"
                        results.append(clean_suggestion)
                
                current_app.logger.info(f"AI classified batch: {results}")

            except Exception as e:
                current_app.logger.error(f"Error in AI response: {e}")
        return results

    
    def update_product_tags_in_db(self, batch_suggestions, sessionId):
        """Updates product tags and stores embeddings in the database."""
        for suggestion in batch_suggestions:
            parts = suggestion.split("-")
            if len(parts) != 2:
                logger.warning(f"Invalid format in suggestion: {suggestion}")
                continue

            product_name, tag = parts
            embedding_json = json.dumps(self.get_product_embeddings([product_name])[product_name])

            query = "UPDATE product_tags SET tag = :tag, embedding = :embedding WHERE product = :product and session_id = :session_id"
            db_service.execute_query(query, {"tag": tag, "embedding": embedding_json, "product": product_name, "session_id": sessionId})

# Initialize AI Service instance
ai_service = AIService()
