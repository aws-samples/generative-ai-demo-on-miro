import React from 'react';

interface ButtonProps {
  buttonText: string;
  onClick: () => void; // Example of a function prop
}

const Button: React.FC<ButtonProps> = ({ buttonText, onClick }) => {
  return (
    <div className="cs1 ce12 centered">
        <button type="button" className="center cs1 ce12 button button-primary" onClick={onClick}>
            {buttonText}
        </button>
    </div>
  );
};

export  { Button };