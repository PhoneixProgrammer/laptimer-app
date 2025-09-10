import { render } from "@testing-library/react";
import LapTimer from "./components/LapTimer"; // adjust path

test("renders LapTimer component without crashing", () => {
  render(<LapTimer />);
});
