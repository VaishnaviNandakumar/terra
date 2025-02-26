import React from 'react';
import { AlertCircle, Sparkles, ArrowRight, CheckCircle, BarChart2, Zap } from 'lucide-react';

interface WelcomePageProps {
  username: string;
  error: string | null;
  onUsernameChange: (username: string) => void;
  onUsernameGenerate: () => void;
  onGetStarted: () => void;
}

export function WelcomePage({
  username,
  error,
  onUsernameChange,
  onUsernameGenerate,
  onGetStarted
}: WelcomePageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-black via-black/95 to-[#0C1615] relative flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-4xl mx-auto text-center">
      <h4 className="text-5xl sm:text-6xl font-bold mb-6 drop-shadow-md ">
        Grounded in intelligence, built for ease. Meet <span className="text-green-500">Terra</span>.</h4>
      <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto px-4  text-center whitespace-nowrap ">
        Terra takes the work out of tracking so you can focus on what matters. 
      </p>
      </div>

      {/* Call to Action */}
      <div className="w-full max-w-md mx-auto mt-8 bg-[#111111]/80 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 border border-[#222222]">
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 rounded-md flex items-center text-red-200 border border-red-800">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-2">
              Choose your username
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                className="flex-1 rounded-md border-[#333333] bg-black/50 text-white shadow-sm focus:border-green-500 focus:ring-green-500 text-sm sm:text-base"
                placeholder="e.g., earthwalker42"
              />
              <button
                onClick={onUsernameGenerate}
                className="p-2 text-white hover:text-green-400 transition-colors"
                title="Generate a random username"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={onGetStarted}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors text-sm sm:text-base font-medium"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-6 mt-12 max-w-3xl">
        {[
          { icon: <CheckCircle className="w-6 h-6 text-green-400" />, title: "Smart Categorization", desc: "Let AI do the work for you." },
          { icon: <Zap className="w-6 h-6 text-green-400" />, title: "No Manual Entry", desc: "Upload, automate, relax." },
          { icon: <BarChart2 className="w-6 h-6 text-green-400" />, title: "Effortless Insights", desc: "See where your money flows." }
        ].map((feature, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-[#111111]/80 border border-[#222222] rounded-lg shadow-md">
            {feature.icon}
            <div>
              <h3 className="text-white font-semibold">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Links Section */}
      <div className="mt-12 text-center text-white/80 text-sm">
        <a href="https://github.com/VaishnaviNandakumar/terra/" className="text-green-400 hover:underline mr-4">GitHub</a>
        <a href="https://your-blog.com" className="text-green-400 hover:underline">Blog</a>
      </div>
    </div>
  );
}
