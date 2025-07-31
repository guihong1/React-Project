import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Dashboard, 
  ChartEditor, 
  DataImport, 
  DashboardManager,
  AIAnalysis,
  NotFound 
} from '../components';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'import',
        element: <DataImport />
      },
      {
        path: 'create',
        element: <ChartEditor />
      },
      {
        path: 'edit/:chartId',
        element: <ChartEditor />
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
        path: '*',
        element: <NotFound />
      }
    ]
  }
]);

export default router;