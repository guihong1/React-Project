import React from 'react';
import { useAppStore } from '../store';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '10px 15px',
        border: 'none',
        borderRadius: '20px',
        backgroundColor: theme === 'dark' ? '#4a4a4a' : '#e0e0e0',
        color: theme === 'dark' ? '#fff' : '#333',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        transition: 'all 0.3s ease',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {theme === 'light' ? '🌙 暗色' : '☀️ 亮色'}
    </button>
  );
};

export default ThemeToggle;