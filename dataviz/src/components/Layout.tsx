import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useAppStore } from '../store';
import { ThemeToggle } from './index';
import styles from '../pages/Home.module.css';

const Layout: React.FC = () => {
  const { theme } = useAppStore();

  const params = useParams();
  const { chartId } = params;
  
  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.wrapper}>
        <ThemeToggle />
        
        {/* 导航栏 */}
        <nav className={`${styles.tabNavigation} ${theme === 'dark' ? styles.dark : styles.light}`}>
          <NavButton to="/dashboard" theme={theme}>
            仪表板
          </NavButton>
          <NavButton to="/import" theme={theme}>
            导入数据
          </NavButton>
          <NavButton 
            to={chartId ? `/edit/${chartId}` : "/create"} 
            theme={theme}
          >
            {chartId ? '编辑图表' : '创建图表'}
          </NavButton>
          <NavButton to="/manage" theme={theme}>
            管理仪表板
          </NavButton>
          <NavButton to="/ai" theme={theme}>
            AI分析
          </NavButton>
        </nav>
        
        {/* 内容区域 */}
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

interface NavButtonProps {
  to: string;
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

const NavButton: React.FC<NavButtonProps> = ({ to, children, theme }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        ${styles.tabButton} 
        ${isActive ? styles.active : ''} 
        ${theme === 'dark' ? styles.dark : styles.light}
      `}
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && <div className={styles.activeIndicator} />}
        </>
      )}
    </NavLink>
  );
};

export default Layout;