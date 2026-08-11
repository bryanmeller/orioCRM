import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MenuItemProps {
  label: string;
  icon: LucideIcon;
  isActive?: boolean;
  isFocused?: boolean;
  badge?: string;
  onClick?: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  label,
  icon: Icon,
  isActive = false,
  isFocused = false,
  badge,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex items-center gap-3 border select-none group text-left ${
        isFocused
          ? 'bg-[#6A00FF] text-white border-white shadow-[0_0_20px_rgba(106,0,255,0.7)] scale-105 z-20'
          : isActive
          ? 'bg-[#181818] text-white border-white/20'
          : 'bg-transparent text-gray-400 border-transparent hover:bg-[#121212] hover:text-white'
      }`}
    >
      <Icon
        size={18}
        className={`shrink-0 transition-colors ${
          isFocused ? 'text-white' : isActive ? 'text-[#9C4DFF]' : 'text-gray-400 group-hover:text-white'
        }`}
      />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
          {badge}
        </span>
      )}
    </button>
  );
};
