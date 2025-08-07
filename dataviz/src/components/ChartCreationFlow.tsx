import React, { useState } from 'react';
import { ChartTypeSelector } from './ChartTypeSelector';
import DataImport from './DataImport';
import { ChartEditor } from './ChartEditor';
import { useAppStore } from '../store';
import type { ChartType } from '../types';
import styles from './ChartCreationFlow.module.css';

interface ChartCreationFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type FlowStep = 'select-type' | 'import-data' | 'edit-chart';

export const ChartCreationFlow: React.FC<ChartCreationFlowProps> = ({ onComplete, onCancel }) => {
  const { theme } = useAppStore();
  const [currentStep, setCurrentStep] = useState<FlowStep>('select-type');
  const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null);
  const [hasImportedData, setHasImportedData] = useState(false);

  const handleSelectChartType = (chartType: ChartType) => {
    setSelectedChartType(chartType);
    setCurrentStep('import-data');
  };

  const handleImportSuccess = () => {
    setHasImportedData(true);
    setCurrentStep('edit-chart');
  };

  const handleSkipImport = () => {
    setCurrentStep('edit-chart');
  };

  const handleSaveChart = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep === 'import-data') {
      setCurrentStep('select-type');
      setSelectedChartType(null);
    } else if (currentStep === 'edit-chart') {
      setCurrentStep('import-data');
    }
  };

  const steps = [
    { key: 'select-type', label: '选择图表类型', completed: selectedChartType !== null },
    { key: 'import-data', label: '导入数据', completed: hasImportedData },
    { key: 'edit-chart', label: '编辑图表', completed: false }
  ];

  return (
    <div className={`${styles.container} ${theme === 'dark' ? styles.dark : styles.light}`}>
      {/* 步骤指示器 */}
      <div className={styles.stepIndicator}>
        {steps.map((step, index) => (
          <div key={step.key} className={styles.stepItem}>
            <div className={`
              ${styles.stepCircle} 
              ${currentStep === step.key ? styles.active : ''}
              ${step.completed ? styles.completed : ''}
              ${theme === 'dark' ? styles.dark : styles.light}
            `}>
              {step.completed ? '✓' : index + 1}
            </div>
            <span className={`
              ${styles.stepLabel}
              ${currentStep === step.key ? styles.active : ''}
            `}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className={`
                ${styles.stepConnector}
                ${step.completed ? styles.completed : ''}
              `} />
            )}
          </div>
        ))}
      </div>

      {/* 导航按钮 */}
      <div className={styles.navigation}>
        {currentStep !== 'select-type' && (
          <button 
            className={`${styles.navButton} ${styles.backButton} ${theme === 'dark' ? styles.dark : styles.light}`}
            onClick={handleBack}
          >
            ← 上一步
          </button>
        )}
        
        {onCancel && (
          <button 
            className={`${styles.navButton} ${styles.cancelButton} ${theme === 'dark' ? styles.dark : styles.light}`}
            onClick={onCancel}
          >
            取消
          </button>
        )}
      </div>

      {/* 步骤内容 */}
      <div className={styles.stepContent}>
        {currentStep === 'select-type' && (
          <ChartTypeSelector onSelectChartType={handleSelectChartType} />
        )}
        
        {currentStep === 'import-data' && (
          <div className={styles.importStep}>
            <div className={styles.stepHeader}>
              <h2>导入数据</h2>
              <p>为您的{selectedChartType === 'bar' ? '柱状图' : 
                       selectedChartType === 'line' ? '折线图' : 
                       selectedChartType === 'pie' ? '饼图' : 
                       selectedChartType === 'scatter' ? '散点图' : 
                       selectedChartType === 'radar' ? '雷达图' : '图表'}导入数据</p>
            </div>
            
            <DataImport onImportSuccess={handleImportSuccess} />
            
            <div className={styles.skipOption}>
              <button 
                className={`${styles.skipButton} ${theme === 'dark' ? styles.dark : styles.light}`}
                onClick={handleSkipImport}
              >
                跳过导入，使用示例数据
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 'edit-chart' && selectedChartType && (
          <div className={styles.editStep}>
            <div className={styles.stepHeader}>
              <h2>编辑图表</h2>
              <p>自定义您的图表样式和配置</p>
            </div>
            
            <ChartEditor 
              initialChartType={selectedChartType}
              onSave={handleSaveChart}
              onCancel={onCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCreationFlow;