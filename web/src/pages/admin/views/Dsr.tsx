import { useRef, useState } from "react";
import { asArray, asNumber, asString, isRecord } from "../../../shell/chat";
import { useI18n } from "../../../shell/i18n";
import { adminPost, adminPostSafe } from "../api";
import { Intro, SMALL_BUTTON, useLoader } from "../parts";
import { DSR_KIND, DSR_ST } from "../text";
import { useText } from "../useText";

/* The queue behind mening-malumotlarim.html. Somebody has to be accountable
   for the deadline of modda 22 ZRU-547, so `overdue` is computed by the server
   as of now, and the answer box will not submit empty, a refusal included: a
   refusal without a ground is not an answer. */

interface DsrRequest {
  id: string;
  ref: string;
  subjectName: string;
  subjectEmail: string;
  kind: string;
  created: number;
  due: number;
  isOverdue: boolean;
  status: string;
  note: string;
  answer: string;
}

interface DsrQueue {
  items: readonly DsrRequest[];
  overdueCount: number;
}

function parseRequest(value: unknown): DsrRequest {
  const item = isRecord(value) ? value : {};
  return {
    id: asString(item.id),
    ref: asString(item.ref),
    subjectName: asString(item.subjectName),
    subjectEmail: asString(item.subjectEmail),
    kind: asString(item.kind),
    created: asNumber(item.created),
    due: asNumber(item.due),
    isOverdue: Boolean(item.overdue),
    status: asString(item.status),
    note: asString(item.note),
    answer: asString(item.answer),
  };
}

async function loadQueue(): Promise<DsrQueue> {
  const answer = await adminPost("/api/legal/requests");
  const data = isRecord(answer) ? answer : {};
  return { items: asArray(data.items).map(parseRequest), overdueCount: asNumber(data.overdue) };
}

/** Short local date-time, used only by this queue. */
function shortDateTime(ms: number): string {
  if (!ms) return "—";
  const date = new Date(ms);
  const pad = (part: number) => String(part).padStart(2, "0");
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function Dsr() {
  const { tx } = useText();
  const { data: queue, reload } = useLoader(loadQueue, []);
  const [hasEmptyAnswer, setHasEmptyAnswer] = useState(false);

  const handleAnswer = async (id: string, answer: string, isRefusal: boolean) => {
    setHasEmptyAnswer(false);
    await adminPostSafe("/api/legal/answer", { id, answer, refuse: isRefusal });
    reload();
  };

  /* The old view drew nothing until the queue had arrived. */
  if (!queue) return null;

  return (
    <div className="admin-panel">
      <h2>
        {tx("nav_dsr")}
        {queue.overdueCount > 0 && <span className="badge-st off"> {queue.overdueCount}</span>}
      </h2>
      <Intro gap={14}>{tx("dsr_intro")}</Intro>
      <table className="admin-table">
        <thead>
          <tr>
            <th>{tx("dsr_c_ref")}</th>
            <th>{tx("dsr_c_who")}</th>
            <th>{tx("dsr_c_kind")}</th>
            <th>{tx("dsr_c_filed")}</th>
            <th>{tx("dsr_c_due")}</th>
            <th>{tx("dsr_c_status")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {queue.items.length === 0 && (
            <tr>
              <td colSpan={7} className="ac-label">
                {tx("dsr_none")}
              </td>
            </tr>
          )}
          {queue.items.map(request => (
            <RequestRow
              key={request.id}
              request={request}
              onEmpty={() => setHasEmptyAnswer(true)}
              onAnswer={(answer, isRefusal) => void handleAnswer(request.id, answer, isRefusal)}
            />
          ))}
        </tbody>
      </table>
      <div className="err" id="dsrErr" role="alert" style={{ marginTop: 10 }}>
        {hasEmptyAnswer && tx("dsr_need_ans")}
      </div>
    </div>
  );
}

type RequestRowProps = {
  request: DsrRequest;
  onEmpty: () => void;
  onAnswer: (answer: string, isRefusal: boolean) => void;
};

function RequestRow({ request, onEmpty, onAnswer }: RequestRowProps) {
  const { tx } = useText();
  const { pick } = useI18n();
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const kind = DSR_KIND[request.kind];
  const status = DSR_ST[request.status];

  const submit = (isRefusal: boolean) => {
    const text = (boxRef.current?.value ?? "").trim();
    if (!text) {
      onEmpty();
      boxRef.current?.focus();
      return;
    }
    onAnswer(text, isRefusal);
  };

  return (
    <tr data-id={request.id} className={request.isOverdue ? "dsr-late" : undefined}>
      <td>
        <code>{request.ref}</code>
      </td>
      <td>
        {request.subjectName}
        <div className="ac-label">{request.subjectEmail}</div>
      </td>
      <td>{kind ? pick(kind) : request.kind}</td>
      <td>{shortDateTime(request.created)}</td>
      <td>
        {shortDateTime(request.due)}
        {request.isOverdue && <span className="badge-st off"> {tx("dsr_overdue")}</span>}
      </td>
      <td>
        {status ? pick(status) : request.status}
        {request.note && <div className="ac-label">{request.note}</div>}
        {request.answer && <div className="ac-label">→ {request.answer}</div>}
      </td>
      <td>
        {request.status === "open" ? (
          <>
            <textarea
              className="adm-inline dsr-ans"
              rows={2}
              placeholder={tx("dsr_ans_ph")}
              aria-label={`${tx("dsr_send")} ${request.ref}`}
              ref={boxRef}
            />
            <div style={{ marginTop: 6, whiteSpace: "nowrap" }}>
              <button className="btn btn-primary dsr-ok" type="button" style={SMALL_BUTTON} onClick={() => submit(false)}>
                {tx("dsr_send")}
              </button>{" "}
              <button className="btn btn-ghost dsr-no" type="button" style={SMALL_BUTTON} onClick={() => submit(true)}>
                {tx("dsr_refuse")}
              </button>
            </div>
          </>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
