import { motion, useReducedMotion } from "framer-motion";
import CheckBadge from "../components/CheckBadge";
import { CYCLE_NODES, type CycleNodeId } from "../content";

/* ---------- Geometry — viewBox 0 0 480 480, ring centre (240,240), r=116 ----------
   The ring is deliberately smaller than half the viewBox so every node label can
   sit radially OUTSIDE the ring while the centre caption stays clear inside it. */

const VIEW = 480;
const CENTER = 240;
const RING_R = 116;
const ARROW_R = 102; // arrows hug the ring from just inside
const LOOP_R = 200; // plum loop-back sweeps outside the ring, above node 1's label
/** Node angles in cycle order, degrees (y-down SVG space): 270 ≡ -90, 342 ≡ -18. */
const NODE_ANGLES = [270, 342, 54, 126, 198] as const;
/** Angular inset so arrows start/end clear of the 80px node buttons. */
const GAP_DEG = 24;

function pt(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function fmt(p: [number, number]): string {
  return `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
}

/** left/top percentages for each node: (240 + 116·cosθ)/480, (240 + 116·sinθ)/480. */
const NODE_POS = NODE_ANGLES.map((deg) => {
  const [x, y] = pt(RING_R, deg);
  return {
    left: `${((x / VIEW) * 100).toFixed(2)}%`,
    top: `${((y / VIEW) * 100).toFixed(2)}%`,
  };
});

/** Curved arrow along the ring from node i to node i+1 (wraps 5 → 1). */
const ARROW_PATHS = NODE_ANGLES.map((deg, i) => {
  const next = i === NODE_ANGLES.length - 1 ? NODE_ANGLES[0] + 360 : NODE_ANGLES[i + 1];
  const from = deg + GAP_DEG;
  const to = next - GAP_DEG;
  return `M ${fmt(pt(ARROW_R, from))} A ${ARROW_R} ${ARROW_R} 0 0 1 ${fmt(pt(ARROW_R, to))}`;
});

/** Plum dashed arc: node 5 sweeps back over the top to node 2 — the cycle repeats. */
const LOOP_PATH = `M ${fmt(pt(LOOP_R, 201))} A ${LOOP_R} ${LOOP_R} 0 0 1 ${fmt(pt(LOOP_R, 339))}`;

/* ---------- Nodes ---------- */

type CycleNode = (typeof CYCLE_NODES)[number];

/**
 * Where a node's label sits relative to its circle. The four ring positions
 * point radially OUTWARD from the ring at the node's own angle (node 1 above,
 * 2 right, 3+4 below, 5 left); "list" is the mobile stacked layout beside the
 * circle. Side labels are width-capped so they wrap instead of crossing the
 * ring, the caption or the container edge.
 */
type LabelPos = "above" | "right" | "below" | "left" | "list";

const LABEL_CLASS: Record<LabelPos, string> = {
  above:
    "bottom-full left-1/2 mb-2 max-w-[140px] -translate-x-1/2 rounded bg-cream/90 px-1.5 py-0.5 text-center text-[11.5px] leading-tight",
  right:
    "left-full top-1/2 ml-1 max-w-[64px] -translate-y-1/2 rounded bg-cream/90 px-0.5 py-0.5 text-left text-[11.5px] leading-tight",
  below:
    "top-full left-1/2 mt-1.5 max-w-[130px] -translate-x-1/2 rounded bg-cream/90 px-1.5 py-0.5 text-center text-[11.5px] leading-tight",
  left:
    "right-full top-1/2 mr-1 max-w-[64px] -translate-y-1/2 rounded bg-cream/90 px-0.5 py-0.5 text-right text-[11.5px] leading-tight",
  list: "left-full top-1/2 ml-4 -translate-y-1/2 text-left text-[13px] leading-snug",
};

/** Ring layout: each label anchored outside the ring at its node's own angle. */
const RING_LABEL_POS: LabelPos[] = ["above", "right", "below", "below", "left"];

interface NodeButtonProps {
  node: CycleNode;
  visited: boolean;
  active: boolean;
  /** Label placement — radial outside the ring, or beside it in the mobile list. */
  labelPos: LabelPos;
  onSelect: () => void;
}

function NodeButton({ node, visited, active, labelPos, onSelect }: NodeButtonProps) {
  const circleTone = active
    ? "border-teal-deep bg-teal shadow-md"
    : visited
      ? "border-moss bg-cream shadow-sm hover:shadow-md"
      : "border-teal bg-cream shadow-sm hover:border-teal-deep hover:shadow-md";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      initial={false}
      animate={{ scale: active ? 1.07 : 1 }}
      whileHover={{ scale: active ? 1.07 : 1.04 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 21 }}
      className={`relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] transition-colors duration-200 ${circleTone}`}
    >
      <span
        className={`font-display text-2xl font-semibold leading-none ${
          active ? "text-cream" : "text-plum"
        }`}
      >
        {node.n}
      </span>
      <span
        className={`absolute w-max font-semibold transition-colors ${
          LABEL_CLASS[labelPos]
        } ${active ? "text-teal-deep" : "text-ink-soft"}`}
      >
        {node.title}
      </span>
      {visited && <CheckBadge done={true} size={26} className="absolute -right-1.5 -top-1.5" />}
    </motion.button>
  );
}

/* ---------- Diagram ---------- */

export interface CycleDiagramProps {
  visited: ReadonlySet<CycleNodeId>;
  active: CycleNodeId | null;
  onSelect: (id: CycleNodeId) => void;
}

/**
 * The inquiry-cycle ring: decorative SVG (dashed track, directional arrows,
 * plum loop-back) with real HTML <button> nodes positioned over it. Node
 * labels sit outside the ring so nothing crosses the centre caption; the
 * caption is sized to fit well inside the ring's inner radius.
 * Below 768px the SVG is hidden and the same buttons stack as a vertical
 * list with a connecting line — identical state logic.
 */
export default function CycleDiagram({ visited, active, onSelect }: CycleDiagramProps) {
  const reduce = useReducedMotion() ?? false;

  return (
    <>
      {/* Desktop ring — aspect-square keeps node % positions aligned with the SVG. */}
      <div className="relative mx-auto hidden aspect-square w-full max-w-[480px] md:block">
        <svg
          viewBox="0 0 480 480"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <marker
              id="cycle-arrowhead"
              viewBox="0 0 10 10"
              refX={7.5}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" className="fill-teal-deep" />
            </marker>
            <marker
              id="cycle-loop-arrowhead"
              viewBox="0 0 10 10"
              refX={7.5}
              refY={5}
              markerWidth={6}
              markerHeight={6}
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" className="fill-plum" />
            </marker>
          </defs>

          {/* soft warm halo behind the cycle */}
          <circle cx={CENTER} cy={CENTER} r={172} className="fill-blush/50" />

          {/* dashed track the five stages sit on — dashes drift slowly */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RING_R}
            fill="none"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="3 10"
            className="stroke-teal/40"
            animate={reduce ? undefined : { strokeDashoffset: [0, -130] }}
            transition={reduce ? undefined : { duration: 16, ease: "linear", repeat: Infinity }}
          />

          {/* directional arrows between consecutive stages, drawn in on mount */}
          {ARROW_PATHS.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              fill="none"
              strokeWidth={2.5}
              strokeLinecap="round"
              markerEnd="url(#cycle-arrowhead)"
              className="stroke-teal-deep"
              initial={reduce ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      pathLength: { delay: 0.5 + i * 0.12, duration: 0.6, ease: "easeInOut" },
                      opacity: { delay: 0.5 + i * 0.12, duration: 0.25, ease: "easeOut" },
                    }
              }
            />
          ))}

          {/* the cycle repeats: node 5 loops back to node 2 */}
          <motion.path
            d={LOOP_PATH}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="1 9"
            markerEnd="url(#cycle-loop-arrowhead)"
            className="stroke-plum"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduce ? { duration: 0 } : { delay: 1.6, duration: 0.9, ease: "easeOut" }}
          />

          {/* centre caption (decorative — the whole SVG is aria-hidden).
              Sized to fit inside the ring's inner radius (~r70 of 480). */}
          <text
            x={CENTER}
            y={237}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            style={{ fontFamily: "var(--font-display)" }}
            className="fill-plum"
          >
            Sustained Inquiry
          </text>
          <text
            x={CENTER}
            y={256}
            textAnchor="middle"
            fontSize={9.5}
            letterSpacing={1.8}
            className="fill-ink-soft"
          >
            THE CYCLE REPEATS
          </text>
        </svg>

        {CYCLE_NODES.map((node, i) => (
          <div
            key={node.id}
            className="absolute z-10"
            style={{
              left: NODE_POS[i].left,
              top: NODE_POS[i].top,
              transform: "translate(-50%, -50%)",
            }}
          >
            <motion.div
              initial={reduce ? false : { scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.09, type: "spring", stiffness: 300, damping: 18 }}
            >
              <NodeButton
                node={node}
                visited={visited.has(node.id)}
                active={active === node.id}
                labelPos={RING_LABEL_POS[i]}
                onSelect={() => onSelect(node.id)}
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Mobile (<768px): vertical list of the same buttons with a connecting line */}
      <ol className="relative md:hidden">
        <span
          aria-hidden={true}
          className="absolute bottom-[52px] left-[42px] top-[52px] w-1 rounded-full bg-teal/20"
        />
        {CYCLE_NODES.map((node, i) => (
          <motion.li
            key={node.id}
            className="relative py-2"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.07, duration: 0.3, ease: "easeOut" }}
          >
            <NodeButton
              node={node}
              visited={visited.has(node.id)}
              active={active === node.id}
              labelPos="list"
              onSelect={() => onSelect(node.id)}
            />
          </motion.li>
        ))}
      </ol>
    </>
  );
}
