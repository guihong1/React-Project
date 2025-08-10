import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../components/MainLayout';
import HomePage from '../components/HomePage';
import { 
  Dashboard, 
  ChartEditor, 
  DataImport, 
  EnhancedDataImport,
  DashboardManager,
  AIAnalysis,
  NotFound 
} from '../components';
import { AIConfig } from '../pages';
import ChartCreator from '../components/ChartCreator';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/home" replace />
      },
      {
        path: 'home',
        element: <HomePage />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'import',
        element: <EnhancedDataImport />
      },
      {
        path: 'create',
        element: <ChartCreator />
      },
      {
        path: 'edit/:chartId',
        element: <ChartCreator />
      },
      {
        path: 'manage',
        element: <DashboardManager />
      },
      {
        path: 'ai',
        element: <AIAnalysis />
      },
      {
        path: 'ai-config',
        element: <AIConfig />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;