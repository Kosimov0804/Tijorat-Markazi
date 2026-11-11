import { useKit } from "../../kit";
import { SectionHead } from "./fields";
import { addDocuments, removeDocument } from "./logic";
import type { StepProps } from "./StepPassport";

/** The list of attached files. Only their names and sizes travel with the project. */
export function Documents({ project, onEdit, hint }: StepProps & { hint: string }) {
  const { t } = useKit();
  return (
    <>
      <SectionHead title={t("ms_doc_title")} sub={hint} />
      {project.documents.length > 0 ? (
        <ul className="ms-docs">
          {project.documents.map((file, index) => (
            <li className="ms-doc" key={`${index}:${file.name}`}>
              <span>{file.name}</span>
              <i className="num">{Math.round((file.size || 0) / 1024)} KB</i>
              <button type="button" className="ms-x" data-ms-deldoc={index} onClick={() => onEdit(removeDocument(index))}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mk-note">{t("ms_doc_empty")}</p>
      )}
      <label className="btn btn-ghost ms-upload">
        {t("ms_doc_upload")}
        <input
          id="ms-doc-file"
          type="file"
          multiple
          hidden
          onChange={event => {
            onEdit(addDocuments(Array.from(event.target.files ?? []), Date.now()));
            /* Lets the same file be chosen again after it was removed. */
            event.target.value = "";
          }}
        />
      </label>
    </>
  );
}
