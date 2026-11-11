import { useRef } from "react";

// Basic spam protection for the lead forms, with nothing for real visitors to do or see.
//  1. A hidden "trap" field. People never see it, so they leave it empty; form-filling bots fill it in.
//  2. A minimum time: a form submitted within 2 seconds of the page opening was not filled in by a person.
// When a submission looks like a bot the form shows its normal "thank you" but nothing is saved or emailed,
// so the bot gets no signal to adapt to.

const MIN_FILL_MS = 2000;

export function useSpamGuard() {
  const openedAt = useRef(Date.now());
  const trap = useRef("");

  const field = (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this field empty
        <input
          type="text"
          name="contact_me_by_fax_only"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          onChange={(e) => {
            trap.current = e.target.value;
          }}
        />
      </label>
    </div>
  );

  const looksLikeBot = (): boolean => trap.current.trim() !== "" || Date.now() - openedAt.current < MIN_FILL_MS;

  return { field, looksLikeBot };
}
