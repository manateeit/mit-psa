import React, { forwardRef, useLayoutEffect, useEffect, useRef } from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, onChange, className, value = '', ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const combinedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const adjustHeight = (element: HTMLTextAreaElement) => {
      // Temporarily collapse to get the minimum height
      element.style.height = 'auto';
      
      // Get the computed line height to ensure proper minimum height
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = parseInt(computedStyle.lineHeight);
      
      // Calculate height based on content
      const newHeight = Math.max(
        element.scrollHeight,
        lineHeight * 1.5 // Minimum height of ~1.5 lines
      );
      
      // Set the new height
      element.style.height = `${newHeight}px`;
    };

    // Initial setup and content-based adjustment
    useEffect(() => {
      if (textareaRef.current) {
        const element = textareaRef.current;
        
        // Ensure proper initial display
        element.style.height = 'auto';
        element.style.overflow = 'hidden';
        
        // Force a reflow and adjust height
        void element.offsetHeight;
        adjustHeight(element);
      }
    }, []);

    // Handle value changes
    useLayoutEffect(() => {
      if (textareaRef.current) {
        adjustHeight(textareaRef.current);
      }
    }, [value]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (textareaRef.current) {
        adjustHeight(textareaRef.current);
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={combinedRef}
          rows={1}
          className={`
            w-full max-w-4xl
            px-3 
            py-2 
            border 
            border-gray-200 
            rounded-md 
            shadow-sm 
            focus:outline-none 
            focus:ring-2 
            focus:ring-purple-500 
            focus:border-transparent 
            resize-none 
            overflow-hidden 
            whitespace-pre-wrap break-words
            ${className}
          `}
          onChange={handleInput}
          value={value}
          {...props}
        />
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
