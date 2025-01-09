// server/src/components/ui/Drawer.tsx
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { SessionProvider } from "next-auth/react";
import { Theme } from '@radix-ui/themes';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isInDrawer?: boolean;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, isInDrawer = false }) => {
  return (
    <Dialog.Root modal open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 transition-opacity duration-300 data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
        />
        <Dialog.Content 
          className="fixed inset-y-0 right-0 w-fit max-w-[90vw] bg-white shadow-lg focus:outline-none overflow-y-auto transform transition-all duration-300 ease-in-out data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <SessionProvider>
            <Theme>
              <div className="p-6">
                {children}
              </div>
            </Theme>
          </SessionProvider>
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
            onClick={onClose}
          >
            <Cross2Icon />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Drawer;
