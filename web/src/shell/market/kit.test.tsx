import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { T_MK } from "@legacy/markets-i18n.js";
import { HOSTILE, renderPage } from "../../test/renderPage";
import { AiDraft, aiErrorKey } from "./AiDraft";
import type { CopilotResult } from "./AiDraft";
import { Drawer } from "./Drawer";
import { checkedValues, fillForm, formValues } from "./MarketForm";
import { MarketTabs, TabPanel, useTabs } from "./MarketTabs";
import { KeyValues, Meters, parseMeter, parseRank, Rail, Ranks } from "./MarketParts";
import { MatchCard, parseMatchScore } from "./MatchCard";

const failed = (overrides: Partial<CopilotResult>): CopilotResult => ({
  ok: false,
  error: "",
  isOverLimit: false,
  review: "",
  data: {},
  ...overrides,
});

describe("aiErrorKey", () => {
  it("explains each way the copilot can refuse", () => {
    expect(aiErrorKey(failed({ isOverLimit: true, error: "ai_off" }))).toBe("mk_ai_limit");
    expect(aiErrorKey(failed({ error: "ai_off" }))).toBe("mk_ai_off");
    expect(aiErrorKey(failed({ error: "identify_first" }))).toBe("mk_ai_id");
    expect(aiErrorKey(failed({ error: "network" }))).toBe("mk_ai_err");
  });
});

describe("AiDraft", () => {
  it("shows the review notice, the filled rows and the assumptions as text", () => {
    const result: CopilotResult = {
      ok: true,
      error: "",
      isOverLimit: false,
      review: "Check before publishing",
      data: { assumptions: [{ field: HOSTILE, assumed: "kg", why: "typical" }], missing: ["HS code"] },
    };

    const { container } = renderPage(
      <AiDraft
        result={result}
        rows={[
          { label: "Title", value: HOSTILE },
          { label: "Markets", value: ["Poland", "Latvia"] },
          { label: "Empty", value: "" },
          { label: "None", value: [] },
        ]}
      />,
    );

    expect(screen.getByText(/Check before publishing/)).toBeTruthy();
    expect(screen.getByText("Poland, Latvia")).toBeTruthy();
    expect(screen.queryByText("Empty")).toBeNull();
    expect(screen.queryByText("None")).toBeNull();
    expect(screen.getByText(T_MK.mk_missing![0])).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows the reason instead of a draft when the copilot failed", () => {
    renderPage(<AiDraft result={failed({ error: "ai_off" })} rows={[{ label: "Title", value: "x" }]} />);

    expect(screen.getByText(T_MK.mk_ai_off![0])).toBeTruthy();
    expect(screen.queryByText("Title")).toBeNull();
  });
});

describe("MatchCard", () => {
  it("clamps the dial and limits the reasons and gaps", () => {
    const match = parseMatchScore({
      score: 140,
      confidence: "55",
      reasons: ["a", "b", "c", "d", "e"],
      gaps: ["g1", "g2", "g3", "g4"],
    });

    const { container } = renderPage(<MatchCard match={match} title="Mayiz" />);

    expect(container.querySelector<HTMLElement>(".mk-dial")?.style.getPropertyValue("--v")).toBe("100");
    expect(container.querySelectorAll(".mk-why li:not(.is-gap)")).toHaveLength(4);
    expect(container.querySelectorAll(".mk-why li.is-gap")).toHaveLength(3);
  });

  it("says so when a score comes with no explanation", () => {
    renderPage(<MatchCard match={parseMatchScore(null)} />);

    expect(screen.getByText(T_MK.mk_no_reason![0])).toBeTruthy();
  });
});

describe("ranked and metered lists", () => {
  it("reads a meter from a percentage or a yes/no", () => {
    expect(parseMeter({ key: "Cert", pct: 40, hint: "Add ISO" })).toEqual({ key: "Cert", pct: 40, hint: "Add ISO" });
    expect(parseMeter({ key: "HS", ok: true }).pct).toBe(100);
    expect(parseMeter({ key: "HS" }).pct).toBe(0);
  });

  it("scales each bar against the largest row and respects the limit", () => {
    const rows = [{ label: "A", n: 10 }, { label: "B", n: 5 }, { label: "C", n: 0 }].map(parseRank);

    const { container } = renderPage(<Ranks rows={rows} limit={2} />);

    const bars = [...container.querySelectorAll<HTMLElement>(".mk-rank i")].map(bar => bar.style.width);
    expect(bars).toEqual(["100%", "50%"]);
  });

  it("says there is no data for an empty ranking", () => {
    renderPage(<Ranks rows={[]} />);

    expect(screen.getByText(T_MK.mk_nodata![0])).toBeTruthy();
  });

  it("renders meter bars at their percentage", () => {
    const { container } = renderPage(<Meters blocks={[parseMeter({ key: "Cert", pct: 40 })]} />);

    expect(container.querySelector<HTMLElement>(".mk-bar i")?.style.width).toBe("40%");
  });

  it("marks the stages before the current one as done", () => {
    const { container } = renderPage(<Rail steps={["lead", "rfq", "quote"]} current="rfq" />);

    const states = [...container.querySelectorAll(".mk-step")].map(step => step.className.trim());
    expect(states).toEqual(["mk-step is-done", "mk-step is-now", "mk-step"]);
  });

  it("leaves blank rows out of a key-value list", () => {
    const { container } = render(<KeyValues rows={[["SKU", "A-1"], ["Brand", ""]]} />);

    expect(container.querySelectorAll("dt")).toHaveLength(1);
  });
});

describe("Drawer", () => {
  it("closes on Escape, on the backdrop and on the close button", () => {
    const onClose = vi.fn();
    render(
      <Drawer title="Mayiz" onClose={onClose}>
        <p>Body</p>
      </Drawer>,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(document.querySelector(".mk-drawer-bg")!);
    fireEvent.click(screen.getByRole("button", { name: "Yopish" }));

    expect(onClose).toHaveBeenCalledTimes(3);
    expect(screen.getByRole("dialog", { name: "Mayiz" })).toBeTruthy();
  });

  it("holds the page still while open and releases it after", () => {
    const { unmount } = render(
      <Drawer title="" onClose={() => undefined}>
        <p>Body</p>
      </Drawer>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});

describe("tabs", () => {
  function Example() {
    const tabs = useTabs<"one" | "two">("one");
    return (
      <>
        <MarketTabs
          id="tabs"
          active={tabs.active}
          onChange={tabs.open}
          tabs={[
            { value: "one", label: "One" },
            { value: "two", label: "Two" },
          ]}
        />
        <TabPanel name="one" tabs={tabs}>
          <input aria-label="kept" />
        </TabPanel>
        <TabPanel name="two" tabs={tabs}>
          <p>Second</p>
        </TabPanel>
      </>
    );
  }

  it("mounts a panel when its tab is first opened and keeps the others", () => {
    render(<Example />);
    expect(screen.queryByText("Second")).toBeNull();
    fireEvent.change(screen.getByLabelText("kept"), { target: { value: "typed" } });

    fireEvent.click(screen.getByRole("tab", { name: "Two" }));
    fireEvent.click(screen.getByRole("tab", { name: "One" }));

    expect(screen.getByText("Second").parentElement?.hidden).toBe(true);
    expect(screen.getByLabelText<HTMLInputElement>("kept").value).toBe("typed");
  });
});

describe("form helpers", () => {
  function buildForm(): HTMLFormElement {
    const form = document.createElement("form");
    form.innerHTML = `
      <input name="title" value="Old" />
      <textarea name="specs"></textarea>
      <select name="level"><option value="junior">J</option><option value="senior">S</option></select>
      <input type="checkbox" name="channels" value="b2b" checked />
      <input type="checkbox" name="channels" value="export" />
      <input type="checkbox" name="other" value="x" checked />`;
    return form;
  }

  it("reads named fields and ticked boxes", () => {
    const form = buildForm();

    expect(formValues(form)).toMatchObject({ title: "Old", specs: "", level: "junior" });
    expect(checkedValues(form, "channels")).toEqual(["b2b"]);
  });

  it("fills truthy values, joins lists and leaves the rest alone", () => {
    const form = buildForm();

    fillForm(form, { title: "", specs: ["a", "b"], level: "senior", missing: "x" });

    expect(formValues(form)).toMatchObject({ title: "Old", specs: "a, b", level: "senior" });
  });

  it("does not blank a select with a value it does not offer", () => {
    const form = buildForm();

    fillForm(form, { level: "wizard" });

    expect(formValues(form).level).toBe("junior");
  });
});
