import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HOSTILE, renderPage, stubApi } from "../../test/renderPage";
import { ConferencePage } from "./ConferencePage";
import { formatConferenceTime } from "./ConferenceCard";

const API = "/api/conference";
const NOW = new Date("2030-01-01T09:00:00").getTime();
const at = (time: string): string => `2030-01-01T${time}:00`;

function signIn(): void {
  localStorage.setItem("kg_email", "ali@x.uz");
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("ConferencePage gate", () => {
  it("asks for an email and hides the conference until one is given", () => {
    stubApi({});

    const { container } = renderPage(<ConferencePage />);

    expect(container.querySelector<HTMLElement>("#confLogin")?.hidden).toBe(false);
    expect(container.querySelector<HTMLElement>("#confApp")?.hidden).toBe(true);
    expect(document.activeElement?.id).toBe("emailInput");
  });

  it("ignores a stored value that is not an email", () => {
    localStorage.setItem("kg_email", "not-an-email");
    stubApi({});

    const { container } = renderPage(<ConferencePage />);

    expect(container.querySelector<HTMLElement>("#confLogin")?.hidden).toBe(false);
  });

  it("rejects an invalid email, then lowercases and stores a valid one", async () => {
    stubApi({ [API]: {} });
    const { container } = renderPage(<ConferencePage />);
    const input = container.querySelector<HTMLInputElement>("#emailInput")!;

    fireEvent.change(input, { target: { value: "a@b" } });
    fireEvent.submit(container.querySelector("#emailForm")!);
    expect(screen.getByText("Töğri email kiriting")).toBeTruthy();

    fireEvent.change(input, { target: { value: " Ali@X.uz " } });
    fireEvent.submit(container.querySelector("#emailForm")!);
    await flush();

    expect(localStorage.getItem("kg_email")).toBe("ali@x.uz");
    expect(container.querySelector("#uEmail")?.textContent).toBe("ali@x.uz");
  });

  it("forgets the email when switching", async () => {
    signIn();
    stubApi({ [API]: {} });
    const { container } = renderPage(<ConferencePage />);
    await flush();

    fireEvent.click(container.querySelector("#switchEmail")!);

    expect(localStorage.getItem("kg_email")).toBeNull();
    expect(container.querySelector<HTMLElement>("#confLogin")?.hidden).toBe(false);
  });
});

describe("ConferencePage card", () => {
  afterEach(() => vi.useRealTimers());

  async function renderAt(conference: object) {
    vi.useFakeTimers({ now: NOW, toFake: ["Date", "setInterval", "clearInterval"] });
    signIn();
    stubApi({ [API]: conference });
    const view = renderPage(<ConferencePage />);
    await flush();
    return view;
  }

  it("says so when nothing is scheduled", async () => {
    await renderAt({});

    expect(screen.getByText("Konferensiya rejalaştirilmagan")).toBeTruthy();
  });

  it("counts down and keeps the join link closed before the window opens", async () => {
    const { container } = await renderAt({ id: "c1", title: "Yig'ilish", datetime: at("12:00"), link: "https://meet.example/x" });
    const button = container.querySelector("#joinBtn")!;

    expect(button.hasAttribute("href")).toBe(false);
    expect(button.className).toContain("disabled");
    expect([...container.querySelectorAll(".cu b")].map(node => node.textContent)).toEqual(["03", "00", "00"]);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect([...container.querySelectorAll(".cu b")].map(node => node.textContent)).toEqual(["02", "59", "59"]);
  });

  it("opens the join link ten minutes before the start, through the server", async () => {
    const { container } = await renderAt({ id: "c 1", title: "Yig'ilish", datetime: at("09:10"), link: "https://meet.example/x" });

    expect(container.querySelector("#joinBtn")?.getAttribute("href")).toBe("/api/conference/join?id=c%201");
    expect(container.querySelector(".conf-live")).not.toBeNull();
    expect(container.querySelector<HTMLElement>("#joinHint")?.hidden).toBe(true);
  });

  it("goes live with the button disabled when the room is missing", async () => {
    const { container } = await renderAt({ title: "Yig'ilish", datetime: at("08:00") });

    expect(container.querySelector(".conf-live")).not.toBeNull();
    expect(container.querySelector("#joinBtn")?.hasAttribute("href")).toBe(false);
    expect(container.querySelector<HTMLElement>("#joinHint")?.hidden).toBe(false);
  });

  it("never links out to a non-web address", async () => {
    const { container } = await renderAt({ title: "Yig'ilish", datetime: at("08:00"), link: "javascript:alert(1)" });

    expect(container.querySelector("#joinBtn")?.hasAttribute("href")).toBe(false);
  });

  it("renders hostile titles as text", async () => {
    const { container } = await renderAt({ title: HOSTILE, desc: HOSTILE, datetime: at("08:00") });

    expect(screen.getByRole("heading", { level: 1, name: HOSTILE })).toBeTruthy();
    expect(container.querySelector("#confCard img")).toBeNull();
  });
});

describe("formatConferenceTime", () => {
  it("writes the month in the visitor's language", () => {
    expect(formatConferenceTime(at("09:05"), "ru")).toBe("1 января 2030, 09:05");
  });

  it("returns an unparseable value as written", () => {
    expect(formatConferenceTime("soon", "uz")).toBe("soon");
    expect(formatConferenceTime(undefined, "uz")).toBe("—");
  });
});
