/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import Home from "@/pages/home/index";
import allValidWords from "../public/words.json";

jest.mock('next/router', () => jest.requireActual('next-router-mock'))

describe("Home", () => {
  it("renders possible solutions", () => {
    render(<Home />);

    const possibleSolutions = screen.getByText(/Possible Solutions/);

    expect(possibleSolutions).toBeInTheDocument();
  });

  it("fills in a correct-position letter while typing a guess", () => {
    const answer = allValidWords.words.find(word => word.d);
    if (!answer?.d) {
      throw new Error("Expected a dated answer in words.json.");
    }

    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${answer.d}T12:00:00`));
    try {
      render(<Home />);
      fireEvent.change(screen.getByRole("textbox", { name: "Guess word" }), {
        target: { value: answer.w[0] },
      });

      expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue(answer.w[0]);
      fireEvent.change(screen.getByRole("textbox", { name: "Guess word" }), {
        target: { value: "" },
      });
      expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue("");
    } finally {
      jest.useRealTimers();
    }
  });
});
