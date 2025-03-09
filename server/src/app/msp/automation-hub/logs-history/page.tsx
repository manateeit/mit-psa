"use client";

import React, { useState, useEffect } from "react";
import { Card } from "server/src/components/ui/Card";
import { ReflectionContainer } from "server/src/types/ui-reflection/ReflectionContainer";
import { History } from "lucide-react";
import LogsHistoryWorkflowTable from "server/src/components/workflows/logs-history/LogsHistoryWorkflowTable";
import { WorkflowExecutionDetails } from "server/src/components/workflows/logs-history/WorkflowExecutionDetails";
import { useSearchParams, useRouter } from "next/navigation";
import { getWorkflowExecutionDetails } from "server/src/lib/actions/workflow-actions";

export default function LogsHistoryPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const executionId = searchParams?.get('executionId') || null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    // Navigate back to the list view by removing the executionId query parameter
    router.push('/msp/automation-hub/logs-history');
  };

  return (
    <ReflectionContainer id="logs-history-container" label="Logs & History">
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center mb-6">
            <History className="h-6 w-6 text-primary-500 mr-2" />
            <h1 className="text-xl font-semibold">Logs & Workflow History</h1>
          </div>
          
          {executionId ? (
            <WorkflowExecutionDetails
              executionId={executionId}
              onBack={handleBack}
            />
          ) : (
            <LogsHistoryWorkflowTable />
          )}
        </Card>
      </div>
    </ReflectionContainer>
  );
}