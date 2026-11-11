import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replaceWith } from "../../shell/navigate";
import { renderPage, setSearch, stubApi } from "../../test/renderPage";
import { KirishPage } from "./KirishPage";
import { TEXT } from "./text";

vi.mock("../../shell/navigate", () => ({ goTo: vi.fn(), replaceWith: vi.fn() }));

type FetchStub = ReturnType<typeof vi.fn>;

const loginBodies = (): unknown[] =>
  (fetch as unknown as FetchStub).mock.calls
    .filter(([url]) => url === "/api/auth/login")
    .map(([, options]) => JSON.parse(String((options as RequestInit).body)));

function signIn(login: string, password: string): void {
  fireEvent.change(screen.getByLabelText(TEXT.ki_login[0]), { target: { value: login } });
  fireEvent.change(screen.getByLabelText(TEXT.ki_pass[0]), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: TEXT.ki_btn[0] }));
}

describe("KirishPage", () => {
  afterEach(() => setSearch(""));

  it("opens the cabinet the credentials belong to and stores its session keys", async () => {
    stubApi({
      "/api/auth/login": {
        ok: true,
        target: "company.html",
        keys: { kg_co: '{"login":"alfa"}', "evil key": "x", mk_other: "y" },
      },
    });
    renderPage(<KirishPage />);

    signIn("  alfa ", "secret-pass");

    await waitFor(() => expect(replaceWith).toHaveBeenCalledWith("company.html"));
    expect(loginBodies()).toEqual([{ login: "alfa", password: "secret-pass" }]);
    expect(sessionStorage.getItem("kg_co")).toBe('{"login":"alfa"}');
    expect(sessionStorage.getItem("evil key")).toBeNull();
    expect(sessionStorage.getItem("mk_other")).toBeNull();
  });

  it("returns to a same-site ?next= page after signing in", async () => {
    setSearch("?next=bozor.html");
    stubApi({ "/api/auth/login": { ok: true, target: "company.html" } });
    renderPage(<KirishPage />);

    signIn("alfa", "secret-pass");

    await waitFor(() => expect(replaceWith).toHaveBeenCalledWith("bozor.html"));
  });

  it.each(["https://evil.example/x.html", "//evil.example/a.html", "kirish.html", "a/b.html"])(
    "ignores the unsafe ?next= %s",
    async next => {
      setSearch(`?next=${encodeURIComponent(next)}`);
      stubApi({ "/api/auth/login": { ok: true, target: "company.html" } });
      renderPage(<KirishPage />);

      signIn("alfa", "secret-pass");

      await waitFor(() => expect(replaceWith).toHaveBeenCalledWith("company.html"));
    },
  );

  it("asks for both fields before contacting the server", () => {
    stubApi({});
    renderPage(<KirishPage />);

    /* Submitted directly: the browser's own "required" check stops a click
       first, and this is the page's check behind it. */
    fireEvent.change(screen.getByLabelText(TEXT.ki_login[0]), { target: { value: "alfa" } });
    fireEvent.submit(document.querySelector("#kiForm")!);

    expect(screen.getByRole("alert").textContent).toBe(TEXT.ki_empty[0]);
    expect(loginBodies()).toHaveLength(0);
  });

  it("gives one message for a refused sign-in and clears the password", async () => {
    stubApi({ "/api/auth/login": 401 });
    renderPage(<KirishPage />);

    signIn("alfa", "wrong-pass");

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(TEXT.ki_bad[0]));
    expect(screen.getByLabelText<HTMLInputElement>(TEXT.ki_pass[0]).value).toBe("");
    expect(replaceWith).not.toHaveBeenCalled();
  });

  it("refuses a target that is not a page of this site", async () => {
    stubApi({ "/api/auth/login": { ok: true, target: "https://evil.example/company.html" } });
    renderPage(<KirishPage />);

    signIn("alfa", "secret-pass");

    await waitFor(() => expect(screen.getByRole("alert").textContent).toBe(TEXT.ki_bad[0]));
    expect(replaceWith).not.toHaveBeenCalled();
  });

  it("sends someone already signed in straight to their cabinet", () => {
    stubApi({});
    sessionStorage.setItem("kg_by", JSON.stringify({ login: "buyer" }));

    renderPage(<KirishPage />);

    expect(replaceWith).toHaveBeenCalledWith("xaridor.html");
  });

  it("follows the language switch", () => {
    stubApi({});
    localStorage.setItem("kg_lang", "ru");

    renderPage(<KirishPage />);

    expect(screen.getByRole("heading", { level: 1, name: TEXT.ki_title[1] })).toBeTruthy();
    expect(document.title).toBe(`${TEXT.ki_title[1]} — TIJORAT MARKAZI`);
  });
});
