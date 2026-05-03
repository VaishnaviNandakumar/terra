# Expense Tracker Project - Technical Documentation

> **Note**: This is an ongoing personal project, and contributions are welcome. <br>
> https://terra-steel.vercel.app/

## Project Overview

### Purpose
Expense tracking is essential, especially in high-cost urban areas like Bangalore. This project aims to automate the tracking process by categorizing and visualizing expenses without repeated manual input. It promotes financial awareness and supports healthy spending habits by simplifying expense management.

### Scope
Starting with a single data source (bank statements in CSV format), this project extracts, transforms, and visualizes spending data. It employs intelligent categorization with options for manual corrections in a user-friendly interface.


## Project Structure

```
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── run.py             # Development server runner
│   ├── services/          # Business logic services
│   │   ├── pdf_processor.py   # PDF processing with OpenAI
│   │   └── file_loader.py     # CSV/Excel file processing
│   └── utils/             # Utility functions
│       └── response_helper.py # API response helpers
├── src/                    # React frontend
│   ├── components/        # React components
│   ├── services/         # API service layer
│   └── types/           # TypeScript type definitions
└── public/              # Static assets
```

## Features

- **File Upload**: Drag-and-drop interface for PDF, CSV, and Excel files
- **AI-Powered Analysis**: Uses OpenAI GPT-4 to extract transaction data from PDFs
- **Data Consilidation, Reconciliation & Validation**: Regardless of the source format, the data is cleaned and consolidated into a uniform output that is mapped to its source and easily understood by the user
- **Real-time Processing**: Progress tracking with status updates
- **Data Export**: Download processed results as CSV
- **Responsive Design**: Works on desktop and mobile devices

## Data Sources

The primary data source is bank statements formatted in CSV, structured with the following fields:

| Date      | Narration                             | Value Date | Debit Amount | Credit Amount | Chq/Ref Number | Closing Balance |
|-----------|--------------------------------------|------------|--------------|---------------|----------------|-----------------|
| 31/12/23  | UPI-ZOMATO-ZOMATOUPI@HDFC-FOOD ORDER | 01/01/24   | 150.00       | 0.00          | 123456789012   | 50000.00        |
| 31/12/23  | UPI-RAPIDO-FAST@SBI-TRAVEL           | 01/01/24   | 89.00        | 0.00          | 987654321098   | 49911.00        |

---

## Data Pipeline Architecture

### Pipeline Stages

- **Ingestion**: Users upload CSV files (max size: 10MB). Data frames process CSV content, ignoring bad records. Only debit transactions are processed.
  
- **Transformation**: Filters and categorizes the `Date`, `Narration`, and `Debit Amount` fields. Using OpenAI’s API, transactions are assigned to categories (e.g., Rent, Bills, Groceries) or marked as "TBD" if uncategorized.

- **Loading**: Transformed data is loaded into a database for visualization. Processed data is stored in a SQL database and visualized using Grafana. Users can explore monthly spending patterns with custom filters.

---

## App Screens 


<img width="1600" height="922" alt="image" src="https://github.com/user-attachments/assets/6ead072a-9719-46a0-912d-d62ef2796a65" />
<img width="1600" height="822" alt="image" src="https://github.com/user-attachments/assets/848ed8d2-e374-490f-bd54-1c7f771ae2ab" />
<img width="1600" height="1041" alt="image" src="https://github.com/user-attachments/assets/550cdca6-fb98-4c77-b8b3-ad3607f5d3f8" />
<img width="1600" height="1176" alt="image" src="https://github.com/user-attachments/assets/fb613081-c97e-4863-88c4-828774d76612" />
<img width="1600" height="1155" alt="image" src="https://github.com/user-attachments/assets/cb5488b8-063b-49ee-adbc-d519e20c3ed1" />
<img width="1600" height="1254" alt="image" src="https://github.com/user-attachments/assets/cb7fb124-d0d4-450d-be76-b9510dbe610e" />


## Data Visualisation 
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/d94c1bec-d401-43e1-8bf2-592b02f55dc3" />
<img width="1439" alt="image" src="https://github.com/user-attachments/assets/3c99ab03-281f-473f-8c20-eadf1096becb" />
<img width="1436" alt="image" src="https://github.com/user-attachments/assets/6db3c3cf-04d1-4702-9118-7742ed91f108" />
<img width="1432" alt="image" src="https://github.com/user-attachments/assets/29ea344b-3e68-4dc4-af4a-59d8e883642d" />
<img width="1439" alt="image" src="https://github.com/user-attachments/assets/e2813dca-8992-4446-b961-6c195f94569f" />
<img width="1440" alt="image" src="https://github.com/user-attachments/assets/e4942542-8177-4c2d-a20c-a77ae9afc85d" />





## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

5. Run the backend server:
   ```bash
   python run.py
   ```


### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

### Adding New Features

The modular structure makes it easy to add new features:

1. **New API endpoints**: Add to `backend/app.py`
2. **New services**: Create in `backend/services/`
3. **New components**: Add to `src/components/`
4. **New pages**: Create route components in `src/components/`

