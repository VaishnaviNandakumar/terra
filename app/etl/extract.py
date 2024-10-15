
from flask import current_app
import pandas as pd
from io import StringIO

def extract_data(file_content):
    current_app.logger.info(f"Inside extract module")
    csv_data = pd.read_csv(StringIO(file_content), on_bad_lines='warn')  
    if csv_data is None or csv_data.empty:
        current_app.logger.error("No data provided for extraction.")
        return

    count = len(csv_data)
    csv_data.columns = [col.strip() for col in csv_data.columns]

    # Log the total number of records
    current_app.logger.info(f"Total number of records - {count}")


    df = csv_data[['Date', 'Narration', 'Debit Amount']]
    df = df[df['Debit Amount'] != 0.00]
    current_app.logger.info(f"Total number of debit records - {len(df)}")
    return df


