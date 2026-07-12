import { describe, expect, it } from "vitest";
import { nextPhoneDigits } from "./PickupForm";

// Regression coverage for the phone backspace bug: deleting a FORMATTING char
// mid-string (the space after ")") must not silently drop the last digit.
// See nextPhoneDigits in PickupForm.tsx.

describe("nextPhoneDigits", () => {
  // Given "(604) 123-4567" (digits 6041234567) the display for the first three
  // digits is "(604" — deleting the trailing "4" is a genuine end-of-string
  // backspace of a formatting-adjacent digit.
  it("drops the last digit on a trailing backspace", () => {
    // prevDigits "604", prevDisplay "(604", caret at end of the shortened raw.
    const raw = "(60"; // user backspaced the visible "4"
    const result = nextPhoneDigits(raw, "604", "(604", raw.length);
    expect(result).toBe("60");
  });

  it("keeps digits when a mid-string formatting char is deleted (bug guard)", () => {
    // "(604) " -> user deletes the space, caret lands BEFORE the ")" region,
    // i.e. NOT at the end. digitsFromTelInput is unchanged ("604"); the old
    // heuristic would have sliced it to "60". It must stay "604".
    const prevDisplay = "(604) ";
    const raw = "(604)"; // one formatting char removed mid-string
    const caretMidString = 4; // caret after "6040"? — anything < raw.length
    const result = nextPhoneDigits(raw, "604", prevDisplay, caretMidString);
    expect(result).toBe("604");
  });

  it("passes through normal typing (new digit appended)", () => {
    const raw = "(604) 1";
    const result = nextPhoneDigits(raw, "604", "(604) ", raw.length);
    expect(result).toBe("6041");
  });

  it("re-formats mid-string without losing digits when caret is not at end", () => {
    // Deleting a formatting char somewhere in the middle of a longer number.
    const prevDisplay = "(604) 123-4567";
    const raw = "(604 123-4567"; // removed the ")" mid-string
    const caret = 4; // not at end
    const result = nextPhoneDigits(raw, "6041234567", prevDisplay, caret);
    expect(result).toBe("6041234567");
  });

  it("still deletes the last digit at end even for long numbers", () => {
    const prevDisplay = "(604) 123-4567";
    const raw = "(604) 123-456"; // trailing 7 removed, caret at end
    const result = nextPhoneDigits(
      raw,
      "6041234567",
      prevDisplay,
      raw.length,
    );
    expect(result).toBe("604123456");
  });
});
