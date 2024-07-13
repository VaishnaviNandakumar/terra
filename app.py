import pandas as pd
import numpy as np
from collections import Counter
import json

df = pd.read_csv("input/2024-data.csv")
print("Total number of records - ", len(df))
df.columns = [col.strip() for col in df.columns]

tagDf = pd.read_csv("input/product_tags.csv")
tagDf.columns = [col.strip() for col in tagDf.columns]

df = df[['Date', 'Narration', 'Debit Amount']]
df = df[df['Debit Amount']!= 0.00]
print("Total number of debit records - ", len(df))

product_values = []
mode_values = []

for narration in df['Narration']:
    if 'UPI' in narration:
        product_values.append(narration.split('-')[1].strip())
        mode_values.append("UPI")
    elif 'POS' in narration:
        product_values.append(" ".join(narration.split(' ')[2:]))
        mode_values.append('POS ')
    elif 'ME DC' in narration:
        product_values.append(" ".join(narration.split(' ')[4:]))
        mode_values.append('Debit Card')
    elif 'ATW' in narration:
        product_values.append(narration.split('-')[1].strip())
        mode_values.append('ATM')    
    else:
        product_values.append(narration)
        mode_values.append("MISC")

df['Product'] = product_values
df['Mode'] = mode_values


joinedDf = pd.merge(df, tagDf, on='Product', how='left')
schema = {
'Date':             'datetime64[ns]',
'Narration':        str,
'Debit Amount':     float,
'Product':          str,
'Mode':             str,
'Tag':              str
}

def concat_and_sum(series):
    strings_array = np.array(series)
    return strings_array

def analyze(result):
    index = result.index
    values = result.values
    dates = []
    vals = []
    tagsDistbn = {}
    totalSum = 0
    latestDate = 0
    paymentMod = {}
    productDistbn = {}
    expenseDistbn = {}

    for (i, v) in zip(index, values):
        ts = str(i[0])
        tag = i[1]
        product = v[0]
        mode = v[1]
        amt = v[2]
        pdtCounter = dict(Counter(product))
        modeCounter = dict(Counter(mode))
        print(ts, "  ", tag)
        print(pdtCounter)
        print(modeCounter)
        print(amt)
        print("\n")
        
        data = {}
        data['Tag'] = tag
        data['POS Distribution'] = pdtCounter
        data['Total Amount Spent'] = amt
        data['Payment Mode Distribution'] = modeCounter
        
        if ts in expenseDistbn:
            expenseDistbn[ts].append(data)
        else:
            expenseDistbn[ts] = [data]
    
    # for k, v in expenseDistbn.items():
    #     print("Key - " + str(k))
    #     print("Value - " + str(v))
    #     print("\n")
    
    # Write expenseDistbn to a JSON file
    with open('expense_distribution.json', 'w') as json_file:
        json.dump(expenseDistbn, json_file, default=str, indent=4)

joinedDf['Date'] = pd.to_datetime(joinedDf['Date'].str.strip(), format='%d/%m/%y')
joinedDf = joinedDf.applymap(lambda x: x.strip() if isinstance(x, str) else x)

monthlyResult = joinedDf.groupby([pd.Grouper(key='Date', freq='ME'), 'Tag']).agg({'Product': concat_and_sum, 'Mode': concat_and_sum, 'Debit Amount': 'sum'})
analyze(monthlyResult)
weeklyResult = joinedDf.groupby(pd.Grouper(key='Date', freq='W')).sum()
# analyze(weeklyResult)
# dayResult = joinedDf.groupby(joinedDf['Date'].dt.dayofweek)['Debit Amount'].sum()



