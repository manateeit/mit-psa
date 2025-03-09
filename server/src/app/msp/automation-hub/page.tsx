"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "server/src/components/ui/Card";
import { Button } from "server/src/components/ui/Button";
import { ReflectionContainer } from "server/src/types/ui-reflection/ReflectionContainer";
import { 
  LayoutTemplate, 
  Code2, 
  Bell, 
  History 
} from "lucide-react";

export default function AutomationHubPage() {
  const router = useRouter();

  const sections = [
    {
      id: "template-library",
      title: "Template Library",
      description: "Browse and use predefined automation templates for common business processes.",
      icon: <LayoutTemplate className="h-8 w-8 text-primary-500" />,
      features: [
        "Predefined example automation scripts",
        "Browse, preview, and copy templates",
        "Create workflows from templates",
        "Categorized by business function"
      ],
      path: "/msp/automation-hub/template-library"
    },
    {
      id: "workflows",
      title: "Workflows",
      description: "Create and manage your custom TypeScript-based automation workflows.",
      icon: <Code2 className="h-8 w-8 text-primary-500" />,
      features: [
        "TypeScript code editor with validation",
        "Status tracking and execution logs",
        "Version history and testing tools",
        "Parameter configuration"
      ],
      path: "/msp/automation-hub/workflows"
    },
    {
      id: "events-catalog",
      title: "Events Catalog",
      description: "Discover and configure event triggers for your automation workflows.",
      icon: <Bell className="h-8 w-8 text-primary-500" />,
      features: [
        "Registry of available system events",
        "Attach/detach workflows to events",
        "Event payload mapping to workflow parameters",
        "Event categorization and documentation"
      ],
      path: "/msp/automation-hub/events-catalog"
    },
    {
      id: "logs-history",
      title: "Logs & History",
      description: "Monitor and troubleshoot workflow executions with detailed logs and visualizations.",
      icon: <History className="h-8 w-8 text-primary-500" />,
      features: [
        "Historical execution records",
        "Visual workflow execution graphs",
        "Detailed execution logs",
        "Performance metrics and analytics"
      ],
      path: "/msp/automation-hub/logs-history"
    }
  ];

  return (
    <ReflectionContainer id="automation-hub-landing" label="Automation Hub Landing">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card key={section.id} className="p-6 flex flex-col h-full">
              <div className="flex items-start mb-4">
                {section.icon}
                <h2 className="text-xl font-semibold ml-3">{section.title}</h2>
              </div>
              <p className="text-gray-600 mb-4">{section.description}</p>
              
              <ul className="mb-6 flex-grow">
                {section.features.map((feature, index) => (
                  <li key={index} className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary-400 mr-2"></div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                id={`explore-${section.id}-button`}
                onClick={() => router.push(section.path)}
                className="w-full"
              >
                Explore {section.title}
              </Button>
            </Card>
          ))}
        </div>
        
        <Card className="p-6 bg-primary-50 border-primary-100">
          <h2 className="text-lg font-semibold mb-2">Getting Started</h2>
          <p className="text-gray-700 mb-4">
            The Automation Hub allows you to create powerful TypeScript-based workflows that can be triggered by system events.
            Start by exploring the Template Library to see examples, then create your own workflows and connect them to events.
          </p>
          <div className="flex space-x-4">
            <Button 
              id="view-documentation-button"
              variant="outline"
              onClick={() => router.push("/msp/automation-hub/template-library")}
            >
              Browse Templates
            </Button>
            <Button 
              id="create-workflow-button"
              onClick={() => router.push("/msp/automation-hub/workflows")}
            >
              Create Workflow
            </Button>
          </div>
        </Card>
      </div>
    </ReflectionContainer>
  );
}