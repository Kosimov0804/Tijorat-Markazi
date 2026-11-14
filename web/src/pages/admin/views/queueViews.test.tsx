import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dialogs } from "../../../shell/dialogs";
import { HOSTILE } from "../../../test/renderPage";
import { button, renderView, stubRoutes, type, uz } from "../testKit";
import type { Sent } from "../testKit";

const ANALYSTS = "/api/analyst/accounts";
const analyst = { id: "n1", name: HOSTILE, org: "Markaz", login: "tahlil1", scopes: ["bozor", "moliya"] };

describe("analysts view", () => {
  it("lists the accounts with their markets and never a password", async () => {
    stubRoutes({ [ANALYSTS]: { analysts: [analyst] } });
    renderView("analysts");

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText("tahlil1")).toBeTruthy();
    expect(screen.getByText(uz("pw_hidden"))).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("adds an account with the chosen markets", async () => {
    const api = stubRoutes({ [ANALYSTS]: { analysts: [] } });
    renderView("analysts");
    await screen.findByText(uz("an_none"));

    type(screen.getByLabelText(uz("an_name")), "Dilnoza");
    type(screen.getByLabelText(uz("an_login")), " dil ");
    type(screen.getByLabelText(uz("an_pass")), "pw-98765");
    fireEvent.click(screen.getByLabelText("mehnat"));
    fireEvent.click(button(uz("an_add")));

    await waitFor(() => expect(api.bodies(ANALYSTS).map(body => body.op)).toEqual(["list", "add", "list"]));
    expect(api.bodies(ANALYSTS)[1]).toEqual({
      pass: "admin",
      op: "add",
      name: "Dilnoza",
      org: "",
      alogin: "dil",
      apassword: "pw-98765",
      scopes: ["bozor", "moliya"],
    });
  });

  it("refuses to add an account without a login and a password", async () => {
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue(undefined);
    const api = stubRoutes({ [ANALYSTS]: { analysts: [] } });
    renderView("analysts");
    await screen.findByText(uz("an_none"));

    fireEvent.click(button(uz("an_add")));

    await waitFor(() => expect(alert).toHaveBeenCalledWith(uz("an_need")));
    expect(api.bodies(ANALYSTS)).toHaveLength(1);
  });

  it("deletes an account only after the confirmation is accepted", async () => {
    const confirm = vi.spyOn(dialogs, "confirm").mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const api = stubRoutes({ [ANALYSTS]: { analysts: [analyst] } });
    renderView("analysts");
    await screen.findByText("tahlil1");

    fireEvent.click(button(uz("an_del")));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(uz("an_confirm"), { tone: "danger" }));
    expect(api.bodies(ANALYSTS)).toHaveLength(1);

    fireEvent.click(button(uz("an_del")));
    await waitFor(() => expect(api.bodies(ANALYSTS)[1]).toEqual({ pass: "admin", op: "del", id: "n1" }));
  });
});

const LIST = "/api/register/list";
const DECIDE = "/api/register/decide";
const application = {
  id: "b1",
  status: "pending",
  name: HOSTILE,
  ref: "BY-1",
  login: "buyer1",
  phone: "+998 (90) 123-45-67",
  email: "javascript:alert(1)",
  created: 1_750_000_000_000,
};
const buyers = { ok: true, counts: { pending: 1 }, items: [application] };

describe("buyers view", () => {
  it("shows the pending applications with safe contact links", async () => {
    const api = stubRoutes({ [LIST]: buyers });
    renderView("buyers");

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(api.bodies(LIST)[0]).toEqual({ pass: "admin", kind: "buyer", status: "pending" });
    expect(screen.getByRole("link", { name: /123-45-67/ }).getAttribute("href")).toBe("tel:+998901234567");
    expect(screen.queryByRole("link", { name: /javascript/ })).toBeNull();
    expect(document.querySelector("img")).toBeNull();
  });

  it("says so when the queue cannot be loaded", async () => {
    stubRoutes({
      [LIST]: () => {
        throw new Error("offline");
      },
    });
    renderView("buyers");

    expect(await screen.findByText(uz("bq_fail"))).toBeTruthy();
  });

  it("approves an application once the confirmation is accepted", async () => {
    const confirm = vi.spyOn(dialogs, "confirm").mockResolvedValue(true);
    const api = stubRoutes({ [LIST]: buyers, [DECIDE]: { ok: true } });
    renderView("buyers");
    await screen.findByText("BY-1");

    fireEvent.click(button(uz("bq_approve")));

    await waitFor(() => expect(api.bodies(DECIDE)).toEqual([{ pass: "admin", kind: "buyer", id: "b1", action: "approve" }]));
    expect(confirm).toHaveBeenCalledWith(uz("bq_confirm"));
    await waitFor(() => expect(api.bodies(LIST)).toHaveLength(2));
  });

  it("rejects only with a reason, and reports a refusal from the server", async () => {
    const prompt = vi.spyOn(dialogs, "prompt").mockResolvedValueOnce("   ").mockResolvedValueOnce(" No licence ");
    const alert = vi.spyOn(dialogs, "alert").mockResolvedValue(undefined);
    const api = stubRoutes({ [LIST]: buyers, [DECIDE]: { ok: false } });
    renderView("buyers");
    await screen.findByText("BY-1");

    fireEvent.click(button(uz("bq_reject")));
    await waitFor(() => expect(prompt).toHaveBeenCalledTimes(1));
    expect(api.bodies(DECIDE)).toEqual([]);

    fireEvent.click(button(uz("bq_reject")));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(uz("bq_fail")));
    expect(api.bodies(DECIDE)).toEqual([{ pass: "admin", kind: "buyer", id: "b1", action: "reject", reason: "No licence" }]);
  });

  it("loads another tab's applications when the tab is pressed", async () => {
    const api = stubRoutes({ [LIST]: buyers });
    renderView("buyers");
    await screen.findByText("BY-1");

    fireEvent.click(button(uz("bq_all")));

    await waitFor(() => expect(api.bodies(LIST).at(-1)).toEqual({ pass: "admin", kind: "buyer", status: "" }));
  });
});

const REQUESTS = "/api/legal/requests";
const ANSWER = "/api/legal/answer";
const request = {
  id: "r1",
  ref: "DSR-7",
  subjectName: HOSTILE,
  subjectEmail: "a@b.uz",
  kind: "erase",
  created: 1_750_000_000_000,
  due: 1_750_900_000_000,
  overdue: true,
  status: "open",
};

describe("data requests view", () => {
  it("marks an overdue request and prints its subject as text", async () => {
    stubRoutes({ [REQUESTS]: { items: [request], overdue: 1 } });
    renderView("dsr");

    const row = (await screen.findByText("DSR-7")).closest("tr") as HTMLElement;
    expect(row.className).toBe("dsr-late");
    expect(within(row).getByText(HOSTILE)).toBeTruthy();
    expect(within(row).getByText(uz("dsr_overdue"))).toBeTruthy();
    expect(document.querySelector("img")).toBeNull();
  });

  it("will not send an empty answer, a refusal included", async () => {
    const api = stubRoutes({ [REQUESTS]: { items: [request] } });
    renderView("dsr");
    await screen.findByText("DSR-7");

    fireEvent.click(button(uz("dsr_refuse")));

    expect(screen.getByRole("alert").textContent).toBe(uz("dsr_need_ans"));
    expect(api.bodies(ANSWER)).toEqual([]);
  });

  it("sends a reasoned refusal and reloads the queue", async () => {
    const api = stubRoutes({ [REQUESTS]: { items: [request] }, [ANSWER]: { ok: true } });
    renderView("dsr");
    await screen.findByText("DSR-7");

    type(screen.getByRole("textbox"), "  Tax records are kept for five years.  ");
    fireEvent.click(button(uz("dsr_refuse")));

    await waitFor(() => expect(api.bodies(REQUESTS)).toHaveLength(2));
    expect(api.bodies(ANSWER)).toEqual([
      { pass: "admin", id: "r1", answer: "Tax records are kept for five years.", refuse: true },
    ]);
  });
});

const APPEALS = "/api/appeals";
const appeal = {
  id: "p 1",
  subject: HOSTILE,
  stage: "assoc",
  companyName: "Alfa",
  agency: "Soliq",
  body: "Matn",
  history: [{ stage: "new", by: "alfa" }, { stage: "assoc", by: "uyushma", note: "maʼqul" }],
};

describe("government appeals view", () => {
  it("lists an appeal with its trail and Word download", async () => {
    stubRoutes({ [APPEALS]: { items: [appeal] } });
    renderView("appeals");

    expect(await screen.findByText(HOSTILE)).toBeTruthy();
    expect(screen.getByText(/uyushma · maʼqul/)).toBeTruthy();
    expect(screen.getByRole("button", { name: uz("ap_doc") })).toBeTruthy();
    expect(document.querySelector('a[href*="pass="]')).toBeNull();
  });

  it("records the next stage together with the note", async () => {
    const api = stubRoutes({
      [APPEALS]: (body: Sent) => ({ items: [{ ...appeal, stage: body.op === "stage" ? "sent" : "assoc" }] }),
    });
    renderView("appeals");
    await screen.findByText(HOSTILE);

    type(screen.getByLabelText(uz("ap_note")), "№ 12");
    fireEvent.click(button(uz("ap_send")));

    expect(await screen.findByRole("button", { name: uz("ap_answer") })).toBeTruthy();
    expect(api.bodies(APPEALS).at(-1)).toEqual({ pass: "admin", op: "stage", id: "p 1", stage: "sent", note: "№ 12" });
  });
});
