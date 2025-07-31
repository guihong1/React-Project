import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import './NotFound.css';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppStore();

  return (
    <div className={`not-found-container ${theme}`}>
      <div className="not-found-content">
        <h1>404</h1>
        <h2>页面未找到</h2>
        <p>抱歉，您访问的页面不存在或已被移除。</p>
        <div className="not-found-actions">
          <button 
            className="primary-button" 
            onClick={() => navigate(-1)}
          >
            返回上一页
          </button>
          <button 
            className="secondary-button" 
            onClick={() => navigate('/')}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;