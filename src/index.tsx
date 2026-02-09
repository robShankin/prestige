import React from 'react';
import ReactDOM from 'react-dom/client';
import { Game } from '@components/Game';
import { ErrorBoundary } from '@components/ErrorBoundary';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Game numberOfOpponents={2} />
    </ErrorBoundary>
  </React.StrictMode>
);
