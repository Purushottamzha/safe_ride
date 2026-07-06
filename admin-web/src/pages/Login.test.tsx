import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './Login';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    const signInElements = screen.getAllByText(/sign in/i);
    expect(signInElements.length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/email/i)).toBeDefined();
    expect(screen.getByLabelText(/password/i)).toBeDefined();
  });
});
