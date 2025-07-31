import React, { useState } from 'react';
import { 
  Dashboard, 
  ThemeToggle, 
  DataImport, 
  ChartEditor, 
  DashboardManager,
  AIAnalysis
} from '../components';
import { useAppStore } from '../store';
import styles from './Home.module.css';

export const Home: React.FC = () => {
  const { theme } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'import' | 'create' | 'manage' | 'ai'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);

  const handleTabChange = (tab: 'dashboard' | 'import' | 'create' | 'manage' | 'ai') => {
    setActiveTab(tab);
    // 如果切换到其他标签，取消编辑状态
    if (tab !== 'create') {
      setIsEditing(false);
      setEditingChartId(null);
    }
  };

  const handleEditChart = (chartId: string) => {
    setEditingChartId(chartId);
    setIsEditing(true);
    setActiveTab('create');
  };

  const handleImportSuccess = () => {
    // 导入成功后切换到创建图表标签
    setActiveTab('create');
  };

  const handleSaveChart = () => {
    // 保存图表后切换到仪表板标签
    setActiveTab('dashboard');
    setIsEditing(false);
    setEditingChartId(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingChartId(null);
  };

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      <div className={styles.wrapper}>
        <ThemeToggle />
        
        {/* 标签导航 */}
        <div className={`${styles.tabNavigation} ${theme === 'dark' ? styles.dark : styles.light}`}>
          <TabButton 
            active={activeTab === 'dashboard'} 
            onClick={() => handleTabChange('dashboard')}
            theme={theme}
          >
            仪表板
          </TabButton>
          <TabButton 
            active={activeTab === 'import'} 
            onClick={() => handleTabChange('import')}
            theme={theme}
          >
            导入数据
          </TabButton>
          <TabButton 
            active={activeTab === 'create'} 
            onClick={() => handleTabChange('create')}
            theme={theme}
          >
            {isEditing ? '编辑图表' : '创建图表'}
          </TabButton>
          <TabButton 
            active={activeTab === 'manage'} 
            onClick={() => handleTabChange('manage')}
            theme={theme}
          >
            管理仪表板
          </TabButton>
          <TabButton 
            active={activeTab === 'ai'} 
            onClick={() => handleTabChange('ai')}
            theme={theme}
          >
            AI分析
          </TabButton>
        </div>
        
        {/* 内容区域 */}
        <div>
          {activeTab === 'dashboard' && <Dashboard onEditChart={handleEditChart} />}
          {activeTab === 'import' && <DataImport onImportSuccess={handleImportSuccess} />}
          {activeTab === 'create' && (
            <ChartEditor 
              chartId={editingChartId || undefined} 
              onSave={handleSaveChart}
              onCancel={isEditing ? handleCancelEdit : undefined}
            />
          )}
          {activeTab === 'manage' && (
            <DashboardManager 
              onClose={() => handleTabChange('dashboard')}
            />
          )}
          {activeTab === 'ai' && (
            <AIAnalysis />
          )}
        </div>
      </div>
    </div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children, theme }) => {
  return (
    <button
      onClick={onClick}
      className={`
        ${styles.tabButton} 
        ${active ? styles.active : ''} 
        ${theme === 'dark' ? styles.dark : styles.light}
      `}
    >
      {children}
      {active && <div className={styles.activeIndicator} />}
    </button>
  );
};

export default Home;