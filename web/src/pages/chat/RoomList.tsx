import { useState } from "react";
import { timeOfDay } from "../../shell/chat";
import { initials, roomTitle } from "./format";
import { useGroupText } from "./text";
import type { Group } from "./types";

/* A fixed set, so a value from the session can never become the link. */
const BACK_PAGES = ["index.html", "admin.html", "association.html", "company.html"] as const;
export type BackPage = (typeof BACK_PAGES)[number];

type RoomListProps = {
  backHref: BackPage;
  status: "loading" | "failed" | "ready";
  groups: readonly Group[];
  activeId: string | null;
  onOpen: (groupId: string) => void;
};

function avatarClass(group: Group): string {
  return `tg-av${group.id === "chairmen" ? " gold" : ""}${group.isDm ? " dm" : ""}`;
}

function Room({ group, isActive, onOpen }: { group: Group; isActive: boolean; onOpen: () => void }) {
  const text = useGroupText();
  const title = roomTitle(group, text);
  return (
    <button className={isActive ? "tg-room on" : "tg-room"} type="button" onClick={onOpen}>
      <span className={avatarClass(group)}>{initials(title)}</span>
      <span className="tg-room-txt">
        <span className="tg-room-top">
          <b>{title}</b>
          {group.time > 0 && <time>{timeOfDay(group.time)}</time>}
        </span>
        <span className="tg-room-sub">
          {group.last ? `${group.lastFrom}: ${group.last}` : `${group.members.length} ${text("members")}`}
        </span>
      </span>
    </button>
  );
}

export function RoomList({ backHref, status, groups, activeId, onOpen }: RoomListProps) {
  const text = useGroupText();
  const [search, setSearch] = useState("");
  const filter = search.trim().toLowerCase();
  const shown = groups.filter(group => !filter || roomTitle(group, text).toLowerCase().includes(filter));

  return (
    <aside className="tg-side">
      <div className="tg-side-top">
        <a className="tg-back" href={backHref}>
          {text("back")}
        </a>
        <input
          className="tg-search"
          id="tgSearch"
          placeholder={text("search")}
          autoComplete="off"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>
      <div className="tg-list" id="tgList">
        {status === "loading" && <p className="tg-note">{text("loading")}</p>}
        {status === "failed" && <p className="tg-note bad">{text("failed")}</p>}
        {status === "ready" && shown.length === 0 && <p className="tg-note">{groups.length ? "—" : text("none")}</p>}
        {shown.map(group => (
          <Room key={group.id} group={group} isActive={group.id === activeId} onOpen={() => onOpen(group.id)} />
        ))}
      </div>
    </aside>
  );
}
