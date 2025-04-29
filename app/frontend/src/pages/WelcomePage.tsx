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
    <div className="min-h-[100vh] bg-gradient-to-b from-black via-black/95 to-[#0C1615] flex items-start justify-center py-10 overflow-auto">
      <div className="scale-[0.78] transform origin-top w-full max-w-screen-xl">
        {/* Background Glow */}
        <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent pointer-events-none z-0" />

        {/* Hero Section */}
        <div className="relative z-10 text-center px-4  lg:mt-14">
          <h1 className="text-5xl font-bold sm:text-5xl md:text-5xl lg:text-7xl leading-tight text-white mb-6">
            Grounded in intelligence, built for ease. Meet <span className="text-green-500">Terra</span>.
          </h1>
          <p className="text-white/80 text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto">
            Terra takes the work out of tracking so you can focus on what matters.
          </p>
        </div>

        {/* Username + CTA */}
        <div className="relative z-10 mt-12 max-w-xl mx-auto bg-[#111111]/80 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-[#222222]">
          {error && (
            <div className="mb-6 p-4 bg-red-950/50 rounded-md flex items-center text-red-200 border border-red-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          )}
          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block font-medium text-white/80 mb-2">
                Choose your username
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="flex-1 rounded-md border-[#333333] bg-black/50 text-white shadow-sm focus:border-green-500 focus:ring-green-500 text-sm"
                  placeholder="e.g., earthwalker42"
                />
                <button
                  onClick={onUsernameGenerate}
                  className="p-2 text-white hover:text-green-400"
                  title="Generate username"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md bg-green-500 text-black font-medium hover:bg-green-400 transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10 max-w-6xl w-full mx-auto px-4">
          {[
            {
              icon: <CheckCircle className="w-6 h-6 text-green-400" />,
              title: "Smart Categorization",
              desc: "Let AI do the work for you.",
            },
            {
              icon: <Zap className="w-6 h-6 text-green-400" />,
              title: "No Manual Entry",
              desc: "Upload, automate, relax.",
            },
            {
              icon: <BarChart2 className="w-6 h-6 text-green-400" />,
              title: "Effortless Insights",
              desc: "See where your money flows.",
            }
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

        {/* Footer */}
        <div className="relative z-10 mt-8 text-center text-white/80 ">
          <a href="https://github.com/VaishnaviNandakumar/terra/" className="text-green-400 hover:underline mr-4">GitHub</a>
          <a href="https://your-blog.com" className="text-green-400 hover:underline">Blog</a>
        </div>
      </div>
    </div>
  );
}
