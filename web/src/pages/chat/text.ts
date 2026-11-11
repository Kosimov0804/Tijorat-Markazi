import { KG_GROUP_T } from "@legacy/group-chat.js";
import type { GroupTextKey } from "@legacy/group-chat.js";
import { useI18n } from "../../shell/i18n";

export type GroupText = (key: GroupTextKey) => string;

/** The group chat's own dictionary, in the reader's language. */
export function useGroupText(): GroupText {
  const { pick } = useI18n();
  return key => pick(KG_GROUP_T[key]);
}
