import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CategoryButtonProps {
  label: string;
  icon?: LucideIcon;
  isActive?: boolean;
  isFocused?: boolean;
  count?: number;
  onClick?: () => void;
}

export const CategoryButton: React.FC<CategoryButtonProps> = ({
  label,
  icon: Icon,
  isActive = false,
  isFocused = false,
  count,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 border select-none ${
        isFocused
          ? 'bg-[#6A00FF] text-white border-white shadow-[0_0_20px_rgba(106,0,255,0.8)] scale-105 z-10'
          : isActive
          ? 'bg-[#000000] text-gray-300 border-white/10'
          : 'bg-[#000000] text-gray-400 border-white/5 hover:bg-[#000000] hover:text-white'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {Icon && <Icon size={15} className={isFocused ? 'text-white' : isActive ? 'text-gray-300' : 'text-gray-400'} />}
        <span className="truncate">{label}</span>
      </div>

      {count !== undefined && (
        <span
          className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
            isFocused
              ? 'bg-white/20 text-white'
              : 'bg-white/5 text-gray-400'
          }`}
        >
          {count}
        </span>
      )}
    </div>
  );
};
