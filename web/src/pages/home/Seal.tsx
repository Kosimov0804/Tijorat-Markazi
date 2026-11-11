/* The platform seal: the arch mark inside a ring of four arcs, one per
   market. The intrinsic width and height keep it small if the stylesheet
   is late; the CSS box sizes it afterwards. */

const ARCS = ["t1", "t2", "t3", "t4"] as const;
const ARC_LENGTH = 58.26;
const ARC_GAP = 230.77;
const ARC_STEP = 72.26;

export function Seal({ size, className }: { size: number; className: string }) {
  const ring = Math.round(size * 1.32);
  return (
    <span className={className} aria-hidden="true">
      <svg className="hub-ring" width={ring} height={ring} viewBox="0 0 100 100">
        {ARCS.map((tone, index) => (
          <circle
            key={tone}
            className={`hub-arc ${tone}`}
            cx="50"
            cy="50"
            r="46"
            strokeDasharray={`${ARC_LENGTH} ${ARC_GAP}`}
            strokeDashoffset={-(ARC_STEP * index + (index === 3 ? 0.03 : 0))}
            transform="rotate(-90 50 50)"
          />
        ))}
      </svg>
      <svg className="hub-mark" width={size} height={size} viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" />
        <path className="hub-mark-line" d="M32 12c-8 0-13 5.6-13 13v27h26V25c0-7.4-5-13-13-13z" />
        <path className="hub-mark-fill" d="M32 22c-3.6 0-6 2.6-6 6v24h12V28c0-3.4-2.4-6-6-6z" />
      </svg>
    </span>
  );
}
