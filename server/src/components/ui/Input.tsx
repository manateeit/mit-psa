import React, { InputHTMLAttributes, forwardRef, useEffect, useRef, useCallback } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  preserveCursor?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, preserveCursor = true, ...props }, forwardedRef) => {
    const cursorPositionRef = useRef<number | null>(null);

    const setRef = useCallback(
      (element: HTMLInputElement | null) => {
        // Forward the ref
        if (typeof forwardedRef === 'function') {
          forwardedRef(element);
        } else if (forwardedRef) {
          forwardedRef.current = element;
        }
      },
      [forwardedRef]
    );

    useEffect(() => {
      if (preserveCursor && forwardedRef && 'current' in forwardedRef && forwardedRef.current && cursorPositionRef.current !== null) {
        forwardedRef.current.setSelectionRange(
          cursorPositionRef.current,
          cursorPositionRef.current
        );
      }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (preserveCursor) {
        cursorPositionRef.current = e.target.selectionStart;
      }
      props.onChange?.(e);
    };

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={setRef}
          className={`w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
          {...props}
          onChange={handleChange}
          onClick={(e) => {
            e.stopPropagation();
            props.onClick?.(e);
          }}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
