import { useMarketText } from "../../shell/market/mk";
import { MoliyaFrame } from "../moliya-shared/MoliyaFrame";
import { T_HUB } from "./hubText";

/* Three doors and no logic: a company project, a startup project, and the
   institution's side of the queue. Each is its own page. */
const DOORS = [
  { href: "moliya-korxona.html", chip: "msh_door_1", name: "company" },
  { href: "moliya-startup.html", chip: "msh_door_2", name: "startup" },
  { href: "moliya-investor.html", chip: "msh_door_3", name: "investor" },
] as const;

export function MoliyaPage() {
  const text = useMarketText(T_HUB);
  return (
    <MoliyaFrame
      action={{ href: "index.html", labelKey: "d_home" }}
      eyebrow={text("msh_eyebrow")}
      headingHtml={text("msh_h1")}
      lead={text("msh_lead")}
    >
      <div className="mk-grid">
        {DOORS.map(door => (
          <a key={door.name} className="mk-card" href={door.href}>
            <span className="mk-chip">{text(door.chip)}</span>
            <h3>{text(`msh_${door.name}_t`)}</h3>
            <p className="mk-sub">{text(`msh_${door.name}_d`)}</p>
            <div className="mk-card-foot">
              <span className="mk-meta">{text(`msh_${door.name}_m`)}</span>
            </div>
          </a>
        ))}
      </div>
    </MoliyaFrame>
  );
}
