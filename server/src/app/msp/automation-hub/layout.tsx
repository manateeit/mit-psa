"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "server/src/lib/actions/user-actions/userActions";
import Link from "next/link";
import { Card } from "server/src/components/ui/Card";
import { ReflectionContainer } from "server/src/types/ui-reflection/ReflectionContainer";

export default function AutomationHubLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/signin");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        router.push("/auth/signin");
      }
    };

    checkAuth();
  }, [router]);

  const isActive = (path: string) => pathname === path;

  return (
    <ReflectionContainer id="automation-hub-container" label="Automation Hub">
      <div className="flex flex-col h-full">
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Automation Hub</h1>
          <p className="text-gray-600 mb-6">
            Create, manage, and monitor TypeScript-based workflows with event-based triggers
          </p>
          
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" id="automation-hub-navigation">
              <Link
                href="/msp/automation-hub/template-library"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive("/msp/automation-hub/template-library")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                id="template-library-nav-link"
              >
                Template Library
              </Link>
              <Link
                href="/msp/automation-hub/workflows"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive("/msp/automation-hub/workflows")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                id="workflows-nav-link"
              >
                Workflows
              </Link>
              <Link
                href="/msp/automation-hub/events-catalog"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive("/msp/automation-hub/events-catalog")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                id="events-catalog-nav-link"
              >
                Events Catalog
              </Link>
              <Link
                href="/msp/automation-hub/logs-history"
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  isActive("/msp/automation-hub/logs-history")
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                id="logs-history-nav-link"
              >
                Logs & History
              </Link>
            </nav>
          </div>
        </Card>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </ReflectionContainer>
  );
}