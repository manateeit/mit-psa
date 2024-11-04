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
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className={`fixed inset-y-0 right-0 ${isInDrawer ? 'w-[40%]' : 'w-[50%]'} bg-white shadow-lg focus:outline-none overflow-y-auto`}>
          <SessionProvider>
            <Theme>
              <div className="p-6">
                {children}
              </div>
            </Theme>
          </SessionProvider>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Drawer;
