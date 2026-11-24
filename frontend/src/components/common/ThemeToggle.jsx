import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle = ({ showLabels = false }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-[#FFFDFB] dark:bg-[#2E2622] p-1 rounded-xl border border-[#E7DAD1] dark:border-[#443730] select-none shadow-xs">
      <button
        onClick={() => toggleTheme('light')}
        title="Warm Cream Light theme"
        className={`p-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-[#F8E6DF] text-[#A85138] shadow-xs'
            : 'text-[#99877D] hover:text-[#241D19]'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-[#EA7957]" />
        {showLabels && <span>Light</span>}
      </button>

      <button
        onClick={() => toggleTheme('dark')}
        title="Espresso Dark theme"
        className={`p-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-[#35271F] text-white shadow-xs'
            : 'text-[#99877D] hover:text-[#241D19] dark:hover:text-[#FBF8F5]'
        }`}
      >
        <Moon className="w-3.5 h-3.5" />
        {showLabels && <span>Dark</span>}
      </button>

      <button
        onClick={() => toggleTheme('system')}
        title="System Auto preference"
        className={`p-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          theme === 'system'
            ? 'bg-[#EAF1E5] text-[#2E5A36] shadow-xs'
            : 'text-[#99877D] hover:text-[#241D19] dark:hover:text-[#FBF8F5]'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        {showLabels && <span>Auto</span>}
      </button>
    </div>
  );
};
