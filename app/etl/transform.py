import pandas as pd
from openai import OpenAI
from flask import current_app

client = OpenAI(
    # This is the default and can be omitted
    api_key = ''
)

def transform(df):
    current_app.logger.info(f"Inside transform module")
    df = getProductAndMode(df)
    current_app.logger.info("Finshed pdt starting with tags")
    return getTags(df)

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

def getTags(df):
    current_app.logger.info(f"Getting tags")
    query = "SELECT product, tag FROM product_tags"
    tagDf = pd.read_sql(query, current_app.db_engine)
    print(tagDf.head(10))
    tagDf.rename(columns={'product': 'Product'}, inplace=True)
    joinedDf = pd.merge(df, tagDf, on='Product', how='left')
    # updated_df = handleMissingTags(joinedDf)
    # #joinedDf['Date'] = pd.to_datetime(joinedDf['Date'].str.strip(), format='%d/%m/%y')
    # return updated_df
    return joinedDf

def handleMissingTags(joinedDf):
    # Get unique products without tags
    missing_products_df = joinedDf[joinedDf['Tag'].isnull()][['Product', 'Debit Amount']]
    missing_products = missing_products_df.apply(lambda row: f"{row['Product']}, {row['Debit Amount']}", axis=1).tolist()
    # Process products in batches to avoid prompt length issues
    batch_size = 20
    missing_tags = {}
    for i in range(0, len(missing_products), batch_size):
        batch = missing_products[i:i+batch_size]
        batch_suggestions = get_tag_suggestions(batch)
        missing_tags.update(batch_suggestions)

    new_tags_df = pd.DataFrame(list(missing_tags.items()), columns=['Product', 'Tag'])
    return new_tags_df

def get_tag_suggestions(products):
    prompt = """
            Categorize the following products into the appropriate tag using the descriptions below. For each product, provide the product name followed by the tag.

            Categories and Rules:

            Rent - Payments for housing or accommodation.
            Bills - Utility bills (phone, electricity, water, etc.).
            Groceries - Items purchased from grocery stores.
            Salon - Services at beauty parlours or salons.
            Shopping - Purchases from online or physical retail stores.
            Contact - Payments involving personal names or contacts:
            For names of people with amounts less than 80 or greater than 550.
            Investments - Financial investments (recurring deposits, fixed deposits).
            Travel - Transport-related expenses (Uber, Ola, BMTC, Metro) or personal names with amounts between 80 and 550.
            For names of people with amounts between 80 and 550, assign "Travel".
            Swiggy - Orders from Swiggy.
            Zomato - Orders from Zomato.
            Dineout - Payments for dining out (restaurants, pubs, bakeries).
            Fun - Expenses related to leisure activities (movies, music, books, experiences).
            Misc - Any transactions that do not fit into the above categories.
            Input Format:

            Product name, amount
            Output Format:

            Product name - tag
            Ensure to follow the rules for "Travel" and "Contact" tags based on the amount and the nature of the product name.
    """
    for product in products:
        prompt += f"{product}\n"
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  # Specify the model for chat completions
        messages=[{"role": "user", "content": prompt}],  # Format prompt as a message
        temperature=0.7
    )
    suggestions = response.choices[0].message.content
    tag_suggestions = convert_to_dict(suggestions)
    return tag_suggestions

def convert_to_dict(input_string):
    # Split the input into individual lines
    lines = input_string.strip().split('\n')
    
    # Initialize an empty dictionary
    result_dict = {}
    
    for line in lines:
        try:
            # Split each line into product and tag
            product, tag = line.split(' - ')
            # Add the product and tag to the dictionary
            result_dict[product] = tag
        except ValueError:
            # If a ValueError occurs, print a warning and skip this line
            print(f"Warning: Could not process line: {line}")
    
    return result_dict
