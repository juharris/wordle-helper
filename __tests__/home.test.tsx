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
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const answer = allValidWords.words.find(word => word.d === dateString)?.w;
    expect(answer).toBeDefined();

    render(<Home />);
    fireEvent.change(screen.getByRole("textbox", { name: "Guess word" }), {
      target: { value: answer?.[0] },
    });

    expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue(answer?.[0]);
    fireEvent.change(screen.getByRole("textbox", { name: "Guess word" }), {
      target: { value: "" },
    });
    expect(screen.getByRole("textbox", { name: "Answer for letter 1" })).toHaveValue("");
  });
});
