import pandas as pd
from flask import current_app
from db_handler import DatabaseService
from .ai_service import ai_service  # Import AIService instance

db_service = DatabaseService()


def transform(df, sessionId):
    """Main transformation pipeline: Extracts product/mode, updates DB, and assigns tags."""
    current_app.logger.info("Inside transform module")
    
    df = getProductAndMode(df)
    current_app.logger.info("Finished product processing, starting with tags")
    
    # Save distinct products in DB
    current_app.logger.info("Adding distinct products to tag database")
    db_service.save_distinct_products(df['Product'].unique(), sessionId)
    return df 


def ai_trigger(sessionId, enable_ai):
    """Triggers AI categorization only if enabled by the user."""
    
    if not enable_ai:
        current_app.logger.info("AI categorization is disabled by the user.")
        return
    else:
        # Query for products with missing tags
        missing_products_query = db_service.get_missing_products(sessionId)
        current_app.logger.info("Using AI for missing tags")
        handleMissingTags(missing_products_query, sessionId)




def getProductAndMode(df):
    """Extracts product names and payment modes from narration."""
    current_app.logger.info("Extracting product and modes")

    product_values = []
    mode_values = []

    for narration in df['Narration']:
        if 'UPI' in narration:
            pdt = narration.split('-')[1].strip()
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
        else:
            pdt = narration.split('-')[0].strip()
            mode = "Other"
    
        product_values.append(pdt)
        mode_values.append(mode)

    df['Product'] = product_values
    df['Mode'] = mode_values

    return df


def handleMissingTags(missing_products_query, sessionId):
    try:
        """Handles missing tags by using embeddings or GPT-4 if necessary."""
        current_app.logger.info(f"Enabling AI Categorisation")
        # Format the missing products correctly (product name and average spend)
        missing_products = [
            {"product": product[0], "avg_spend": float(product[1])} for product in missing_products_query
        ]

        if not missing_products:
            current_app.logger.info("No products with missing tags found.")
            return

        batch_size = int(current_app.config.get('BATCH_SIZE', 10))  # Default batch size to 10
        current_app.logger.info(f"Found {len(missing_products)} products with missing tags.")

        for i in range(0, len(missing_products), batch_size):
            batch = missing_products[i:i + batch_size]

            # Ensure batch is not empty before calling AI
            if batch:
                batch_suggestions = ai_service.get_tag_suggestions(batch, sessionId)  # Calls AI service
                ai_service.update_product_tags_in_db(batch_suggestions, sessionId)  # Updates DB
                current_app.logger.info(f"Updated batch {int(i / batch_size + 1)}")
    except Exception as e:
        current_app.logger.error(f"Error populating expense data: {e}")