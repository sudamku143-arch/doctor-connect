import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { QueueCard, StatusBadge } from "@doctor-connect/ui-native";

// A representative smoke test proving the Jest + React Native Testing
// Library pipeline actually renders shared @doctor-connect/ui-native
// components correctly through this app's config — not exhaustive
// per-component coverage.

describe("@doctor-connect/ui-native smoke test (via clinic-app)", () => {
  it("renders a QueueCard's token number and patient name", () => {
    render(<QueueCard tokenNumber={12} patientName="Ramesh" />);
    expect(screen.getByText("#12")).toBeTruthy();
    expect(screen.getByText("Ramesh")).toBeTruthy();
  });

  it("renders a StatusBadge with the expected label for a known status", () => {
    render(<StatusBadge status="WAITING" />);
    expect(screen.getByText("Waiting")).toBeTruthy();
  });
});
