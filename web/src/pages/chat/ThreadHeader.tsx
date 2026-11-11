import { Fragment } from "react";
import { initials, roomTitle } from "./format";
import { useGroupText } from "./text";
import type { Group, Me, Member } from "./types";

function MemberNames({ group }: { group: Group }) {
  const text = useGroupText();
  if (group.isDm) return <>{text("dm_note")}</>;
  return (
    <>
      {group.members.map((member, index) => (
        <Fragment key={member.id || index}>
          {index > 0 && ", "}
          {member.isObserver ? (
            <i className="tg-obs">
              {member.name} ({text("observer")})
            </i>
          ) : (
            member.name
          )}
        </Fragment>
      ))}
    </>
  );
}

/* The whole header is the way into the member list, as in Telegram. */
export function ThreadHeader({ group, onShowInfo }: { group: Group | undefined; onShowInfo: () => void }) {
  const text = useGroupText();
  if (!group) return <header className="tg-head" id="tgHead" />;
  const title = roomTitle(group, text);
  return (
    <header className="tg-head" id="tgHead">
      <button className="tg-head-btn" id="tgHeadBtn" type="button" disabled={group.isDm} onClick={onShowInfo}>
        <span className={group.id === "chairmen" ? "tg-av gold" : "tg-av"}>{initials(title)}</span>
        <span className="tg-head-txt">
          <b>{title}</b>
          <span className="tg-head-sub">
            <MemberNames group={group} />
          </span>
        </span>
        {!group.isDm && <span className="tg-chev">›</span>}
      </button>
    </header>
  );
}

type MemberInfoProps = {
  group: Group | undefined;
  me: Me | null;
  isOpen: boolean;
  onClose: () => void;
  onWrite: (member: Member) => void;
};

/* Member list for the open room. Choosing anyone but yourself opens the
   direct chat with them. */
export function MemberInfo({ group, me, isOpen, onClose, onWrite }: MemberInfoProps) {
  const text = useGroupText();
  const members = group?.members ?? [];
  return (
    <aside className="tg-info" id="tgInfo" hidden={!isOpen || !group}>
      <div className="tg-info-top">
        <b>
          {text("info")} · {members.length}
        </b>
        <button className="tg-info-x" id="tgInfoX" type="button" aria-label={text("close")} onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="tg-info-list">
        {members.map((member, index) => {
          const isSelf = me !== null && member.id === me.id;
          return (
            <button
              key={member.id || index}
              className="tg-person"
              type="button"
              disabled={isSelf}
              onClick={() => onWrite(member)}
            >
              <span className={member.isObserver ? "tg-av gold" : "tg-av"}>{initials(member.name)}</span>
              <span className="tg-person-txt">
                <b>
                  {member.name}
                  {isSelf && ` (${text("you")})`}
                </b>
                <span className="tg-person-sub">
                  {member.role}
                  {member.isObserver && ` · ${text("observer")}`}
                </span>
              </span>
              {!isSelf && (
                <span className="tg-person-go" title={text("write")}>
                  ✎
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
