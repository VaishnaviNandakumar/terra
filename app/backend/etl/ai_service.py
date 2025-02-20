import logging
from openai import OpenAI
from flask import current_app
from db_handler import DatabaseService
import os

# Initialize logger
db_service = DatabaseService()
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Initialize without the API key
        self.client = None

    def _ensure_client(self):
        # Lazy initialization of the client when needed
        if self.client is None:
            self.client = OpenAI(api_key=current_app.config.get('OPENAI_API_KEY'))
        return self.client

    def get_tag_suggestions(self, products_with_amounts, sessionId):
        # Initialize client if needed
        self._ensure_client()
        
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
        """Updates product tags in the database."""
        for suggestion in batch_suggestions:
            parts = suggestion.split("-")
            if len(parts) != 2:
                logger.warning(f"Invalid format in suggestion: {suggestion}")
                continue

            product_name, tag = parts
            query = "UPDATE product_tags SET tag = :tag WHERE product = :product and session_id = :session_id"
            db_service.execute_query(query, {"tag": tag, "product": product_name, "session_id": sessionId})

# Initialize AI Service instance
ai_service = AIService()
