import React, { useState } from 'react';
import './DraggableDivider.css';

const DraggableDivider = ({ layout, margin }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const container = document.querySelector('.draggable-divider-container');
    const containerRect = container.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const newPosition = `${(mouseX / containerWidth) * 100}%`;

    document.documentElement.style.setProperty(
      '--divider-position',
      newPosition
    );
  };

  return (
    <div
      className={`draggable-divider ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      style={{
        [layout === 'vertical' ? 'width' : 'height']: '100%',
        [layout === 'vertical' ? 'marginRight' : 'marginBottom']: margin,
      }}
    ></div>
  );
};

export default DraggableDivider;
