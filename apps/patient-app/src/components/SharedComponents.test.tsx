import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { PrimaryButton, StatusBadge } from "@doctor-connect/ui-native";

// A representative smoke test proving the Jest + React Native Testing
// Library pipeline actually renders a shared @doctor-connect/ui-native
// component correctly through this app's config — not exhaustive
// per-component coverage.

describe("@doctor-connect/ui-native smoke test (via patient-app)", () => {
  it("renders PrimaryButton's label and calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<PrimaryButton label="Book Appointment" onPress={onPress} />);

    const button = screen.getByText("Book Appointment");
    expect(button).toBeTruthy();

    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("renders a StatusBadge with the expected label for a known status", () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });
});
