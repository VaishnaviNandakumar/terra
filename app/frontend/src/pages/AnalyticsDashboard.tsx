import React from "react";

interface AnalyticsDashboardProps {
  sessionId: string | null;
}

const GRAFANA_SERVER = import.meta.env.VITE_GRAFANA_SERVER;
const GRAFANA_DASHBOARD = import.meta.env.VITE_GRAFANA_DASHBOARD;

export function AnalyticsDashboard({ sessionId }: AnalyticsDashboardProps) {
  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-screen dark:bg-gray-900">
        <div className="text-red-500 dark:text-red-400 p-4 text-lg">
          No session ID provided. Please return to the main page.
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen dark:bg-gray-900">
      <iframe
        src={`${GRAFANA_SERVER}/d/${GRAFANA_DASHBOARD}?from=now-1y&to=now&timezone=browser&var-session_id=${sessionId}`}
        className="w-full h-full border-0"
      ></iframe>
    </div>
  );
}

