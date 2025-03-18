import React from 'react';

interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className = '' }) => {
  return (
    <div className={`loading-dots ${className}`}>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}; 