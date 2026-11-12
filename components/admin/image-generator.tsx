"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";
import { useToast } from "./toast";
import { uploadImage } from "@/lib/firebase/storage";

/**
 * Generate article images from the post's own title and excerpt.
 *
 * Nothing is inserted automatically. AI images are a brand claim made in
 * pictures, so a human picks — the component only offers candidates and marks
 * any the screening rejected.
 */

interface Candidate {
  dataUrl: string;
  mimeType: string;
  flagged: boolean;
}

interface ImageGeneratorProps {
  /** Post title — drives the subject choice. */
  title: string;
  /** Post excerpt — adds context to the subject choice. */
  excerpt: string;
  /** Storage folder for the chosen images, e.g. `blog/<postId>`. */
  folder: string;
  /** Called with the public URLs of the images the admin accepted. */
  onAdd: (urls: string[]) => void;
}

/** Data URL → File, so the existing upload path is reused unchanged. */
function toFile(dataUrl: string, mimeType: string, name: string): File {
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
  return new File([bytes], name, { type: mimeType });
}

export function ImageGenerator({
  title,
  excerpt,
  folder,
  onAdd,
}: ImageGeneratorProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [scene, setScene] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isBusy = generating || uploadingIndex !== null;

  async function handleGenerate() {
    if (!title.trim()) {
      toast("Add a title first — it decides the subject", "error");
      return;
    }

    setGenerating(true);
    setOpen(true);
    setCandidates([]);
    setScene(null);

    try {
      const res = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, excerpt }),
      });
      const data = (await res.json()) as {
        candidates?: Candidate[];
        scene?: string;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast(data.error ?? "Image generation failed", "error");
        return;
      }

      setCandidates(data.candidates ?? []);
      setScene(data.scene ?? null);
      if (data.message) toast(data.message, "error");
    } catch (err) {
      console.error("[ImageGenerator] request failed:", err);
      toast("Network error while generating images", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleUse(index: number) {
    const candidate = candidates[index];
    if (!candidate) return;

    setUploadingIndex(index);
    try {
      const file = toFile(candidate.dataUrl, candidate.mimeType, "generated.jpg");
      const uploaded = await uploadImage(file, folder);
      onAdd([uploaded.url]);
      toast("Image added", "success");
      // Offer one at a time: a second pick would be a second image, which is a
      // separate decision.
      setCandidates([]);
      setOpen(false);
    } catch (err) {
      toast((err as Error).message || "Upload failed", "error");
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-100">
          AI image
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          isLoading={generating}
          disabled={isBusy}
        >
          <svg
            className="w-4 h-4 mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          Generate
        </Button>
      </div>

      <p className="text-xs text-gray-50">
        Builds a still life from the title. No people, and every candidate is
        screened for AI tells before it is shown.
      </p>

      {open && generating && (
        <p className="text-xs text-gray-50">Generating and screening…</p>
      )}

      {scene && (
        <p className="text-xs text-gray-60 italic">Scene: {scene}</p>
      )}

      {candidates.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {candidates.map((candidate, i) => (
            <div key={i} className="space-y-1">
              <div className="relative w-full aspect-video">
                <Image
                  src={candidate.dataUrl}
                  alt={`Generated candidate ${i + 1}`}
                  fill
                  unoptimized
                  className="rounded-lg object-cover border border-border"
                />
                {candidate.flagged && (
                  <span className="absolute top-1 left-1 bg-error-soft text-error-text text-[10px] px-1.5 py-0.5 rounded">
                    Not screened
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleUse(i)}
                isLoading={uploadingIndex === i}
                disabled={isBusy}
              >
                Use this
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
