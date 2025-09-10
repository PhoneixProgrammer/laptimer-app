import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import LapTimer from "./components/LapTimer";

describe("LapTimer Component", () => {
  test("records a single lap and displays it correctly", () => {
    render(<LapTimer />);

    // Start timer
    fireEvent.click(screen.getByText("START"));
    
    // Record a lap
    fireEvent.click(screen.getByText("LAP"));

    // Find table and first row
    const table = screen.getByRole("table");
    const tbody = table.querySelector("tbody");
    const firstRowCells = tbody.querySelectorAll("td");

    // Check lap number and time
    expect(firstRowCells[0].textContent).toBe("1");
    expect(firstRowCells[1].textContent).toBe("00:00.0");

    // Status can be "", ON, FAST, SLOW depending on goalTime
    expect(["", "ON", "FAST", "SLOW"]).toContain(firstRowCells[4].textContent);
  });

  test("records multiple laps correctly", () => {
    render(<LapTimer />);

    fireEvent.click(screen.getByText("START"));

    // Record 3 laps
    fireEvent.click(screen.getByText("LAP"));
    fireEvent.click(screen.getByText("LAP"));
    fireEvent.click(screen.getByText("LAP"));

    const table = screen.getByRole("table");
    const tbody = table.querySelector("tbody");
    const rows = tbody.querySelectorAll("tr");

    expect(rows.length).toBe(3); // 3 laps

    // Check first and last lap numbers
    expect(rows[0].querySelectorAll("td")[0].textContent).toBe("1");
    expect(rows[2].querySelectorAll("td")[0].textContent).toBe("3");
  });

  test("RESET clears the laps table", () => {
    render(<LapTimer />);

    fireEvent.click(screen.getByText("START"));
    fireEvent.click(screen.getByText("LAP"));

    let table = screen.getByRole("table");
    let tbody = table.querySelector("tbody");
    expect(tbody.querySelectorAll("tr").length).toBe(1);

    // Click RESET
    fireEvent.click(screen.getByText("RESET"));

    table = screen.getByRole("table");
    tbody = table.querySelector("tbody");
    expect(tbody.querySelectorAll("tr").length).toBe(0);
  });

  test("goal time affects lap status", () => {
    render(<LapTimer />);

    // Set goal time to 1 second
    fireEvent.change(screen.getByLabelText(/Goal \(s\)/i), {
      target: { value: 1 },
    });

    fireEvent.click(screen.getByText("START"));
    fireEvent.click(screen.getByText("LAP"));

    const table = screen.getByRole("table");
    const firstRowCells = table.querySelector("tbody").querySelectorAll("td");

    // Status should be "FAST" because lap < 1s
    expect(firstRowCells[4].textContent).toBe("FAST");
  });

  test("EXPORT CSV button is disabled with no laps, enabled after a lap", () => {
    render(<LapTimer />);

    const exportBtn = screen.getByText("EXPORT CSV");
    expect(exportBtn).toBeDisabled();

    fireEvent.click(screen.getByText("START"));
    fireEvent.click(screen.getByText("LAP"));

    expect(screen.getByText("EXPORT CSV")).not.toBeDisabled();
  });

  test("SAVE SESSION button is disabled with no laps, enabled after a lap", () => {
    render(<LapTimer />);

    const saveBtn = screen.getByText("SAVE SESSION");
    expect(saveBtn).toBeDisabled();

    fireEvent.click(screen.getByText("START"));
    fireEvent.click(screen.getByText("LAP"));

    expect(screen.getByText("SAVE SESSION")).not.toBeDisabled();
  });
});
