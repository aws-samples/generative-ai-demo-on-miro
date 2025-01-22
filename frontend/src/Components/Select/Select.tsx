import React from 'react';

interface SelectProps {
    id: string;
    label: string;
    options: { value: string; label: string }[];
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    value?: string;
}

const Select: React.FC<SelectProps> = ({ id, label, options, onChange, value}) => {
  return (
    <div className="cs1 ce12">
        <div className="form-group">
        <label htmlFor={id}>{label}</label>
        <select 
            className="select" 
            id={id}
            value={value}
            onChange={onChange}
        > 
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
        </div>
    </div>
  );
};

export { Select };