import pandas as pd
from openai import OpenAI
from flask import current_app
from db_handler import DatabaseService
from flask import session

db_service = DatabaseService()


def transform(df):
    current_app.logger.info(f"Inside transform module")
    df = getProductAndMode(df)
    current_app.logger.info("Finished product processing, starting with tags")
    
    # Save distinct products using DatabaseService
    current_app.logger.info("Adding distinct products to tag database")
    db_service.save_distinct_products(df['Product'].unique())

    # Query the product_tags table for products with NULL tags
    missing_products_query = db_service.get_missing_products()
    if current_app.config.get('USE_CHATGPT', 'false').lower() == 'true':
        if missing_products_query:
            current_app.logger.info("Use ChatGPT set to true, handling missing tags")
            handleMissingTags(missing_products_query)
    else:
        current_app.logger.info("Use ChatGPT set to false or no null tags left")
    return df

def getProductAndMode(df):
    current_app.logger.info(f"Getting product and modes")
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
        else:
            pdt = narration.split('-')[0].strip()
            mode = "Other"
    
        product_values.append(pdt)
        mode_values.append(mode)

    df['Product'] = product_values
    df['Mode'] = mode_values

    return df

  
def handleMissingTags(missing_products_query):
    client = OpenAI(
    api_key = current_app.config.get('CHAT_GPT_API_KEY')
    )
    # Convert the query result to a pandas DataFrame
    missing_products = [str(product[0])+"-"+product[1] for product in missing_products_query]
    
    if len(missing_products)==0:
        current_app.logger.info("No products with missing tags found.")

    current_app.logger.info(f"Found {len(missing_products)} products with missing tags.")

    batch_size=int(current_app.config.get('BATCH_SIZE'))
    for i in range(0, len(missing_products), batch_size):
        batch = missing_products[i:i+batch_size]
        batch_suggestions = get_tag_suggestions(str(batch), client)
        db_service.update_product_tags_in_db(batch_suggestions)
        current_app.logger.info(f"Successfully written for batch {int(i/batch_size + 1)}")

def get_tag_suggestions(products, client):
    prompt = """
        Task: Categorize the following products into one of the given tags based on the descriptions below.
        Available Tags: Rent, Bills, Groceries, Salon, Shopping, Contact, Investments, Travel, Dineout, Food, Fun, TBD (use TBD if no suitable category applies).
        Guidelines:
        This prompt is for an Indian context, so consider Indian names, locations, and common usage scenarios when assigning tags.
        Specific criteria for other tags:
        Rent: Monthly rent payments or housing-related expenses.
        Bills: Utility payments (electricity, water, internet).
        Groceries: Food and household supplies purchased from grocery stores.
        Salon: Expenses related to personal grooming and beauty services.
        Shopping: General retail purchases not categorized elsewhere.
        Investments: Any transaction related to financial investments.
        Travel: Transportation costs or travel-related services. Also, descriptions containing contact names and amounts between ₹80 and ₹550, classify them under Travel.
        Food: Dining expenses at restaurants or food delivery services.
        Contact: Any personal names with amounts lesser than 80 or greater than 550
        Fun: Entertainment-related expenses (movies, events, etc.).
        Dineout - This category can cover cafes, restaurants, restobars, bars and any other related activities.
        If no suitable tag can be determined, assign "TBD".
        The input is in the form of a list - ['1-A','2-B','3-C'] where the first number indicates the primary ID.
        Output: Please provide the output as Product-Tag combinations without any additional text or prefixes exactly as shown in the example below: 
        Example: 1-Movies-Fun, 2-Airtel-Bill, 3-Zomato-Food

        Input:
    """
    prompt = prompt + products
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # Specify the model for chat completions
        messages=[{"role": "user", "content": prompt}],  # Format prompt as a message
        temperature=0.7
    )
    suggestions = response.choices[0].message.content.replace("Output:","").split(",")
    return suggestions

