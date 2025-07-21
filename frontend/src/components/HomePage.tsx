import React from 'react';
import { Button } from './ui/Button';
import { 
  FileText, 
  Upload, 
  Settings, 
  Download, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">PDF Analysis Tool</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <a href="#supported-formats" className="text-gray-600 hover:text-gray-900">Formats</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Document Analysis
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transform Your
              <span className="text-blue-600 block">Financial Documents</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Upload PDF bank statements, CSV files, and Excel spreadsheets. Our AI extracts, 
              analyzes, and merges your transaction data with precision and ease.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-4">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.9%</div>
              <div className="text-gray-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">10+</div>
              <div className="text-gray-600">File Formats</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">5min</div>
              <div className="text-gray-600">Average Processing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Financial Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to process, analyze, and export your financial data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Upload</h3>
              <p className="text-gray-600 leading-relaxed">
                Drag and drop multiple files at once. Automatic file type detection and 
                password protection handling for secure documents.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced AI extracts transaction data from complex PDF layouts, 
                understanding context and structure automatically.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Column Mapping</h3>
              <p className="text-gray-600 leading-relaxed">
                Customize which columns to merge from each file. Drag and drop 
                interface for complete control over your data structure.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Secure Processing</h3>
              <p className="text-gray-600 leading-relaxed">
                Your data is processed securely with encryption. Files are automatically 
                deleted after processing for maximum privacy.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Download className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Multiple Exports</h3>
              <p className="text-gray-600 leading-relaxed">
                Export your processed data in CSV, Excel, or PDF formats. 
                Perfect for accounting software or further analysis.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Preview</h3>
              <p className="text-gray-600 leading-relaxed">
                Preview your data before final processing. Carousel view lets you 
                review each file's extracted information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple 4-step process to transform your documents into structured data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h3>
              <p className="text-gray-600">
                Upload your PDF, CSV, or Excel files. We support password-protected documents too.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Classify & Configure</h3>
              <p className="text-gray-600">
                Classify documents as credit or debit statements. Provide passwords if needed.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Preview & Map</h3>
              <p className="text-gray-600">
                Review extracted data and map columns for merging. Full control over your output.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Download Results</h3>
              <p className="text-gray-600">
                Export your merged data in your preferred format. Ready for analysis!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Formats */}
      <section id="supported-formats" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Supported File Formats
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-red-50 rounded-lg p-6">
              <FileText className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Documents</h3>
              <p className="text-gray-600 text-sm">
                Bank statements, credit card bills, financial reports with password protection support
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">CSV Files</h3>
              <p className="text-gray-600 text-sm">
                Comma-separated values from banking exports, accounting software, spreadsheets
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Excel Files</h3>
              <p className="text-gray-600 text-sm">
                .xlsx and .xls spreadsheets with automatic data detection and column mapping
              </p>
            </div>
          </div>

          <Button size="lg" onClick={onGetStarted} className="text-lg px-8 py-4">
            Start Processing Your Files
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">PDF Analysis Tool</span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 PDF Analysis Tool. Built with AI for financial data processing.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};