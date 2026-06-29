import { Fragment, Suspense, lazy, useEffect, useRef, useState } from "react";
import CaptionToggle from "./CaptionToggle";
import { cfImageUrl } from "../../utils/api";
import { getImageMetadata } from "../../utils/exif";
const InfoPanel = lazy(() => import("./InfoPanel"));

function placeholderSvg(w: number, h: number): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'/%3E`;
}

declare global {
  interface Window {
    __imageMetadataBySrc?: Map<string, any>;
  }
}

type ImageMetadata = {
  filename?: string;
  format?: string;
  size?: [number, number];
  width?: number;
  height?: number;
  exif?: Record<string, any>;
  iptc?: {
    title?: string;
    description?: string;
    location?: string;
    city?: string;
    keywords?: string;
  };
  photography?: {
    camera_make?: string;
    camera_model?: string;
    lens_model?: string;
    aperture?: string;
    shutter_speed?: string;
    iso?: number;
    focal_length?: string;
    date_original?: string;
    date_taken?: string;
    artist?: string;
    copyright?: string;
    description?: string;
    title?: string;
  };
};

type Image = {
  src: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
  metadata?: ImageMetadata;
};

export default function Carousel({ images }: { images: Image[] }) {
  const [index, setIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [userTookControl, setUserTookControl] = useState(false);
  // Only the current slide's image is revealed on initial mount; the
  // rest show a tiny inline-SVG placeholder sized to the image's
  // natural dimensions. As the user scrolls (or autoplay advances),
  // LAZY_CHUNK-sized windows of images are revealed and the browser
  // starts fetching them. This keeps the homepage's `load` event
  // from waiting on 7+ ~2MB JPEGs from the CDN, which on a slow
  // connection made the homepage hang for 30+ seconds.
  const GREEDY_COUNT = 1;
  const LAZY_CHUNK = 7;

  const [revealed, setRevealed] = useState<boolean[]>(() => images.map((_, i) => i < GREEDY_COUNT));
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const isAutoScrollingRef = useRef(false);
  const skipNextScrollRef = useRef(false);
  const programmaticNavUntilRef = useRef(0);
  const ioRef = useRef<IntersectionObserver | null>(null);
  const ioTickRef = useRef<number | null>(null);
  const requestedMetadataRef = useRef(new Set<string>());
  const [resolvedMetadataBySrc, setResolvedMetadataBySrc] = useState<Record<string, ImageMetadata | undefined>>(() => {
    const initial: Record<string, ImageMetadata | undefined> = {};
    images.forEach((img) => {
      if (img?.src && img.metadata) {
        initial[img.src] = img.metadata;
      }
    });
    return initial;
  });

  useEffect(() => {
    let cancelled = false;
    const missingImages = images.filter((img) => img?.src && !img.metadata && !requestedMetadataRef.current.has(img.src));

    if (!missingImages.length) return;

    missingImages.forEach((img) => requestedMetadataRef.current.add(img.src));

    (async () => {
      const entries = await Promise.all(
        missingImages.map(async (img) => {
          const meta = await getImageMetadata(img.src);
          return [img.src, meta] as const;
        })
      );

      if (cancelled) return;

      const successfulEntries = entries.filter(([, meta]) => !!meta) as Array<readonly [string, ImageMetadata]>;
      if (!successfulEntries.length) return;

      setResolvedMetadataBySrc((prev) => {
        const next = { ...prev };
        let changed = false;
        successfulEntries.forEach(([src, meta]) => {
          if (next[src] !== meta) {
            next[src] = meta;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [images]);

  // Publish a global lookup so the Lightbox (plain JS) can display the same metadata.
  useEffect(() => {
    const map = (window.__imageMetadataBySrc ||= new Map());
    images.forEach((img) => {
      const meta = resolvedMetadataBySrc[img.src] ?? img.metadata;
      if (!img?.src || !meta) return;
      map.set(img.src, meta);
      try {
        const path = new URL(img.src, window.location.origin).pathname;
        map.set(path, meta);
      } catch {
      }
    });
  }, [images, resolvedMetadataBySrc]);

  useEffect(() => {
    if (index >= images.length) setIndex(0);
  }, [images.length, index]);

  useEffect(() => {
    setRevealed(images.map((_, i) => i < GREEDY_COUNT));
  }, [images]);

  useEffect(() => {
    setRevealed((prev) => {
      if (index < 0 || index >= images.length) return prev;
      const chunkStart = Math.floor(index / LAZY_CHUNK) * LAZY_CHUNK;
      const chunkEnd = Math.min(chunkStart + LAZY_CHUNK, images.length);
      let changed = false;
      const next = prev.slice(0, images.length);
      while (next.length < images.length) next.push(false);
      for (let i = chunkStart; i < chunkEnd; i++) {
        if (!next[i]) {
          next[i] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [images.length, index]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, images.length);
  }, [images.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    ioRef.current?.disconnect();

    const updateIndexFromVisibility = () => {
      if (Date.now() < programmaticNavUntilRef.current) return;
      if (ioTickRef.current != null) return;
      ioTickRef.current = window.requestAnimationFrame(() => {
        ioTickRef.current = null;

        const leadingEdge = track.scrollLeft + track.clientWidth * 0.5;
        let bestIdx = 0;

        slideRefs.current.forEach((el, i) => {
          if (!el) return;
          const start = el.offsetLeft;
          const end = start + el.offsetWidth;
          if (leadingEdge >= start && leadingEdge < end) {
            bestIdx = i;
          }
        });

        if (bestIdx !== index) {
          skipNextScrollRef.current = true;
          setIndex(bestIdx);
        }
      });
    };

    const observer = new IntersectionObserver(
      () => updateIndexFromVisibility(),
      {
        root: track,
        threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );
    ioRef.current = observer;

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    updateIndexFromVisibility();

    const onResize = () => updateIndexFromVisibility();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      if (ioTickRef.current != null) {
        window.cancelAnimationFrame(ioTickRef.current);
        ioTickRef.current = null;
      }
      observer.disconnect();
    };
  }, [images.length, index]);

  // Resume autoplay when user scrolls back to curtain (scroll position near top)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      
      // Curtain is visible when scroll is less than 80% of viewport height
      if (scrollY < vh * 0.8) {
        setUserTookControl(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Autoplay effect with smooth infinite loop
  useEffect(() => {
    if (userTookControl || images.length < 2) return;

    const timer = window.setTimeout(() => {
      setIndex((i) => {
        const nextIndex = (i + 1) % images.length;
        return nextIndex;
      });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [userTookControl, images.length, index]);

  useEffect(() => {
    if (images.length < 2) return;
    let cancelled = false;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      images.forEach((img, i) => {
        if (i === 0 || !img?.src || i >= GREEDY_COUNT) return;
        const url = cfImageUrl(img.src, 1920);
        const el = new Image();
        el.decoding = "async";
        const settle = () => {
          if (cancelled) return;
          setRevealed((prev) => {
            if (i >= prev.length || prev[i]) return prev;
            const next = [...prev];
            next[i] = true;
            return next;
          });
        };
        el.onload = settle;
        el.onerror = settle;
        el.src = url;
      });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [images]);

  // Scroll to current slide
  useEffect(() => {
    // Skip if this index change came from user drag (they're already at the right position)
    if (skipNextScrollRef.current) {
      skipNextScrollRef.current = false;
      return;
    }
    
    isAutoScrollingRef.current = true;
    const el = slideRefs.current[index];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    
    // Reset flag after scroll animation completes
    const timer = setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 800);
    
    return () => clearTimeout(timer);
  }, [index]);

  // Detect user interaction: trackpad scroll, drag, touch swipe, or keyboard on the track
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let lastScrollLeft = track.scrollLeft;

    // Detect horizontal scroll (trackpad two-finger swipe)
    const handleWheel = (e: WheelEvent) => {
      // If there's horizontal scroll intent, user is taking control
      if (Math.abs(e.deltaX) > 10) {
        setUserTookControl(true);
      }
    };

    // Detect touch interactions to stop auto-scroll (without interfering with natural scrolling)
    const handleTouchStart = (e: TouchEvent) => {
      // User started touching the carousel, stop auto-scroll
      setUserTookControl(true);
    };

    // Detect scroll changes on the track (catches all scroll methods including touch swipes)
    const handleScroll = () => {
      const currentScrollLeft = track.scrollLeft;
      const scrollDelta = Math.abs(currentScrollLeft - lastScrollLeft);
      
      // If scroll changed and we're not auto-scrolling, user did it
      if (scrollDelta > 5 && !isAutoScrollingRef.current) {
        setUserTookControl(true);
      }
      
      lastScrollLeft = currentScrollLeft;
    };

    // Detect keyboard navigation (arrow keys)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        setUserTookControl(true);
      }
    };

    track.addEventListener('wheel', handleWheel, { passive: true });
    track.addEventListener('scroll', handleScroll, { passive: true });
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      track.removeEventListener('wheel', handleWheel);
      track.removeEventListener('scroll', handleScroll);
      track.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images.length, index]);

  if (!images.length) return null;

  const currentImage = images[index];
  const metadata = currentImage ? resolvedMetadataBySrc[currentImage.src] ?? currentImage.metadata : undefined;

  const onPrev = () => {
    setUserTookControl(true);
    programmaticNavUntilRef.current = Date.now() + 900;
    const newIndex = (index - 1 + images.length) % images.length;
    setIndex(newIndex);
  };

  const onNext = () => {
    setUserTookControl(true);
    programmaticNavUntilRef.current = Date.now() + 900;
    const newIndex = (index + 1) % images.length;
    setIndex(newIndex);
  };

  const onToggleInfo = () => {
    setShowInfo((s) => !s);
  };

  return (
    <div className="carousel" aria-roledescription="carousel">
      <div className="carousel-track" ref={trackRef}>
        {images.map((img, i) => (
          <Fragment key={img.src}>
            <div
              className="carousel-slide"
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
            >
              <img
                src={revealed[i] ? cfImageUrl(img.src, 1920) : placeholderSvg(img.width || img.metadata?.width || 2560, img.height || img.metadata?.height || 1920)}
                alt={img.alt || img.caption || img.metadata?.iptc?.description || img.metadata?.photography?.description || ""}
                className="carousel-image"
                width={img.width || img.metadata?.width || undefined}
                height={img.height || img.metadata?.height || undefined}
                loading={i === index ? "eager" : "lazy"}
                fetchPriority={i === index ? "high" : "low"}
                decoding="async"
              />
            </div>
            {i < images.length - 1 && <div className="carousel-gap" aria-hidden="true" />}
          </Fragment>
        ))}
      </div>

      <div className="carousel-controls">
        <button type="button" aria-label="Previous image" onClick={onPrev}>
          <span className="carousel-glyph" aria-hidden="true">
            &lt;
          </span>
        </button>
        
        <CaptionToggle enabled={showInfo} onToggle={onToggleInfo} />
        
        <button type="button" aria-label="Next image" onClick={onNext}>
          <span className="carousel-glyph" aria-hidden="true">
            &gt;
          </span>
        </button>
      </div>

      {showInfo && metadata && (
        <Suspense fallback={null}>
          <InfoPanel metadata={metadata} imageSrc={currentImage.src} onClose={onToggleInfo} />
        </Suspense>
      )}
      {showInfo && !metadata && <div className="debug-no-meta">Loading metadata…</div>}
    </div>
  );
}
