import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import React from 'react';
import App from '../src/App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen).toBeDefined();
  });
});
