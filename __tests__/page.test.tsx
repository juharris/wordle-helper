/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Page from '../app/page';

jest.mock('next/router', () => jest.requireActual('next-router-mock'))

it("App Router: Works with Server Components", () => {
  render(<Page />);
  expect(screen.getByRole('heading')).toHaveTextContent('App Router');
});
