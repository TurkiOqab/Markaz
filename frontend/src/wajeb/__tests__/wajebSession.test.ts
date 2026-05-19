import { afterEach, describe, expect, it } from "vitest";
import {
  WAJEB_USERNAME,
  WAJEB_PASSWORD,
  isWajebMode,
  setWajebMode,
} from "../wajebSession";

describe("wajebSession", () => {
  afterEach(() => {
    setWajebMode(false);
  });

  it("exposes the fixed WAJEB1 credentials", () => {
    expect(WAJEB_USERNAME).toBe("WAJEB1");
    expect(WAJEB_PASSWORD).toBe("1234567891");
  });

  it("defaults to not-in-wajeb-mode", () => {
    expect(isWajebMode()).toBe(false);
  });

  it("round-trips the wajeb flag", () => {
    setWajebMode(true);
    expect(isWajebMode()).toBe(true);
    setWajebMode(false);
    expect(isWajebMode()).toBe(false);
  });
});
