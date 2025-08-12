import React, { useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import styles from '../DataImport.module.css';
import { useAppStore } from '../../store';

interface VirtualizedTableProps {
  data: Record<string, unknown>[];
  height?: number;
  itemHeight?: number;
  className?: string;
  showOutliers?: boolean;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  height = 400,
  itemHeight = 35,
  className = '',
  showOutliers = false,
}) => {
  const { theme } = useAppStore();
  const [columns, setColumns] = useState<string[]>([]);

  useEffect(() => {
    if (data && data.length > 0) {
      // 获取数据的所有列名
      setColumns(Object.keys(data[0]).filter(key => key !== 'outlier'));
    }
  }, [data]);

  if (!data || data.length === 0) {
    return <div className={styles.noDataMessage}>无数据可显示</div>;
  }

  // 表头渲染
  const TableHeader = () => (
    <div className={styles.virtualTableHeader}>
      <table className={`${styles.dataTable} ${styles[theme]}`}>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column} className={styles.tableHeader}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
      </table>
    </div>
  );

  // 行渲染函数
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    const isOutlier = showOutliers && item.outlier?.isOutlier;

    return (
      <div 
        style={style} 
        className={`${styles.virtualTableRow} ${isOutlier ? styles.outlierRow : ''}`}
      >
        <div className={styles.virtualTableRowInner}>
          {columns.map((column, colIndex) => (
            <div 
              key={`${index}-${colIndex}`} 
              className={`${styles.virtualTableCell} ${isOutlier ? styles.outlierCell : ''}`}
              title={isOutlier ? item.outlier?.reason || '异常值' : ''}
            >
              {String(item[column])}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.virtualTableContainer} ${className}`}>
      <TableHeader />
      <List
        className={styles.virtualList}
        height={height}
        itemCount={data.length}
        itemSize={itemHeight}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
      <div className={styles.tableFooter}>
        共 {data.length} 条数据
      </div>
    </div>
  );
};

export default VirtualizedTable;