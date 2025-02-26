## Terra - An Expense Tracker Project
### Technical Documentation

> **Note**: This is an ongoing personal project, and contributions are welcome.

### Tasks
- [ ] Setup depoloyment configuration
- [ ] Complete documentation
- [ ] Generate scheduler for session ID management
- [ ] Create better sample data
- [ ] Refine Grafana Visuals
- [ ] Add functionality for multiple statements
- [ ] Make the website responsive


## Project Overview

### Purpose
Expense tracking is essential, especially in high-cost urban areas like Bangalore. This project aims to automate the tracking process by categorizing and visualizing expenses without repeated manual input. It promotes financial awareness and supports healthy spending habits by simplifying expense management.

### Scope
Starting with a single data source (bank statements in CSV format), this project extracts, transforms, and visualizes spending data. It employs intelligent categorization with options for manual corrections in a user-friendly interface.

---

## Architecture Diagram
![Terra](https://github.com/user-attachments/assets/faacac6d-9bf6-4192-8977-586eac7e13ad)



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

## Data Modeling
<img src="https://github.com/user-attachments/assets/95becb30-13be-4c59-834e-f7341cdd6c31" alt="Terra-ER drawio" width="50%">

## Data Visualisation 

### Schema Design

#### Sessions Table (`sessions`)
- Represents user sessions in the application.  
- Uses `session_id` as a unique identifier to link all user-related data.  
- Ensures session expiration tracking via `expires_at`.  
- Indexed for fast lookups on session expiry.  

#### Transactions Table (`transactions`)
- Stores financial transactions associated with a session.  
- Captures essential details: `transaction_date`, `narration`, `debit_amount`, `product`, `mode`.  
- Uses `session_id` as a foreign key to link transactions to a specific session.  
- Maintains timestamps (`created_ts`, `last_updated_ts`) for auditing changes.  
- Indexed on `session_id` for quick retrieval.  

#### Product Tags Table (`product_tags`)
- Maps products to tags (categories) within a session.  
- Helps classify transactions by assigning meaningful categories to products.  
- Uses `session_id` to keep tag associations session-specific.  
- The foreign key constraint ensures that deleting a session removes associated tags.  

#### Expense Data Table (`expense_data`)
- A processed version of transactions that includes a `month_year` column for reporting.  
- Stores tagged transactions, allowing category-based analysis.  
- The **GENERATED COLUMN** `month_year` helps in monthly aggregations.  
- Uses `session_id` to maintain user-specific expense data.  
- Indexed for faster retrieval based on sessions.  

#### Trigger (`update_expense_data_tag`)
- Automatically updates `expense_data` when a tag in `product_tags` is modified.  
- Ensures that tag changes reflect in previously stored expense records.  
- Helps maintain data consistency across tables.  

#### Indexes
- Improve query performance on key fields like `session_id` and `expires_at`.  
- Ensure fast lookups when retrieving transactions or filtering expenses.  


### Data Warehousing & Storage
- Normalization: The model follows 3NF (Third Normal Form) by separating transactions, product tags, and expense data to reduce redundancy.
- Referential Integrity: Foreign key constraints ensure data consistency when deleting sessions.
- Performance Optimization: Indexing on frequently queried fields (session_id, expires_at) ensures fast lookups.
- Automation with Triggers: The update_expense_data_tag trigger ensures synchronized updates when product tags are modified.

---


## Frontend

The application interface, built with Flask, includes:
- **File Upload**: Users upload CSV statements.
- **Expense Overview**: A dashboard displays expense insights.
- **Tag Management**: An interface for editing and assigning custom tags.

---

*This documentation outlines the system’s purpose, data flow, and features, providing a reference for technical implementation and future development.*
