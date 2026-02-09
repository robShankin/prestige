/**
 * Error Boundary component - Gracefully handles and displays errors in the game.
 *
 * Catches errors in the component tree and displays a user-friendly error message
 * instead of crashing the app. Allows users to refresh or restart the game.
 */

import React, { ReactNode, ErrorInfo } from 'react';
import './ErrorBoundary.css';

/**
 * Props for ErrorBoundary component.
 *
 * @property children - Child components to wrap
 */
interface ErrorBoundaryProps {
  children: ReactNode;
}

/**
 * State for ErrorBoundary component.
 *
 * @property hasError - Whether an error was caught
 * @property error - The error object that was caught
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - React error boundary component.
 *
 * Catches errors in child components and displays a user-friendly error message.
 * Provides options to refresh the page or return to home.
 *
 * @example
 * <ErrorBoundary>
 *   <Game numberOfOpponents={2} />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * Create an ErrorBoundary component.
   *
   * @param props - ErrorBoundaryProps
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Update state when an error is caught.
   *
   * @param error - The error that was thrown
   * @returns New state with error set
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Log error details to console for debugging.
   *
   * @param error - The error that was thrown
   * @param errorInfo - Additional error context
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  /**
   * Reset error state to allow retry.
   */
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    // Refresh page to fully reset game state
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <h1>Something went wrong</h1>
            <p className="error-message">
              An unexpected error occurred. This shouldn't happen!
            </p>
            {this.state.error && (
              <details className="error-details">
                <summary>Error details</summary>
                <pre>{this.state.error.message}</pre>
              </details>
            )}
            <div className="error-actions">
              <button onClick={this.handleReset} className="button-primary">
                Refresh Game
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="button-secondary"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
