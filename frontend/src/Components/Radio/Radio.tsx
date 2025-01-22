import React from 'react';

interface RadioProps {
    options: { value: string; label: string }[];
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
}

const Radio: React.FC<RadioProps> = ({ options, onChange, value }) => {
    const [selectedValue, setSelectedValue] = React.useState<string>(value || '');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedValue(event.target.value);
        if (onChange) {
            onChange(event);
        }
    };

    return (
        <div className="cs1 ce12">
            <div className="form-group">
                {options.map((option) => (
                    <label key={option.value} className="radiobutton">
                        <input
                            type="radio"
                            value={option.value}
                            checked={selectedValue === option.value}
                            onChange={handleChange}
                        />
                        <span>{option.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export { Radio };