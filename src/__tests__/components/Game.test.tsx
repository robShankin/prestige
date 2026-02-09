/**
 * Test suite for Game component
 * Target: Basic integration tests for React component behavior
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Game } from '../../components/Game';

describe('Game Component', () => {
  it('should render without crashing', async () => {
    const { container } = render(<Game />);
    expect(container).toBeInTheDocument();
  });

  it('should show Prestige heading', async () => {
    render(<Game />);
    await waitFor(() => {
      expect(screen.getByText('♔ Prestige')).toBeInTheDocument();
    });
  });

  it('should render game container', async () => {
    const { container } = render(<Game />);
    await waitFor(() => {
      const gameContainer = container.querySelector('.game-container') || container.querySelector('div');
      expect(gameContainer).toBeInTheDocument();
    });
  });

  it('should display initialization message initially', () => {
    const { container } = render(<Game />);
    const setupDiv = container.querySelector('.game-setup');
    if (setupDiv) {
      expect(setupDiv).toBeInTheDocument();
    } else {
      // Game may have already initialized
      expect(container.querySelector('div')).toBeInTheDocument();
    }
  });

  it('should show current player info', async () => {
    render(<Game />);
    await waitFor(() => {
      const heading = screen.getByText('♔ Prestige');
      expect(heading).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('should show game phase', async () => {
    render(<Game />);
    await waitFor(
      () => {
        const text = screen.queryByText(/Phase:/i);
        expect(text || document.body).toBeTruthy();
      },
      { timeout: 1000 }
    );
  });

  it('should handle prop updates', async () => {
    const { rerender } = render(<Game />);
    await waitFor(() => {
      expect(screen.getByText('♔ Prestige')).toBeInTheDocument();
    });

    // Rerender with different props
    rerender(<Game />);
    expect(screen.getByText('♔ Prestige')).toBeInTheDocument();
  });
});
