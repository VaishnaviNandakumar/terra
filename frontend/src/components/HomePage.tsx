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
    <div className="min-h-screen bg-gradient-to-br from-[#121212] to-[#1A1A1A] text-white ">

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#121212]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-green-400">terra</div>
          <nav className="flex space-x-8 text-gray-300">
            <a href="#features" className="hover:text-green-400">Features</a>
            <a href="#how-it-works" className="hover:text-green-400">How it Works</a>
            <a href="/blog" className="hover:text-amber-400">Blog</a>
          </nav>
        </div>
      </header>

=      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 text-center pb-64">
        <div className="max-w-4xl mx-auto z-10 relative">
          <h1 className="text-4xl md:text-6xl  mb-6 leading-tight">
            Grounded in intelligence, built for  <span className="text-green-500">ease</span> 
          </h1>
          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
            Upload and consolidate your bank statements with AI-powered extraction.
            Secure, fast, and built for deep financial insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={onGetStarted}
              className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4"
            >
              Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-amber-500 text-amber-400 hover:bg-amber-500/20 text-lg px-8 py-4"
            >
              <Github className="w-5 h-5 mr-2" /> Contribute on GitHub
            </Button>
          </div>
        </div>

        {/* <div
          className="absolute bottom-0 left-0 right-0 h-64 bg-repeat-x bg-bottom opacity-80"
          style={{
            backgroundImage: "url('/footer-3.png')",
            backgroundSize: "auto 100%"  // keeps the image height fixed, width repeats
          }}
        ></div> */}
      </section>

      {/* Features Section */}
      <section id="features" className="min-h-screen flex items-center bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-green-400">
              Powerful Features for Financial Analysis
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to process, analyze, and export your financial data
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {[
              { icon: <Upload className="w-6 h-6 text-green-400" />, title: "Smart Upload", desc: "Drag and drop multiple files at once. Handles password-protected documents with ease." },
              { icon: <Zap className="w-6 h-6 text-yellow-400" />, title: "AI Processing", desc: "Advanced AI extracts and structures data from complex PDFs automatically." },
              { icon: <Download className="w-6 h-6 text-amber-400" />, title: "Export Options", desc: "Export processed data in CSV, Excel, or PDF formats, ready for your tools." },
              { icon: <BarChart3 className="w-6 h-6 text-blue-400" />, title: "Data Preview", desc: "Preview extracted data with our interactive carousel before finalizing." },
            ].map((feature, i) => (
              <div key={i} className="bg-[#2A2A2A] rounded-xl p-8 hover:shadow-lg hover:shadow-green-500/20 transition-shadow">
                <div className="w-12 h-12 bg-[#1E1E1E] rounded-lg flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="min-h-screen flex items-center bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-amber-400">How It Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A simple 4-step process to transform your documents into structured insights
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {["Upload Files", "Classify & Configure", "Preview & Map", "Download Results"].map((step, index) => (
              <div key={index}>
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-4">{step}</h3>
                <p className="text-gray-400">
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

      {/* Supported Formats */}
      <section id="supported-formats" className="min-h-screen flex items-center bg-[#1E1E1E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8 text-green-400">
            Supported File Formats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              { color: "red-300", title: "PDF Documents", desc: "Bank statements, credit card bills, reports with password protection." },
              { color: "green-400", title: "CSV Files", desc: "Comma-separated values from banking exports or spreadsheets." },
              { color: "blue-400", title: "Excel Files", desc: ".xlsx and .xls spreadsheets with column mapping." }
            ].map((format, i) => (
              <div key={i} className="bg-[#2A2A2A] rounded-lg p-6">
                <FileText className={`w-12 h-12 text-${format.color} mx-auto mb-4`} />
                <h3 className="text-lg font-semibold text-white mb-2">{format.title}</h3>
                <p className="text-gray-400 text-sm">{format.desc}</p>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={onGetStarted} className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-4">
            Start Processing Your Files <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};
