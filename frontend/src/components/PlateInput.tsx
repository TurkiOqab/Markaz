import { useRef } from "react";
import type { KeyboardEvent } from "react";

/**
 * Standard Saudi plate input — three letter boxes and four digit boxes, each
 * holding a single character. Letters auto-advance to the next slot when
 * filled, and Backspace on an empty slot jumps back so editing feels natural.
 *
 * The combined value passed to `onChange` is stored as `LLL DDDD` with a
 * single space between the two groups; empty slots are stripped. Use the
 * sibling `<PlateBoxes>` on the list cards to render the same shape read-only.
 */
interface Props {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const LETTER_RE = /\p{L}/u;
const DIGIT_RE = /\d/;
const NUM_LETTERS = 3;
const NUM_DIGITS = 4;
const BOX_COUNT = NUM_LETTERS + NUM_DIGITS;

function parse(value: string): { letters: string[]; digits: string[] } {
  const chars = Array.from(value);
  const letters: string[] = [];
  const digits: string[] = [];
  for (const c of chars) {
    if (LETTER_RE.test(c) && letters.length < NUM_LETTERS) letters.push(c);
    else if (DIGIT_RE.test(c) && digits.length < NUM_DIGITS) digits.push(c);
  }
  while (letters.length < NUM_LETTERS) letters.push("");
  while (digits.length < NUM_DIGITS) digits.push("");
  return { letters, digits };
}

function combine(letters: string[], digits: string[]): string {
  const lJoined = letters.join("").trim();
  const dJoined = digits.join("").trim();
  if (lJoined && dJoined) return `${lJoined} ${dJoined}`;
  return lJoined || dJoined;
}

export function PlateInput({ value, onChange, required }: Props) {
  const { letters, digits } = parse(value);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function update(idx: number, raw: string) {
    // The browser may give us multiple chars (paste); pick the first valid one
    // for this slot. Slots 0..2 = letters; 3..6 = digits.
    const isLetter = idx < NUM_LETTERS;
    const filterRe = isLetter ? LETTER_RE : DIGIT_RE;
    let c = "";
    for (const ch of Array.from(raw)) {
      if (filterRe.test(ch)) {
        c = ch;
        break;
      }
    }
    const next = { letters: [...letters], digits: [...digits] };
    if (isLetter) next.letters[idx] = c;
    else next.digits[idx - NUM_LETTERS] = c;
    onChange(combine(next.letters, next.digits));
    if (c && idx < BOX_COUNT - 1) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key === "Backspace" && !e.currentTarget.value && idx > 0) {
      refs.current[idx - 1]?.focus();
      e.preventDefault();
    }
  }

  function box(idx: number, content: string, mono: boolean) {
    // Letter slots get a subtle blue accent; digit slots get an amber one so
    // the two groups are distinguishable even before any character is typed.
    const placeholder = mono ? "0" : "ا";
    const accent = mono
      ? "border-amber-200 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-500/30"
      : "border-blue-200 bg-blue-50/40 focus:border-blue-500 focus:ring-blue-500/30";
    return (
      <input
        key={idx}
        ref={(el) => {
          refs.current[idx] = el;
        }}
        type="text"
        inputMode={mono ? "numeric" : "text"}
        value={content}
        placeholder={placeholder}
        onChange={(e) => update(idx, e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, idx)}
        onFocus={(e) => e.currentTarget.select()}
        maxLength={1}
        required={required && idx === 0}
        aria-label={mono ? `رقم ${idx - NUM_LETTERS + 1}` : `حرف ${idx + 1}`}
        className={`h-11 w-10 rounded-md border text-center text-base font-black text-surface-900 transition-colors placeholder:font-normal placeholder:text-surface-400/70 focus:outline-none focus:ring-2 ${accent} ${mono ? "tabular-nums" : ""}`}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 self-start rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
          حروف
          <span className="text-blue-500/70">×{NUM_LETTERS}</span>
        </span>
        <div className="flex gap-1">{letters.map((c, i) => box(i, c, false))}</div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1 self-start rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          أرقام
          <span className="text-amber-500/70">×{NUM_DIGITS}</span>
        </span>
        <div className="flex gap-1">{digits.map((c, i) => box(i + NUM_LETTERS, c, true))}</div>
      </div>
    </div>
  );
}
