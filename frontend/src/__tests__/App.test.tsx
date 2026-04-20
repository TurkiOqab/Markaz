import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders the Arabic greeting', () => {
    render(<App />);
    expect(screen.getByText('مرحباً بك في مركز')).toBeInTheDocument();
  });

  it('renders inside an RTL document', () => {
    render(<App />);
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });
});
