import React from 'react';
import { BarChart3 } from 'lucide-react';

interface AnalyticsDashboardProps {
  sessionId: string | null;
}

export function AnalyticsDashboard({ sessionId }: AnalyticsDashboardProps) {
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-red-500 p-4">No session ID provided. Please return to the main page.</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 mx-auto mb-4" />
            <p>Analytics dashboard coming soon!</p>
          </div>
        </div>
      </div>
    </div>
  );
}