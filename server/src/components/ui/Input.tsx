import React, { InputHTMLAttributes, forwardRef, useEffect, useRef, useCallback, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  preserveCursor?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, className, preserveCursor = true, ...props }, forwardedRef) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const cursorPositionRef = useRef<number | null>(null);
    const isComposing = useRef(false);

    const handleRef = useCallback(
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isComposing.current && preserveCursor) {
        cursorPositionRef.current = e.target.selectionStart;
      }
      props.onChange?.(e);
    };

    // Restore cursor position after value changes
    useEffect(() => {
      if (
        preserveCursor &&
        !isComposing.current &&
        cursorPositionRef.current !== null &&
        inputRef.current &&
        document.activeElement === inputRef.current
      ) {
        const pos = cursorPositionRef.current;
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(pos, pos);
          }
        });
      }
    }, [props.value, preserveCursor]);

    const handleCompositionStart = () => {
      isComposing.current = true;
    };

    const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposing.current = false;
      if (preserveCursor) {
        const input = e.target as HTMLInputElement;
        cursorPositionRef.current = input.selectionStart;
      }
    };

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={(element) => {
            inputRef.current = element;
            handleRef(element);
          }}
          className={`w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${className}`}
          {...props}
          onChange={handleChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onClick={(e) => {
            props.onClick?.(e);
          }}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';
