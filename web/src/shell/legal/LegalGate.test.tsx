import { useState } from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { GATE_TEXT } from "./gateText";
import { LegalGate, useConsentGate, useLegalGate } from "./LegalGate";

const CONFIG = {
  ok: true,
  ready: true,
  operator: { brand: HOSTILE, legalName: HOSTILE, email: HOSTILE },
  docs: { oferta: { version: "1.0", effective: "2026-01-01" } },
};

const acceptButton = (): HTMLButtonElement => screen.getByRole("button", { name: GATE_TEXT.accept[0] });

/* jsdom lays nothing out, so a tall document has to be described to it. */
function pretendDocumentIsTall(): void {
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(2000);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
}

function ConsentHarness({ onSent }: { onSent: (isChecked: boolean) => void }) {
  const consent = useConsentGate();
  const [attempts, setAttempts] = useState(0);
  return (
    <>
      <input
        type="checkbox"
        aria-label="consent"
        checked={consent.isChecked}
        onChange={event => consent.setChecked(event.target.checked)}
      />
      <button
        type="button"
        onClick={async () => {
          setAttempts(count => count + 1);
          if (await consent.confirm()) onSent(true);
        }}
      >
        send {attempts}
      </button>
      <button type="button" onClick={consent.reset}>
        reset
      </button>
      {consent.gate}
    </>
  );
}

function ReadOnlyHarness() {
  const { gate, openReadOnly } = useLegalGate();
  return (
    <>
      <button type="button" onClick={openReadOnly}>
        reread
      </button>
      {gate}
    </>
  );
}

describe("LegalGate", () => {
  it("keeps acceptance disabled until the end of the offer has been reached", async () => {
    stubApi({ "/api/legal": CONFIG });
    pretendDocumentIsTall();
    const onSettle = vi.fn();
    renderPage(<LegalGate onSettle={onSettle} />);
    await waitFor(() => expect(document.querySelector(".lgate-body .lg-body")).toBeTruthy());

    expect(acceptButton().disabled).toBe(true);
    expect(screen.getByText(GATE_TEXT.hint[0])).toBeTruthy();

    fireEvent.scroll(document.querySelector("#lgateBody")!, { target: { scrollTop: 1600 } });

    expect(acceptButton().disabled).toBe(false);
    expect(screen.getByText(GATE_TEXT.ready[0])).toBeTruthy();
    fireEvent.click(acceptButton());
    expect(onSettle).toHaveBeenCalledWith(true);
  });

  it("counts a document short enough to need no scrolling as read on sight", async () => {
    stubApi({ "/api/legal": CONFIG });

    renderPage(<LegalGate onSettle={vi.fn()} />);

    await waitFor(() => expect(acceptButton().disabled).toBe(false));
  });

  it("does not unlock acceptance from the end of the privacy policy", async () => {
    stubApi({ "/api/legal": CONFIG });
    pretendDocumentIsTall();
    renderPage(<LegalGate onSettle={vi.fn()} />);
    await waitFor(() => expect(document.querySelector(".lgate-body .lg-body")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: GATE_TEXT.tab_mx[0] }));
    fireEvent.scroll(document.querySelector("#lgateBody")!, { target: { scrollTop: 1600 } });

    expect(acceptButton().disabled).toBe(true);
  });

  it("still shows the offer when the requisites cannot be loaded", async () => {
    stubApi({ "/api/legal": 500 });

    renderPage(<LegalGate onSettle={vi.fn()} />);

    await waitFor(() => expect(document.querySelectorAll(".lgate-body .lg-sec").length).toBeGreaterThan(0));
    await waitFor(() => expect(acceptButton().disabled).toBe(false));
  });

  it("renders hostile requisites as text", async () => {
    stubApi({ "/api/legal": CONFIG });

    renderPage(<LegalGate onSettle={vi.fn()} />);

    await waitFor(() => expect(document.querySelector(".lgate-body .lg-body")).toBeTruthy());
    expect(document.querySelector(".lgate img")).toBeNull();
  });

  it("dismisses on Escape and on cancel, but not on a backdrop click", async () => {
    stubApi({ "/api/legal": CONFIG });
    const onSettle = vi.fn();
    renderPage(<LegalGate onSettle={onSettle} />);

    fireEvent.mouseDown(document.querySelector(".lgate-back")!);
    expect(onSettle).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: GATE_TEXT.cancel[0] }));
    expect(onSettle.mock.calls).toEqual([[false], [false]]);
  });

  it("offers only a close button when read-only, and closes on the backdrop", async () => {
    stubApi({ "/api/legal": CONFIG });
    renderPage(<ReadOnlyHarness />);

    fireEvent.click(screen.getByText("reread"));

    expect(screen.getByRole("heading", { name: GATE_TEXT.title_ro[0] })).toBeTruthy();
    expect(screen.queryByRole("button", { name: GATE_TEXT.accept[0] })).toBeNull();
    fireEvent.mouseDown(document.querySelector(".lgate-back")!);
    expect(document.querySelector(".lgate")).toBeNull();
  });
});

describe("useConsentGate", () => {
  it("ticks the box on acceptance and does not ask twice", async () => {
    stubApi({ "/api/legal": CONFIG });
    const onSent = vi.fn();
    renderPage(<ConsentHarness onSent={onSent} />);

    fireEvent.click(screen.getByText("send 0"));
    await waitFor(() => expect(acceptButton().disabled).toBe(false));
    fireEvent.click(acceptButton());

    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText<HTMLInputElement>("consent").checked).toBe(true);

    fireEvent.click(screen.getByText("send 1"));
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(2));
    expect(document.querySelector(".lgate")).toBeNull();
  });

  it("sends nothing when the offer is dismissed, even with the box ticked by hand", async () => {
    stubApi({ "/api/legal": CONFIG });
    const onSent = vi.fn();
    renderPage(<ConsentHarness onSent={onSent} />);
    fireEvent.click(screen.getByLabelText("consent"));

    fireEvent.click(screen.getByText("send 0"));
    fireEvent.click(await screen.findByRole("button", { name: GATE_TEXT.cancel[0] }));

    await waitFor(() => expect(document.querySelector(".lgate")).toBeNull());
    expect(onSent).not.toHaveBeenCalled();
  });

  it("asks again after the box is unticked or the form is reset", async () => {
    stubApi({ "/api/legal": CONFIG });
    renderPage(<ConsentHarness onSent={vi.fn()} />);
    fireEvent.click(screen.getByText("send 0"));
    await waitFor(() => expect(acceptButton().disabled).toBe(false));
    fireEvent.click(acceptButton());
    await waitFor(() => expect(document.querySelector(".lgate")).toBeNull());

    fireEvent.click(screen.getByLabelText("consent"));
    fireEvent.click(screen.getByText("send 1"));
    await waitFor(() => expect(acceptButton().disabled).toBe(false));
    fireEvent.click(acceptButton());
    await waitFor(() => expect(document.querySelector(".lgate")).toBeNull());

    fireEvent.click(screen.getByText("reset"));
    expect(screen.getByLabelText<HTMLInputElement>("consent").checked).toBe(false);
    fireEvent.click(screen.getByText("send 2"));
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });
});
