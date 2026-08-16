'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableCollectionButtonProps {
  id: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

/** Collection button that doubles as a drag-and-drop target. */
export const DroppableCollectionButton = ({
  id,
  isActive,
  onClick,
  children,
  className = '',
}: DroppableCollectionButtonProps) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`${className} relative transition-all cursor-pointer ${
        isOver ? 'ring-4 ring-comet-accent ring-offset-2 scale-105 bg-comet-accent/8' : ''
      }`}
    >
      {children}
    </button>
  );
};
