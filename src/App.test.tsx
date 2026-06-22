import { describe, it, expect } from 'vitest';
import { render, screen } from '../tests/setup/test-utils';
import { App } from './App';

// The App now renders the IRMA shell (router + nav). Data comes from the mock
// provider in test mode.

describe('App — smoke tests', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('shows the IRMA brand in the header', () => {
    render(<App />);
    expect(screen.getAllByText('IRMA').length).toBeGreaterThan(0);
  });

  it('renders the primary navigation', () => {
    render(<App />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('All Incidents')).toBeTruthy();
    expect(screen.getByText('New Incident')).toBeTruthy();
  });
});
