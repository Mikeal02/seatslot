import { describe, it, expect } from "vitest";
import { buildCatalogue, formatRuntime, toMovieView } from "../movie";
import type { Movie } from "@/types/database";

const base: Movie = {
  id: "1",
  title: "Test",
  description: null,
  poster_url: null,
  backdrop_url: null,
  duration_minutes: 134,
  rating: 7.85,
  genre: ["Drama"],
  cast_members: [],
  director: null,
  release_date: null,
  status: "now_showing",
  created_at: "",
  updated_at: "",
};

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

describe("movie model", () => {
  it("formats runtime", () => {
    expect(formatRuntime(134)).toBe("2h 14m");
    expect(formatRuntime(60)).toBe("1h");
    expect(formatRuntime(45)).toBe("45m");
    expect(formatRuntime(0)).toBe("—");
  });

  it("derives release flags and labels", () => {
    const fresh = toMovieView({ ...base, release_date: daysAgo(5) });
    expect(fresh.isReleased).toBe(true);
    expect(fresh.isNewRelease).toBe(true);
    expect(fresh.ratingLabel).toBe("7.9");
    expect(fresh.runtimeLabel).toBe("2h 14m");
    expect(fresh.primaryGenre).toBe("Drama");

    const old = toMovieView({ ...base, release_date: daysAgo(400) });
    expect(old.isNewRelease).toBe(false);
    expect(old.isRecent).toBe(false);
  });

  it("splits the catalogue and ranks recent titles first", () => {
    const soon = { ...base, id: "2", release_date: daysAgo(-10) };
    const recent = { ...base, id: "3", release_date: daysAgo(3) };
    const old = { ...base, id: "4", release_date: daysAgo(900), popularity: 99 };

    const cat = buildCatalogue([old, soon, recent]);
    expect(cat.comingSoon.map((m) => m.id)).toEqual(["2"]);
    expect(cat.nowShowing[0].id).toBe("3");
    expect(cat.genres).toEqual(["Drama"]);
  });
});
