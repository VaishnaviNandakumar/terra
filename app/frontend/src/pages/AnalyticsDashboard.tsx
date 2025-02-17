import React from "react";

interface AnalyticsDashboardProps {
  sessionId: string | null;
}

export function AnalyticsDashboard({ sessionId }: AnalyticsDashboardProps) {
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 p-4 text-lg">
          No session ID provided. Please return to the main page.
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <iframe
        src={`http://localhost:3000/d/ee1qpf9d1jgn4d/expense-tracker?from=now-5y&to=now&timezone=browser&var-session_id=${sessionId}`}
        className="w-full h-full border-0"
      ></iframe>
    </div>
  );
}
