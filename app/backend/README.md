# Expense Tracker Project - Technical Documentation

> **Note**: This is an ongoing personal project, and contributions are welcome.

### Tasks
1. Add data sources for testing
2. Set up deployment configuration
3. Add functionality for multiple statement uploads
4. Improve code performance
5. Refine frontend design and user experience
6. Expand Grafana visualizations
7. Optimize AI prompt handling
8. Generate additional sample test data
9. Implement a scheduler for session ID management

## Project Overview

### Purpose
Expense tracking is essential, especially in high-cost urban areas like Bangalore. This project aims to automate the tracking process by categorizing and visualizing expenses without repeated manual input. It promotes financial awareness and supports healthy spending habits by simplifying expense management.

### Scope
Starting with a single data source (bank statements in CSV format), this project extracts, transforms, and visualizes spending data. It employs intelligent categorization with options for manual corrections in a user-friendly interface.

---

## Architecture Diagram
![Exta](https://github.com/user-attachments/assets/7e0448a7-cc5f-47d7-9dec-e9d47ac8abde)


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
![Exta_ER](https://github.com/user-attachments/assets/0e0ffb32-812e-4040-8f83-2815b76f28e6)


### Schema Design

- **Transactions Table**: 
  - Fields: `id`, `transaction_date`, `narration`, `debit_amount`, `product`, `mode`, `tag`.
  
- **Product Tags Table**:
  - Fields: `product`, `tags`.

### Data Warehousing & Storage
Data is denormalized to prioritize read efficiency due to the application’s read-heavy nature.

---

## Performance & Optimization

- **Bottlenecks**: Currently managed through data denormalization to speed up read operations.
- **Scalability**: Scales by using load-balanced servers and cache optimization; testing under various loads ensures stable performance.

---


## Frontend

The application interface, built with Flask, includes:
- **File Upload**: Users upload CSV statements.
- **Expense Overview**: A dashboard displays expense insights.
- **Tag Management**: An interface for editing and assigning custom tags.

---

*This documentation outlines the system’s purpose, data flow, and features, providing a reference for technical implementation and future development.*
