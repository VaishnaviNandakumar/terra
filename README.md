# PDF Analysis Tool

A full-stack application for analyzing PDF bank statements, CSV files, and Excel spreadsheets to extract transaction data using AI.

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
- **File Classification**: Automatic detection of credit vs debit statements
- **Real-time Processing**: Progress tracking with status updates
- **Data Export**: Download processed results as CSV
- **Responsive Design**: Works on desktop and mobile devices

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

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/upload` - Upload files
- `POST /api/analyze` - Analyze uploaded files
- `GET /api/download/<filename>` - Download results

## Development

### Running Both Servers

You can run both frontend and backend simultaneously:

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run backend
```

### Adding New Features

The modular structure makes it easy to add new features:

1. **New API endpoints**: Add to `backend/app.py`
2. **New services**: Create in `backend/services/`
3. **New components**: Add to `src/components/`
4. **New pages**: Create route components in `src/components/`

## Future Enhancements

- User authentication and file management
- Analysis dashboard with charts and insights
- Support for more file formats
- Batch processing capabilities
- Data visualization components
- Export to multiple formats (JSON, Excel)

## Technologies Used

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite for build tooling

### Backend
- Flask web framework
- OpenAI GPT-4 for AI processing
- pdfplumber for PDF text extraction
- pandas for data manipulation
- Flask-CORS for cross-origin requests