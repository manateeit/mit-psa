"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import WorkflowExecutionsTable from 'server/src/components/workflows/WorkflowExecutionsTable';
import { IWorkflowExecution } from '@shared/workflow/persistence/workflowInterfaces';

export default function LogsHistoryWorkflowTable() {
  const router = useRouter();

  // Override the default row click behavior to navigate within the Logs & History page
  const handleRowClick = (row: IWorkflowExecution) => {
    router.push(`/msp/automation-hub/logs-history?executionId=${row.execution_id}`);
  };

  return (
    <div className="workflow-executions-wrapper">
      {/* Pass initialData as an empty array to force the component to fetch data */}
      <WorkflowExecutionsTable 
        initialData={[]} 
        // The component will use its internal handleRowClick, but we're monkey patching it below
      />

      {/* Monkey patch the default row click behavior */}
      <script dangerouslySetInnerHTML={{
        __html: `
          // Wait for the table to be rendered
          setTimeout(() => {
            // Find all rows in the workflow executions table
            const rows = document.querySelectorAll('#workflow-executions-table tbody tr');
            
            // Add our custom click handler to each row
            rows.forEach(row => {
              row.addEventListener('click', (e) => {
                // Get the execution ID from the row's data attribute or another reliable source
                const executionId = row.querySelector('td:last-child')?.getAttribute('data-execution-id');
                if (executionId) {
                  // Prevent the default click behavior
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // Navigate to our Logs & History page with the execution ID
                  window.location.href = \`/msp/automation-hub/logs-history?executionId=\${executionId}\`;
                }
              });
            });
          }, 500);
        `
      }} />
    </div>
  );
}