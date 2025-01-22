import React from 'react';

interface LogoProps {
  src: string;
  alt: string;
}

const Logo: React.FC<LogoProps> = ({ src, alt }) => {
  return (
    <div className="cs1 ce12">
        <img src={src} alt={src} />
    </div>
  );
};

export { Logo };