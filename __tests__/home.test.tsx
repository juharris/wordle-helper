/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import Home from "@/pages/home/index";

describe("Home", () => {
  it("renders a heading", () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: "Wordle Helper",
    });

    expect(heading).toBeInTheDocument();
  });
});
