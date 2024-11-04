// server/src/components/layout/RightSidebar.tsx
import React, { ComponentType, Suspense } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { getFeatureImplementation } from '@/lib/features';

interface RightSidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  companyUrl: string;
  accountId: string;
  messages: any[];
  userRole: string;
  selectedAccount: string;
  handleSelectAccount: any;
  auth_token: string;
  setChatTitle: any;
  isTitleLocked: boolean;
}

// CE version of RightSidebar
const CERightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  setIsOpen
}) => {
  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <Collapsible.Content
        className={`fixed top-0 right-0 h-full bg-gray-50 w-96 shadow-xl overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full border-l-2 border-gray-200">
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Chat</h2>
            <p className="text-gray-600">
              The chat feature is only available in the Enterprise Edition.
            </p>
          </div>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

// Wrap the component with Suspense and proper typing
const RightSidebar: React.FC<RightSidebarProps> = (props) => {
  // Use dynamic import with proper type assertion
  const EERightSidebar = React.lazy(() => 
    import('@ee/components/layout/RightSidebar') as Promise<{ default: ComponentType<RightSidebarProps> }>
  );
  const Component = getFeatureImplementation(CERightSidebar, EERightSidebar);

  return (
    <Suspense fallback={null}>
      <Component {...props} />
    </Suspense>
  );
};

export default RightSidebar;
