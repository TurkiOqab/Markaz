import { afterEach, describe, expect, it } from "vitest";
import {
  RABEA_USERNAME,
  RABEA_PASSWORD,
  isRabeaMode,
  setRabeaMode,
} from "../rabeaSession";

describe("rabeaSession", () => {
  afterEach(() => {
    setRabeaMode(false);
  });

  it("exposes the fixed REB9 credentials", () => {
    expect(RABEA_USERNAME).toBe("REB9");
    expect(RABEA_PASSWORD).toBe("1234567891");
  });

  it("defaults to not-in-rabea-mode", () => {
    expect(isRabeaMode()).toBe(false);
  });

  it("round-trips the rabea flag", () => {
    setRabeaMode(true);
    expect(isRabeaMode()).toBe(true);
    setRabeaMode(false);
    expect(isRabeaMode()).toBe(false);
  });
});
