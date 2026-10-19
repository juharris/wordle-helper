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

  it("shows full Wordle feedback while typing a guess and clears the preview", () => {
    const answer = allValidWords.words.find(word => word.d);
    if (!answer?.d) {
      throw new Error("Expected a dated answer in words.json.");
    }

    jest.useFakeTimers();
    jest.setSystemTime(new Date(`${answer.d}T12:00:00`));
    try {
      render(<Home />);
      const guessInput = screen.getByRole("textbox", { name: "Guess word" });
      const outsideLetter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").find(letter => !answer.w.includes(letter));
      const misplacedIndex = answer.w.split("").findIndex(letter => letter !== answer.w[0]);
      if (!outsideLetter || misplacedIndex < 0) {
        throw new Error("Expected the answer to contain distinct letters and leave at least one unused letter.");
      }

      const mixedGuess = Array(5).fill(outsideLetter);
      mixedGuess[0] = answer.w[misplacedIndex];
      fireEvent.change(guessInput, { target: { value: mixedGuess.join("") } });

      expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Hint for letter 1" })).toHaveValue(answer.w[misplacedIndex]);
      expect(screen.getByRole("textbox", { name: "banned letters" })).toHaveValue(outsideLetter);

      fireEvent.change(guessInput, { target: { value: answer.w } });
      expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue(answer.w[0]);
      expect(screen.getByRole("textbox", { name: "Answer for letter 5" })).toHaveValue(answer.w[4]);

      fireEvent.change(guessInput, { target: { value: "" } });
      expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "Hint for letter 1" })).toHaveValue("");
      expect(screen.getByRole("textbox", { name: "banned letters" })).toHaveValue("");
    } finally {
      jest.useRealTimers();
    }
  });
});
