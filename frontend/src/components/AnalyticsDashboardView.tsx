import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';

interface AnalyticsDashboardProps {
  sessionId: string | null;
  onBack: () => void;
}

const GRAFANA_SERVER = "http://127.0.0.1:3000"
const GRAFANA_DASHBOARD = "ee1qpf9d1jgn4d/expense-tracker";

import { sessionManager } from '../utils/sessionManager';

export const AnalyticsDashboardView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const sessionId = sessionManager.getSessionId();
  console.log("Session ID:", sessionId);


  if (!sessionId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-6">
        <div className="text-red-500 text-lg font-medium p-4">
          No session ID found. Please return to the main page.
        </div>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <h1 className="text-2xl font-bold text-green-500">Analytics Dashboard</h1>
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit Dashboard
        </Button>
      </div>

      <div className="flex-1">
        <iframe
          src={`http://127.0.0.1:3000/d/ee1qpf9d1jgn4d/expense-tracker?from=now-1y&to=now&timezone=browser&var-session_id=${sessionId}`}
          className="w-full h-full border-0"
        ></iframe>
      </div>
    </div>
  );
};


export default AnalyticsDashboardView;
