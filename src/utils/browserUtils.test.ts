import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";
import { downloadBlob, downloadTextFile } from "./download";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("browser helpers", () => {
  it("copies the exact generated text", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await copyToClipboard("path=/content/mybrand\np.limit=-1");
    expect(writeText).toHaveBeenCalledWith("path=/content/mybrand\np.limit=-1");
  });

  it("explains unavailable clipboard access", async () => {
    vi.stubGlobal("navigator", {});
    await expect(copyToClipboard("query")).rejects.toThrow(/copy it manually/);
  });

  it("handles a denied clipboard permission", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) },
    });
    await expect(copyToClipboard("query")).rejects.toThrow(/Copy was blocked/);
  });

  it("downloads the original Blob under the requested name and revokes its URL after clicking", () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { setTimeout });
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    const append = vi.fn();
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { append },
    });
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-download");
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const blob = new Blob(["package content"], { type: "application/zip" });
    downloadBlob("homepage-content-1.0.0.zip", blob);
    expect(create).toHaveBeenCalledWith(blob);
    expect(link.download).toBe("homepage-content-1.0.0.zip");
    expect(link.href).toBe("blob:test-download");
    expect(append).toHaveBeenCalledWith(link);
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    expect(revoke).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:test-download");
  });

  it("encodes text downloads with the requested MIME type and exact text", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("window", { setTimeout });
    const link = { href: "", download: "", click: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { append: vi.fn() },
    });
    const create = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-csv");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    downloadTextFile(
      "locale-paths.csv",
      "country,language,path\r\nus,en,/content/us/en",
      "text/csv;charset=utf-8",
    );
    const blob = create.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("text/csv;charset=utf-8");
    expect(await blob.text()).toBe(
      "country,language,path\r\nus,en,/content/us/en",
    );
    expect(link.download).toBe("locale-paths.csv");
    vi.runAllTimers();
  });
});
