import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchPhotoDataUrl, libraryPhotoUrl } from "@/lib/brand/creative-photo";
import { FORMATS } from "@/lib/brand/creative";

const ID = "photo-1556745753-b2904692b3cd";

function imageResponse(bytes = 6000, type = "image/jpeg") {
  return new Response(Buffer.alloc(bytes, 1), {
    status: 200,
    headers: { "content-type": type },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("libraryPhotoUrl", () => {
  it("crops the curated photo to the canvas", () => {
    const url = libraryPhotoUrl(ID, "portrait");
    expect(url).toContain(ID);
    expect(url).toContain(`w=${FORMATS.portrait.width}`);
    expect(url).toContain(`h=${FORMATS.portrait.height}`);
    expect(url).toContain("fit=crop");
  });

  it("asks for JPEG explicitly", () => {
    // `auto=format` can return WebP, which the renderer cannot decode.
    const url = libraryPhotoUrl(ID, "feed");
    expect(url).toContain("fm=jpg");
    expect(url).not.toContain("auto=format");
  });

  it("gives every format its own crop", () => {
    expect(libraryPhotoUrl(ID, "feed")).not.toBe(libraryPhotoUrl(ID, "story"));
  });
});

describe("fetchPhotoDataUrl", () => {
  it("returns a data URL for a real image", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse()));
    const result = await fetchPhotoDataUrl("https://example.com/a.jpg");
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("returns null when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("nope", { status: 404 })),
    );
    expect(await fetchPhotoDataUrl("https://example.com/a.jpg")).toBeNull();
  });

  it("returns null when the response is not an image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(imageResponse(6000, "text/html")),
    );
    expect(await fetchPhotoDataUrl("https://example.com/a.jpg")).toBeNull();
  });

  it("returns null for an image too small to be real", async () => {
    // A rate-limit notice can come back as a tiny image.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(imageResponse(1200)));
    expect(await fetchPhotoDataUrl("https://example.com/a.jpg")).toBeNull();
  });

  it("returns null when the fetch throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await fetchPhotoDataUrl("https://example.com/a.jpg")).toBeNull();
  });
});
