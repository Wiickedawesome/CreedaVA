import { describe, it, expect, vi } from "vitest";

// Mock Firebase modules to prevent initialization during import
vi.mock("@/lib/firebase/ai", () => ({ generateJSON: vi.fn() }));
vi.mock("@/lib/firebase/firestore", () => ({ update: vi.fn() }));
vi.mock("@/lib/firebase/config", () => ({
  app: {},
  auth: {},
  db: {},
}));

import {
  getTranslatedTitle,
  getTranslatedContent,
  getTranslatedExcerpt,
} from "@/lib/firebase/translate";

describe("getTranslatedTitle", () => {
  it("returns original title when no translations exist", () => {
    const item = { title: "Hello World", lang: "en" };
    expect(getTranslatedTitle(item, "es")).toBe("Hello World");
  });

  it("returns original title when viewing in source language", () => {
    const item = {
      title: "Hello World",
      lang: "en",
      translations: { es: { title: "Hola Mundo", content: "contenido" } },
    };
    expect(getTranslatedTitle(item, "en")).toBe("Hello World");
  });

  it("returns translated title for target locale", () => {
    const item = {
      title: "Hello World",
      lang: "en",
      translations: { es: { title: "Hola Mundo", content: "contenido" } },
    };
    expect(getTranslatedTitle(item, "es")).toBe("Hola Mundo");
  });

  it("falls back to original when translation for locale is missing", () => {
    const item = {
      title: "Hello World",
      lang: "en",
      translations: { fr: { title: "Bonjour le monde", content: "contenu" } },
    };
    expect(getTranslatedTitle(item, "es")).toBe("Hello World");
  });

  it("falls back when translation exists but title is missing", () => {
    const item = {
      title: "Hello World",
      lang: "en",
      translations: { es: { content: "contenido" } },
    };
    expect(getTranslatedTitle(item, "es")).toBe("Hello World");
  });
});

describe("getTranslatedContent", () => {
  it("returns original content when no translations exist", () => {
    const item = { content: "<p>Hello</p>", lang: "en" };
    expect(getTranslatedContent(item, "es")).toBe("<p>Hello</p>");
  });

  it("returns original content when viewing in source language", () => {
    const item = {
      content: "<p>Hello</p>",
      lang: "en",
      translations: { es: { content: "<p>Hola</p>" } },
    };
    expect(getTranslatedContent(item, "en")).toBe("<p>Hello</p>");
  });

  it("returns translated content for target locale", () => {
    const item = {
      content: "<p>Hello</p>",
      lang: "en",
      translations: { es: { content: "<p>Hola</p>" } },
    };
    expect(getTranslatedContent(item, "es")).toBe("<p>Hola</p>");
  });
});

describe("getTranslatedExcerpt", () => {
  it("returns original excerpt when no translations exist", () => {
    const item = { excerpt: "A short summary", lang: "en" };
    expect(getTranslatedExcerpt(item, "es")).toBe("A short summary");
  });

  it("returns translated excerpt for target locale", () => {
    const item = {
      excerpt: "A short summary",
      lang: "en",
      translations: { es: { content: "contenido", excerpt: "Un breve resumen" } },
    };
    expect(getTranslatedExcerpt(item, "es")).toBe("Un breve resumen");
  });

  it("falls back to original when excerpt is missing in translation", () => {
    const item = {
      excerpt: "A short summary",
      lang: "en",
      translations: { es: { content: "contenido" } },
    };
    expect(getTranslatedExcerpt(item, "es")).toBe("A short summary");
  });
});
