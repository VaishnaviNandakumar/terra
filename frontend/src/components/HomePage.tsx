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
  BarChart3, 
  Github 
} from 'lucide-react';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-green-600">terra</div>
          <nav className="flex space-x-8 text-gray-700">
            <a href="#features" className="hover:text-green-600">Features</a>
            <a href="#how-it-works" className="hover:text-green-600">How it Works</a>
            <a href="/blog" className="hover:text-amber-500">Blog</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 text-center pb-32">
      <div className="h-40"></div> {/* Spacer for fixed navbar */}

        <div className="max-w-4xl mx-auto z-10 relative">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
            Organize, analyze, and visualize — <span className="text-green-600"> effortlessly</span>
          </h1>

          {/* Tagline moved below buttons */}
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            Organize your credit and debit statements effortlessly with AI-powered extraction and mapping. 
            Explore your spending through fully customizable dashboards all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-green-600 hover:bg-green-700 text-white text-lg px-8 py-4"
            >
              Get Started <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <a
            href="https://github.com/VaishnaviNandakumar/terra/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-amber-500 text-amber-500 hover:bg-amber-50 text-lg px-8 py-4"
            >
              <Github className="w-5 h-5 mr-2" />
              Contribute on GitHub
            </Button>
          </a>
          </div>

          {/* Supported Formats */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold text-black-600 mb-6">Supported File Formats</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { color: "red-500", title: "PDF Documents", desc: "Bank statements, credit card bills, reports with password protection." },
                { color: "green-600", title: "CSV Files", desc: "Comma-separated values from banking exports or spreadsheets." },
                { color: "blue-500", title: "Excel Files", desc: ".xlsx and .xls spreadsheets with column mapping." }
              ].map((format, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <FileText className={`w-8 h-8 text-${format.color} mx-auto mb-3`} />
                  <h4 className="text-md font-semibold text-gray-900 mb-1">{format.title}</h4>
                  <p className="text-gray-600 text-sm">{format.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="min-h-screen flex items-center bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-green-600">
              Powerful Features for Financial Analysis
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to process, analyze, and export your financial data
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {[
              { icon: <Upload className="w-6 h-6 text-green-600" />, title: "Smart Upload", desc: "Drag and drop multiple files at once. Handles password-protected documents with ease." },
              { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "AI Processing", desc: "Advanced AI extracts and structures data from complex PDFs automatically." },
              { icon: <Download className="w-6 h-6 text-amber-500" />, title: "Export Options", desc: "Export processed data in CSV, Excel, or PDF formats, ready for your tools." },
              { icon: <BarChart3 className="w-6 h-6 text-blue-500" />, title: "Data Preview", desc: "Preview extracted data with our interactive carousel before finalizing." },
            ].map((feature, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="min-h-screen flex items-center bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-amber-500">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A simple 4-step process to transform your documents into structured insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {["Upload Files", "Classify & Configure", "Preview & Map", "Download Results"].map((step, index) => (
              <div key={index}>
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">{step}</h3>
                <p className="text-gray-600">
                  {index === 0 && "Upload your PDF, CSV, or Excel files. Supports password-protected documents."}
                  {index === 1 && "Classify as credit or debit statements and provide passwords if needed."}
                  {index === 2 && "Review extracted data and map columns for clean merging."}
                  {index === 3 && "Export your merged data in multiple formats, ready for analysis."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
