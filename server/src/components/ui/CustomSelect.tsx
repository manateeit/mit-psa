// components/CustomSelect.tsx
import React, { useEffect } from 'react';
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons';

interface CustomOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: CustomOption[];
  placeholder?: string;
  styles?: {
    trigger?: string;
    content?: string;
    item?: string;
    itemIndicator?: string;
  };
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onValueChange, options, styles = {}, placeholder }) => {
  const defaultStyles = {
    trigger: "inline-flex items-center justify-between rounded px-[15px] text-[13px] leading-none h-[35px] gap-[5px] bg-white text-violet11 shadow-[0_2px_10px] shadow-black/10 hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9 outline-none",
    content: "overflow-hidden bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]",
    item: "text-[13px] leading-none text-violet11 rounded-[3px] flex items-center h-[25px] pr-[35px] pl-[25px] relative select-none data-[disabled]:text-mauve8 data-[disabled]:pointer-events-none data-[highlighted]:outline-none data-[highlighted]:bg-violet9 data-[highlighted]:text-violet1",
    itemIndicator: "absolute left-0 w-[25px] inline-flex items-center justify-center",
  };

  const handleValueChange = (newValue: string) => {
    onValueChange(newValue);
  };

  return (
    <Select.Root value={value} onValueChange={handleValueChange}>
      <Select.Trigger 
        className={styles.trigger || defaultStyles.trigger}
      >
        <Select.Value placeholder={placeholder || "Select an option..."} />
        <Select.Icon className="text-violet11">
          <ChevronDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className={styles.content || defaultStyles.content}>
          <Select.Viewport className="p-[5px]">
            {options.map((option): JSX.Element => (
              <Select.Item
                key={option.value}
                value={option.value}
                className={styles.item || defaultStyles.item}
                onMouseDown={() => {
                  handleValueChange(option.value);
                }}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.itemIndicator || defaultStyles.itemIndicator}>
                  <CheckIcon />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

export default CustomSelect;

