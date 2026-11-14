import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { cabinetPost, FlashNote, useFlash } from "../../shell/cabinet";
import { safeMediaUrl } from "../../shell/chat/urls";
import { dialogs } from "../../shell/dialogs";
import { uploadPhoto } from "./upload";
import { parseShowroom } from "./types";
import type { ShowItem, Trade, ViewProps } from "./types";

type ShowroomProps = ViewProps & { items: readonly ShowItem[]; onItems: (items: ShowItem[]) => void };

const EMPTY_FORM = { name: "", price: "", desc: "", img: "" };
const SAVED_NOTE_MS = 1600;
const FILE_NAME_LIMIT = 18;

const shortName = (name: string): string =>
  name.length > FILE_NAME_LIMIT ? `${name.slice(0, FILE_NAME_LIMIT - 2)}…` : name;

function ShowCard({ item, deleteTitle, onDelete }: { item: ShowItem; deleteTitle: string; onDelete: () => void }) {
  const image = safeMediaUrl(item.img);
  return (
    <div className="show-card">
      {image ? (
        <img className="show-img" src={image} alt="" loading="lazy" />
      ) : (
        <div className="show-img show-img-ph">🛍️</div>
      )}
      <div className="show-body">
        <b>{item.name}</b>
        {item.price && <span className="show-price">{item.price}</span>}
        {item.desc && <p>{item.desc}</p>}
      </div>
      <button type="button" className="show-del" title={deleteTitle} aria-label={deleteTitle} onClick={onDelete}>
        ✕
      </button>
    </div>
  );
}

/* Export is what the company sells abroad, import what it wants to buy in.
   Two catalogues, one list underneath: each item carries its direction. */
export function ShowroomView({ items, onItems, credentials, ot }: ShowroomProps) {
  const [trade, setTrade] = useState<Trade>("export");
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const flash = useFlash(SAVED_NOTE_MS);

  /* The grid changes at once; the server's answer then replaces it. */
  const save = async (next: ShowItem[]): Promise<void> => {
    onItems(next);
    const answer = await cabinetPost("/api/company/showroom", credentials, { items: next });
    if (!answer.isOk) return;
    onItems(parseShowroom(answer.body.showroom));
    flash.show(ot("sh_saved"));
  };

  const handleAdd = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) return;
    let img = form.img.trim();
    if (file) {
      setIsUploading(true);
      try {
        img = await uploadPhoto(credentials, file);
      } catch {
        await dialogs.alert("Upload error");
      }
      setIsUploading(false);
    }
    setForm(EMPTY_FORM);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    await save([...items, { name, price: form.price.trim(), img, desc: form.desc.trim(), trade }]);
  };

  /* The index is the one in the FULL list, so deleting from a filtered view is still correct. */
  const shown = items.map((item, index) => ({ item, index })).filter(entry => entry.item.trade === trade);
  const count = (kind: Trade): number => items.filter(item => item.trade === kind).length;
  const tradeLabel = ot(trade === "import" ? "sh_import" : "sh_export");
  const field = (key: keyof typeof EMPTY_FORM) => ({
    value: form[key],
    onChange: (event: { target: { value: string } }) => setForm(current => ({ ...current, [key]: event.target.value })),
  });
  const tab = (kind: Trade, id: string, arrow: string, label: string) => (
    <button
      type="button"
      className={trade === kind ? "trade-tab is-on" : "trade-tab"}
      data-trade={kind}
      id={id}
      role="tab"
      aria-selected={trade === kind}
      onClick={() => setTrade(kind)}
    >
      {arrow} {label} ({count(kind)})
    </button>
  );

  return (
    <div className="panel co-panel">
      <div className="co-panel-head">
        <span className="co-ic">🛍️</span>
        <h2 id="shTitle">{ot("sh_title")}</h2>
        <FlashNote id="shSaved" flash={flash} style={{ marginLeft: "auto" }} />
      </div>
      <p className="co-sub" id="shSub">
        {ot("sh_sub")}
      </p>
      <div className="show-grid" id="showGrid">
        {shown.map(({ item, index }) => (
          <ShowCard
            key={index}
            item={item}
            deleteTitle={ot("sh_del")}
            onDelete={() => void save(items.filter((_, position) => position !== index))}
          />
        ))}
        {!shown.length && <p className="co-sub sh-empty">{ot(trade === "import" ? "sh_empty_imp" : "sh_empty_exp")}</p>}
      </div>
      <div className="trade-tabs" id="shTabs" role="tablist">
        {tab("export", "shTabExport", "⬆", ot("sh_export"))}
        {tab("import", "shTabImport", "⬇", ot("sh_import"))}
      </div>
      <form className="admin-form sh-form" id="shForm" onSubmit={handleAdd}>
        <input id="sh-name" placeholder={ot("sh_name")} required {...field("name")} />
        <input id="sh-price" placeholder={ot("sh_price")} {...field("price")} />
        <input id="sh-desc" placeholder={ot("sh_desc")} {...field("desc")} />
        <label className="sh-file-btn" id="shFileBtn">
          📷 <span id="shFileLabel">{file ? shortName(file.name) : ot("sh_file")}</span>
          <input
            type="file"
            id="sh-file"
            accept="image/*"
            hidden
            ref={fileRef}
            onChange={event => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <input id="sh-img" placeholder={ot("sh_img")} {...field("img")} />
        <button className="btn btn-primary" type="submit" id="shAdd" disabled={isUploading}>
          {isUploading ? ot("sh_uploading") : `${ot("sh_add")} — ${tradeLabel}`}
        </button>
      </form>
    </div>
  );
}
