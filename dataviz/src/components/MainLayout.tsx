import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import { ThemeToggle } from './index';
import type { ChartType } from '../types';
import styles from './MainLayout.module.css';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const MainLayout: React.FC = () => {
  const { theme, charts } = useAppStore();
  const location = useLocation();

  const navigationItems: NavigationItem[] = [
    {
      path: '/',
      label: '首页',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/dashboard',
      label: '仪表板',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/ai',
      label: 'AI数据分析',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/ai-config',
      label: 'AI配置',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/import',
      label: '数据导入',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor" />
        </svg>
      )
    },
    {
      path: '/manage',
      label: '管理中心',
      icon: (
        <svg viewBox="0 0 24 24" className={styles.navIcon}>
          <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" fill="currentColor" />
        </svg>
      )
    }
  ];

  const isChartEditorPage = location.pathname.includes('/create') || location.pathname.includes('/edit');

  return (
    <div className={`${styles.layout} ${theme === 'dark' ? styles.dark : styles.light}`}>
      {/* 左侧导航栏 */}
      <nav className={`${styles.sidebar} ${theme === 'dark' ? styles.dark : styles.light}`}>
        <div className={styles.logo}>
          <h2>DataViz</h2>
        </div>
        
        <div className={styles.navItems}>
          {navigationItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `${styles.navItem} ${
                  isActive ? styles.active : ''
                } ${theme === 'dark' ? styles.dark : styles.light}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        
        <div className={styles.themeToggleContainer}>
          <ThemeToggle />
        </div>
      </nav>

      {/* 图表切换面板已移除 */}

      {/* 主内容区域 */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;