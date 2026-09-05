/**
 * Shared Tailwind recipes for the few surfaces that repeat across the app.
 *
 * Everything here is plain Tailwind — these are string constants, not CSS
 * classes, so the utilities stay visible to the compiler and to anyone reading
 * the markup. Only genuinely un-expressible things (keyframes, range-input
 * pseudo-elements, the design tokens themselves) still live in `globals.css`.
 *
 * Interactive surfaces carry `data-press`, which the keycap rule in
 * `globals.css` hooks onto so anchors travel like buttons do.
 */

/**
 * The one horizontal rhythm every full-page surface shares.
 *
 * The header and the page body must use *this exact* string — same max width,
 * same gutters — or the header's content edge drifts away from the content
 * edge below it, which reads as a broken column on wide screens.
 */
export const pageShell = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/** The main reading card: a sheet of paper floating over the page. */
export const card =
  "border border-ink/10 bg-white/95 shadow-[0_22px_55px_rgba(23,23,23,0.09),0_4px_14px_rgba(23,23,23,0.05)]";

/** A lighter sheet for things nested inside a card. */
export const cardSoft =
  "border border-ink/10 bg-white/90 shadow-[0_3px_0_rgba(23,23,23,0.07),0_12px_30px_rgba(23,23,23,0.07)]";

/** Hover lift + the subject's colour arriving on an otherwise grey card. */
export const cardInteractive =
  "transition duration-[180ms] ease-out outline-none hover:-translate-y-[3px] hover:-rotate-[0.35deg] hover:border-accent/45 hover:bg-white hover:shadow-[0_26px_65px_rgb(var(--accent-rgb)/0.16),0_6px_18px_rgba(23,23,23,0.08)] focus-visible:-translate-y-[3px] focus-visible:-rotate-[0.35deg] focus-visible:border-accent/45 focus-visible:bg-white focus-visible:shadow-[0_26px_65px_rgb(var(--accent-rgb)/0.16),0_6px_18px_rgba(23,23,23,0.08)]";

/**
 * Buttons are physical: a hard under-shadow they sink into when pressed.
 * `:active` only collapses the shadow — the travel itself comes from the
 * shared keycap rule, so the two stay in step.
 */
export const buttonPrimary =
  "bg-primary text-primary-ink shadow-[0_4px_0_var(--press),0_12px_24px_rgba(23,23,23,0.22)] transition duration-200 ease-[var(--ease-bounce)] hover:not-disabled:-translate-y-0.5 hover:not-disabled:bg-black hover:not-disabled:shadow-[0_6px_0_var(--press),0_16px_30px_rgba(23,23,23,0.28)] active:not-disabled:shadow-[0_1px_0_var(--press),0_4px_10px_rgba(23,23,23,0.2)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent/75 disabled:transform-none disabled:shadow-none";

/** Slapped-on-by-hand labels. They straighten up when you poke them. */
export const sticker =
  "-rotate-[1.8deg] transition-transform duration-[260ms] ease-[var(--ease-bounce)] hover:rotate-[1.2deg] hover:scale-105";

/** The subject-coloured beat label above a scene. */
export const storyTag =
  "-rotate-[1.5deg] border-[1.5px] border-accent/36 bg-accent/12 text-ink shadow-[0_3px_0_rgb(var(--accent-rgb)/0.24),0_8px_18px_rgb(var(--accent-rgb)/0.1)]";

/** A pickable row. Sits proud of the page and lifts its shadow on hover. */
export const storyOption =
  "border-[1.5px] shadow-[0_3px_0_rgba(23,23,23,0.08),0_12px_28px_rgba(23,23,23,0.06)] hover:shadow-[0_5px_0_rgb(var(--accent-rgb)/0.28),0_18px_36px_rgb(var(--accent-rgb)/0.13)] focus-visible:shadow-[0_5px_0_rgb(var(--accent-rgb)/0.28),0_18px_36px_rgb(var(--accent-rgb)/0.13)]";

/**
 * The numbered chip on an option. No base rotation: a circle is rotationally
 * symmetric, so a transform buys nothing but inflates the border box and drags
 * the chip off the card's padding edge. The italic numeral supplies the tilt.
 */
export const storyIndex =
  "border-2 border-accent/62 bg-accent/12 text-ink shadow-[0_3px_0_rgb(var(--accent-rgb)/0.26)]";

/**
 * Optical centring for a small marker (dot, pip) beside ALL-CAPS text.
 *
 * `items-center` centres the marker on the line box, but all-caps ink has no
 * descenders, so it occupies only the cap band and sits high inside that box.
 * The small optical lift keeps the marker centred on Satoshi's all-caps ink
 * rather than its line box. A transform, not a margin, leaves the row's layout
 * and the gap before the label untouched.
 */
export const capMarker = "-translate-y-[0.065em]";

export const rangeInput =
  "h-[34px] w-full cursor-pointer appearance-none bg-transparent [--track:var(--color-line)] [&::-webkit-slider-runnable-track]:h-0.5 [&::-webkit-slider-runnable-track]:bg-[var(--track)] [&::-moz-range-track]:h-0.5 [&::-moz-range-track]:bg-[var(--track)] [&::-webkit-slider-thumb]:-mt-2 [&::-webkit-slider-thumb]:size-[18px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-[0_0_0_6px_rgb(var(--accent-rgb)/0.18)] [&::-moz-range-thumb]:size-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-ink [&::-moz-range-thumb]:shadow-[0_0_0_6px_rgb(var(--accent-rgb)/0.18)]";

export const PILL_TONE_CLASSES = {
  rose: "bg-rose/12 text-rose",
  sage: "bg-sage/12 text-sage",
  accent: "bg-accent/12 text-ink",
} as const;

export const PROGRESS_TONE_CLASSES = {
  rose: "bg-rose",
  sage: "bg-sage",
  accent: "bg-accent",
  ink: "bg-ink/45",
} as const;

export const PARTNER_ACTION_LABELS = {
  guide: "a tiny clue",
  ask: "curious",
  encourage: "nice catch",
  observe: "noted",
} as const;

export const PARTNER_ACTION_TONES = {
  guide: "text-ink",
  ask: "text-ink",
  encourage: "text-accent",
  observe: "text-muted",
} as const;
