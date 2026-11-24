import React from 'react';

export const ModularGrid = () => {
  return (
    <div
      className="tesser-grid-overlay pointer-events-none select-none"
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, index) => (
        <div key={index} className="tesser-grid-col" />
      ))}
    </div>
  );
};
