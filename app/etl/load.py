from flask import current_app

def write_db(df):
    current_app.logger.info(f"Writing to db")
    df.to_sql(name='transactions', con=current_app.db_engine, if_exists='replace', index=False)
    current_app.logger.info(f"Finished writing")

