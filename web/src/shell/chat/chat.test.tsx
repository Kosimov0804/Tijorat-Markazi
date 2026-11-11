import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FakeSocket, stubSocket } from "../../test/fakeSocket";
import { HOSTILE } from "../../test/renderPage";
import {
  AttachmentView,
  Lightbox,
  LinkedText,
  clock,
  fileToAttach,
  humanSize,
  insertAtCaret,
  parseAttachment,
  parseLinks,
  safeLinkHref,
  safeMediaUrl,
  useChatSocket,
} from "./index";

describe("links in message text", () => {
  it("turns a labelled link and a bare address into links", () => {
    const segments = parseLinks("See [the site](https://a.uz/x) or www.b.uz.");

    expect(segments).toEqual([
      { kind: "text", text: "See " },
      { kind: "link", href: "https://a.uz/x", label: "the site" },
      { kind: "text", text: " or " },
      { kind: "link", href: "http://www.b.uz", label: "www.b.uz" },
      { kind: "text", text: "." },
    ]);
  });

  it("leaves a link with a script address exactly as typed", () => {
    const { container } = render(<LinkedText text="[click](javascript:alert(1)) data:text/html,x" />);

    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toBe("[click](javascript:alert(1)) data:text/html,x");
  });

  it("renders markup in a message as text", () => {
    const { container } = render(<LinkedText text={`${HOSTILE} https://a.uz/?q=<b>`} />);

    expect(container.querySelector("img, b")).toBeNull();
    expect(container.textContent).toContain(HOSTILE);
    expect(container.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("accepts only web addresses for links", () => {
    expect(safeLinkHref(" https://a.uz ")).toBe("https://a.uz");
    expect(safeLinkHref("mailto:a@b.uz")).toBeNull();
    expect(safeLinkHref("javascript:alert(1)")).toBeNull();
  });
});

describe("attachments", () => {
  it("accepts web and same-site addresses only", () => {
    expect(safeMediaUrl("/uploads/a.png")).toBe("/uploads/a.png");
    expect(safeMediaUrl("https://cdn.uz/a.png")).toBe("https://cdn.uz/a.png");
    expect(safeMediaUrl("//evil.uz/a.png")).toBe("");
    expect(safeMediaUrl("/\\evil.uz/a.png")).toBe("");
    expect(safeMediaUrl("javascript:alert(1)")).toBe("");
    expect(safeMediaUrl(42)).toBe("");
  });

  it("drops an attachment whose address is not safe to load", () => {
    expect(parseAttachment({ kind: "image", url: "data:image/svg+xml,<svg onload=alert(1)>" })).toBeNull();
    expect(parseAttachment({ kind: "weird", url: "/uploads/a.bin", name: "a.bin", size: 2048 })).toEqual({
      kind: "file",
      url: "/uploads/a.bin",
      name: "a.bin",
      size: 2048,
      dur: 0,
    });
  });

  it("renders a hostile file name as text on the download card", () => {
    const attachment = parseAttachment({ kind: "file", url: "/uploads/a.pdf", name: HOSTILE, size: 1536 });

    const { container } = render(<AttachmentView attachment={attachment!} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".ck-file b")?.textContent).toBe(HOSTILE);
    expect(container.querySelector(".ck-file em")?.textContent).toBe("2 KB");
  });

  it("opens the viewer from an image and walks the gallery with the arrow keys", () => {
    const items = [{ url: "/uploads/1.png", from: "Ali" }, { url: "/uploads/2.png", from: "Vali" }];
    const onClose = vi.fn();

    render(<Lightbox items={items} openAt={0} onClose={onClose} />);
    const box = document.querySelector(".ck-lb")!;
    expect(box.className).toContain("open");
    expect(box.querySelector(".ck-lb-count")?.textContent).toBe("1 / 2");

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(box.querySelector("img")?.getAttribute("src")).toBe("/uploads/2.png");
    expect(box.querySelector(".ck-lb-who b")?.textContent).toBe("Vali");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("refuses a file over the size limit", async () => {
    const file = new File(["x"], "big.bin");
    Object.defineProperty(file, "size", { value: 13 * 1024 * 1024 });

    await expect(fileToAttach(file)).rejects.toThrow("too-large");
  });

  it("reads a file into the upload payload", async () => {
    const payload = await fileToAttach(new File(["hi"], "a.txt", { type: "text/plain" }));

    expect(payload).toEqual({ data: "aGk=", mime: "text/plain", name: "a.txt" });
  });
});

describe("formatting and the composer", () => {
  it("formats sizes and durations", () => {
    expect(humanSize(0)).toBe("");
    expect(humanSize(512)).toBe("512 B");
    expect(humanSize(5 * 1024 * 1024)).toBe("5.0 MB");
    expect(clock(75.4)).toBe("1:15");
  });

  it("inserts at the caret and leaves the caret after the text", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.value = "helloworld";
    input.setSelectionRange(5, 5);

    insertAtCaret(input, " 👍 ");

    expect(input.value).toBe("hello 👍 world");
    expect(input.selectionStart).toBe(9);
    input.remove();
  });
});

describe("useChatSocket", () => {
  afterEach(() => vi.useRealTimers());
  const credentials = { login: "acme", password: "pw" };

  it("signs in on open and sends only once the server has accepted", () => {
    const latest = stubSocket();
    const onMessage = vi.fn();
    const { result } = renderHook(() => useChatSocket({ isEnabled: true, credentials, onMessage }));

    act(() => latest().open());
    expect(latest().sent).toEqual([{ op: "auth", login: "acme", password: "pw" }]);
    expect(result.current.send({ op: "typing" })).toBe(false);

    act(() => latest().receive({ op: "auth", ok: true }));
    expect(result.current.isReady()).toBe(true);
    expect(result.current.send({ op: "typing", group: "g" })).toBe(true);
    expect(latest().sent.at(-1)).toEqual({ op: "typing", group: "g" });
    expect(onMessage).toHaveBeenCalledWith({ op: "auth", ok: true });
  });

  it("ignores a frame that is not a JSON object", () => {
    const latest = stubSocket();
    const onMessage = vi.fn();
    renderHook(() => useChatSocket({ isEnabled: true, credentials, onMessage }));

    act(() => {
      latest().open();
      latest().receive("not json");
      latest().receive("[1,2]");
    });

    expect(onMessage).not.toHaveBeenCalled();
  });

  it("reconnects after a drop and stops for good on unmount", () => {
    vi.useFakeTimers();
    const latest = stubSocket();
    const { result, unmount } = renderHook(() => useChatSocket({ isEnabled: true, credentials, onMessage: vi.fn() }));
    const first = latest();

    act(() => first.close());
    expect(result.current.isReady()).toBe(false);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(latest()).not.toBe(first);

    const second = latest();
    unmount();
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(second.readyState).toBe(3);
    expect(latest()).toBe(second);
  });

  it("opens nothing until it is enabled", () => {
    stubSocket();
    renderHook(() => useChatSocket({ isEnabled: false, credentials, onMessage: vi.fn() }));

    expect(FakeSocket.instances).toHaveLength(0);
  });
});
