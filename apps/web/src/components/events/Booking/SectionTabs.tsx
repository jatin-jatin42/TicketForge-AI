import React from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  name: string;
  capacity?: number;
}

interface SectionTabsProps {
  sections: Section[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({ sections, activeSectionId, onSelect }) => {
  if (!sections?.length) return null;

  return (
    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 border-b border-gray-800 scrollbar-hide">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section.id)}
          className={cn(
            "px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border",
            activeSectionId === section.id
              ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(19,127,236,0.3)]"
              : "bg-surface-dark text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-200"
          )}
        >
          {section.name}
        </button>
      ))}
    </div>
  );
};