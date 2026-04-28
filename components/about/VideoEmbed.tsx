"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

export interface VideoEmbedProps {
  vimeoId: string;
  title: string;
  posterSrc: string;
  caption?: string;
}

type ActivationReason = "scroll" | "click";

/**
 * Vimeo embed behind a poster + optional play facade. The iframe only mounts
 * after either (1) the block scrolls into view (~40% visible) — then autoplay
 * muted, satisfying browser autoplay policies — or (2) the visitor clicks play
 * first — then autoplay with sound allowed as a direct gesture.
 *
 * Parameters on the iframe URL follow Vimeo's embed docs (color, overlays, etc.).
 */
export function VideoEmbed({
  vimeoId,
  title,
  posterSrc,
  caption,
}: VideoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activation, setActivation] = useState<ActivationReason | null>(null);

  useEffect(() => {
    if (activation !== null) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        setActivation("scroll");
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [activation]);

  const iframeSrc = useMemo(() => {
    const qs = new URLSearchParams({
      autoplay: "1",
      title: "0",
      byline: "0",
      portrait: "0",
      badge: "0",
      color: "059669",
      speed: "1",
      pip: "1",
      autopause: "0",
      dnt: "1",
      player_id: "0",
    });
    // Scroll-triggered autoplay must be muted for reliable browser autoplay rules.
    if (activation === "scroll") {
      qs.set("muted", "1");
    }
    return `https://player.vimeo.com/video/${encodeURIComponent(vimeoId)}?${qs.toString()}`;
  }, [activation, vimeoId]);

  const active = activation !== null;

  return (
    <figure className="space-y-2">
      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-sm"
      >
        {active ? (
          <iframe
            src={iframeSrc}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            className="group absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            onClick={() => setActivation("click")}
            aria-label={`Play video: ${title}`}
          >
            <Image
              src={posterSrc}
              alt=""
              fill
              className="object-cover transition-opacity group-hover:opacity-95"
              sizes="(min-width: 1024px) 720px, 100vw"
              priority={false}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/30">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/95 text-white shadow-lg ring-4 ring-white/30 transition group-hover:scale-[1.03] group-hover:bg-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 h-8 w-8"
                  fill="currentColor"
                  aria-hidden
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs italic text-neutral-600">{caption}</figcaption>
      )}
    </figure>
  );
}
