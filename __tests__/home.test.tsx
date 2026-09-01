/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Home from "@/pages/home/index";

jest.mock('next/router', () => jest.requireActual('next-router-mock'))

describe("Home", () => {
  it("renders possible solutions", () => {
    render(<Home />);

    const possibleSolutions = screen.getByText(/Possible Solutions/);

    expect(possibleSolutions).toBeInTheDocument();
  });
});
