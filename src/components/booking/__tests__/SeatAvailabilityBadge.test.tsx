import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { SeatAvailabilityBadge } from "@/components/booking/SeatAvailabilityBadge";
import { renderWithProviders } from "@/test/utils";

const counts: Record<string, number> = { seats: 100, booked: 0 };

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => ({
    select: () => ({
      eq: () => Promise.resolve({ count: table === "seats" ? counts.seats : counts.booked }),
    }),
  });
  return { supabase: { from: (table: string) => builder(table) } };
});

const renderBadge = () =>
  renderWithProviders(<SeatAvailabilityBadge showtimeId="show-1" screenId="screen-1" />);


beforeEach(() => {
  counts.seats = 100;
  counts.booked = 0;
});

describe("SeatAvailabilityBadge (integration with data layer)", () => {
  it("renders remaining/total seats once availability loads", async () => {
    counts.booked = 40;
    renderBadge();
    expect(await screen.findByText("60/100")).toBeInTheDocument();
  });

  it("shows Sold Out when every seat is booked", async () => {
    counts.booked = 100;
    renderBadge();
    expect(await screen.findByText("Sold Out")).toBeInTheDocument();
  });

  it("flags low availability with the destructive style", async () => {
    counts.booked = 90;
    renderBadge();
    const badge = await screen.findByText(/10\/100/);
    await waitFor(() => expect(badge.className).toContain("text-destructive"));
  });

  it("treats a screen with no configured seats as sold out", async () => {
    counts.seats = 0;
    renderBadge();
    expect(await screen.findByText("Sold Out")).toBeInTheDocument();
  });
});
