/**
 * The paper the app is printed on.
 *
 * A sheet of faint graph paper with a scatter of school-desk objects drawn on
 * it — flask, atom, pencil, book, compass, DNA, and so on. It is deliberately
 * almost invisible: the doodles carry no meaning, so they must never compete
 * with the story text sitting on top of them.
 *
 * Positions are hand-placed rather than random so the server and client render
 * the same sheet, and so the reading column stays clear: everything sits in the
 * outer fifths of the page, or right at the top and bottom edges.
 */

type Doodle = {
  /** Symbol id from the sprite below. */
  id: string;
  /** Percentage across / down the viewport. */
  x: number;
  y: number;
  size: number;
  rotate: number;
};

const DOODLES: Doodle[] = [
  { id: "d-flask", x: 6, y: 13, size: 74, rotate: -12 },
  { id: "d-atom", x: 92, y: 9, size: 86, rotate: 9 },
  { id: "d-pencil", x: 15, y: 73, size: 66, rotate: 24 },
  { id: "d-book", x: 85, y: 62, size: 82, rotate: -7 },
  { id: "d-compass", x: 95, y: 34, size: 70, rotate: 14 },
  { id: "d-dna", x: 4, y: 46, size: 72, rotate: -5 },
  { id: "d-bulb", x: 79, y: 90, size: 58, rotate: 11 },
  { id: "d-ruler", x: 11, y: 27, size: 78, rotate: -20 },
  { id: "d-graph", x: 89, y: 19, size: 64, rotate: 6 },
  { id: "d-globe", x: 7, y: 88, size: 60, rotate: -14 },
  { id: "d-clip", x: 97, y: 55, size: 46, rotate: 31 },
  { id: "d-planet", x: 19, y: 55, size: 68, rotate: -9 },
  { id: "d-flask", x: 96, y: 79, size: 56, rotate: 18 },
  { id: "d-atom", x: 9, y: 96, size: 62, rotate: -16 },
  { id: "d-pencil", x: 88, y: 45, size: 52, rotate: -28 },
  { id: "d-book", x: 21, y: 4, size: 54, rotate: 15 },
  { id: "d-graph", x: 50, y: 3, size: 58, rotate: -11 },
  { id: "d-clip", x: 47, y: 97, size: 44, rotate: 22 },
];


/**
 * Every glyph is drawn on a 48x48 grid, wrapped in a `<symbol>` so that the
 * `width`/`height` on each `<use>` actually scales it — a `<g>` would ignore
 * them and every doodle would come out the same size.
 */
function Sprite() {
  return (
    <defs>
      <symbol id="d-flask" viewBox="0 0 48 48">
        <path d="M19 6h10M21 6v13L11 39a4 4 0 0 0 3.5 6h19A4 4 0 0 0 37 39L27 19V6" />
        <path d="M16 30h16" />
      </symbol>
      <symbol id="d-atom" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="4.5" />
        <ellipse cx="24" cy="24" rx="19" ry="7.5" />
        <ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="19" ry="7.5" transform="rotate(120 24 24)" />
      </symbol>
      <symbol id="d-pencil" viewBox="0 0 48 48">
        <path d="M8 40l3-9L33 9l6 6-22 22-9 3z" />
        <path d="M31 11l6 6M11 31l6 6" />
      </symbol>
      <symbol id="d-book" viewBox="0 0 48 48">
        <path d="M6 10h13a5 5 0 0 1 5 5v24a5 5 0 0 0-5-5H6V10z" />
        <path d="M42 10H29a5 5 0 0 0-5 5v24a5 5 0 0 1 5-5h13V10z" />
      </symbol>
      <symbol id="d-compass" viewBox="0 0 48 48">
        <path d="M24 6v6M18 42l6-30 6 30" />
        <circle cx="24" cy="9" r="3" />
        <path d="M15.5 28h17" />
      </symbol>
      <symbol id="d-dna" viewBox="0 0 48 48">
        <path d="M15 6c0 12 18 12 18 24S15 42 15 42" />
        <path d="M33 6c0 12-18 12-18 24s18 12 18 12" />
        <path d="M17 15h14M16 24h16M17 33h14" />
      </symbol>
      <symbol id="d-bulb" viewBox="0 0 48 48">
        <path d="M24 6a13 13 0 0 0-8 23v5h16v-5a13 13 0 0 0-8-23z" />
        <path d="M19 40h10M21 44h6" />
      </symbol>
      <symbol id="d-ruler" viewBox="0 0 48 48">
        <rect x="4" y="17" width="40" height="14" rx="2" />
        <path d="M12 17v6M20 17v9M28 17v6M36 17v9" />
      </symbol>
      <symbol id="d-graph" viewBox="0 0 48 48">
        <path d="M8 6v36h36" />
        <path d="M13 34l8-11 7 6 11-16" />
      </symbol>
      <symbol id="d-globe" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="18" />
        <ellipse cx="24" cy="24" rx="7.5" ry="18" />
        <path d="M6.5 18h35M6.5 30h35" />
      </symbol>
      <symbol id="d-clip" viewBox="0 0 48 48">
        <path d="M31 14v18a8 8 0 0 1-16 0V13a5 5 0 0 1 10 0v18a2.5 2.5 0 0 1-5 0V15" />
      </symbol>
      <symbol id="d-planet" viewBox="0 0 48 48">
        <circle cx="24" cy="22" r="11" />
        <ellipse cx="24" cy="26" rx="21" ry="6" transform="rotate(-18 24 26)" />
      </symbol>
    </defs>
  );
}

export function PaperBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white select-none"
    >
      {/* Graph paper: two hairline grids, the coarse one twice as dark. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.028)_1px,transparent_1px)] bg-[size:26px_26px]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(23,23,23,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(23,23,23,0.05)_1px,transparent_1px)] bg-[size:130px_130px]" />

      <svg
        className="absolute inset-0 size-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Sprite />
        {DOODLES.map((d, i) => (
          <svg
            key={i}
            x={`${d.x}%`}
            y={`${d.y}%`}
            overflow="visible"
            className={
              // Every third doodle borrows the subject colour so story pages
              // pick up a whisper of their own palette.
              i % 3 === 0 ? "text-accent/12" : "text-ink/[0.06]"
            }
          >
            <use
              href={`#${d.id}`}
              width={d.size}
              height={d.size}
              transform={`translate(${-d.size / 2} ${-d.size / 2}) rotate(${d.rotate} ${d.size / 2} ${d.size / 2})`}
            />
          </svg>
        ))}
      </svg>

      {/* Fade the paper out behind the fold so long pages stay calm. */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,rgba(255,255,255,0.85)_100%)]" />
    </div>
  );
}
