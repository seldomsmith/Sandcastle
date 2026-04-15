import React, { useState, useRef, useEffect } from 'react';
import './FloatingMenu.css';

interface FloatingMenuProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ title, isOpen, onClose, children, defaultPosition = { x: 50, y: 50 } }) => {
  const [position, setPosition] = useState(defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initX + dx,
        y: dragRef.current.initY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div 
      className="floating-menu"
      style={{ left: position.x, top: position.y }}
    >
      <div 
        className="floating-menu-header"
        onMouseDown={(e) => {
          setIsDragging(true);
          dragRef.current = { startX: e.clientX, startY: e.clientY, initX: position.x, initY: position.y };
        }}
      >
        <span className="title">{title}</span>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      <div className="floating-menu-content">
        {children}
      </div>
    </div>
  );
};

export default FloatingMenu;
