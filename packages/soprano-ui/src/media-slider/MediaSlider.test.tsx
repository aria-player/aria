import { render, screen } from "@testing-library/react";
import { MediaSlider } from "./MediaSlider";

const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("MediaSlider", () => {
  it("renders slider", () => {
    render(<MediaSlider />);
    const slider = screen.getByRole("slider");
    expect(slider).toBeInTheDocument();
  });
});
