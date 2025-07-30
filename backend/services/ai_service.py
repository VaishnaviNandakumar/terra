import logging
import openai 
from flask import current_app
from config import Config


# Initialize logger
logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        openai.api_key = Config.OPENAI_API_KEY


    def get_tag_suggestions(self, products_with_amounts):
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
            response = openai.ChatCompletion.create(
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


# Initialize AI Service instance
ai_service = AIService()
