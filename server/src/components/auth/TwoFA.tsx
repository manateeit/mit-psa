import React, { useState, useRef, useEffect } from 'react';

import { LockClosedIcon } from '@radix-ui/react-icons';
import * as Dialog from '@radix-ui/react-dialog';

interface TwoFactorInputProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (code: string) => void;
}

const TwoFactorInput: React.FC<TwoFactorInputProps> = ({ isOpen, onClose, onComplete }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (isOpen) {
      inputRefs.current[0]?.focus();
      setCode(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value !== '' && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCode.every(digit => digit !== '')) {
        onComplete(newCode.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
            <div className="flex justify-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <LockClosedIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Easy peasy</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Enter 6-digit code from your two factor authenticator APP.
            </p>
            <div className="flex justify-between mb-4">
              {code.map((digit, index): JSX.Element => (
                <input
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  className={`w-10 h-12 border-2 rounded-md text-center text-xl 
                    ${index === 0 ? 'border-blue-500' : 'border-gray-300'}
                    focus:border-blue-500 focus:outline-none`}
                  value={digit}
                  onChange={e => handleChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                />
              ))}
            </div>
            <div className="text-center text-sm text-gray-500">
              {6 - code.filter(d => d !== '').length} digits left
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default TwoFactorInput;