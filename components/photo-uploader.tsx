"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resizeImageFile } from "@/lib/image";
import { slugId } from "@/lib/parse-json";
import type { PhotoAsset } from "@/lib/types";

export function PhotoUploader({
  photos,
  onChange,
}: {
  photos: PhotoAsset[];
  onChange: (photos: PhotoAsset[]) => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      setBusy(true);
      setError(null);
      try {
        const next: PhotoAsset[] = [];
        for (const file of list) {
          const dataUrl = await resizeImageFile(file);
          next.push({ id: slugId("p"), dataUrl });
        }
        onChange([...photos, ...next]);
      } catch {
        setError("One of those photos wouldn't resize. Try another shot?");
      } finally {
        setBusy(false);
      }
    },
    [onChange, photos],
  );

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`rounded-3xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragOver ? "border-leaf bg-leaf/8" : "border-border bg-card"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <p className="font-heading text-lg">Show me the kitchen</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Fridge, freezer, pantry, counter — as many photos as you need. Big
          fridges welcome. I&apos;ll ignore magnets and Tupperware lids.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button
            type="button"
            className="rounded-full bg-leaf text-primary-foreground hover:bg-leaf/90"
            onClick={() => cameraRef.current?.click()}
          >
            <Camera className="size-4" />
            Take a photo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Upload
          </Button>
        </div>
        {busy ? (
          <p className="mt-3 text-sm text-muted-foreground">Resizing photos…</p>
        ) : null}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        multiple
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        multiple
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error ? <p className="text-sm text-tomato">{error}</p> : null}

      {photos.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt="Kitchen photo"
                className="aspect-square w-full rounded-2xl object-cover ring-1 ring-border"
              />
              <button
                type="button"
                className="absolute top-1 right-1 rounded-full bg-ink/80 p-1 text-paper"
                aria-label="Remove photo"
                onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
