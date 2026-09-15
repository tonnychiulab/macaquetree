import { Component } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

class Boom extends Component {
  render(): never {
    throw new Error('welcome boom');
  }
}

describe('ErrorBoundary', () => {
  it('renders a recovery action for render errors', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    vi.stubGlobal('location', { reload });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText(/welcome boom/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /重新載入頁面/ }));
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
