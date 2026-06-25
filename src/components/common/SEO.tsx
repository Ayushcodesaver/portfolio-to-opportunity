import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
}

/** Lightweight SEO head manager — no extra deps. */
export function SEO({ title, description, canonical, image }: SEOProps) {
  useEffect(() => {
    const fullTitle = title.length > 60 ? title.slice(0, 57) + "…" : title;
    document.title = fullTitle;

    const set = (selector: string, attr: string, value: string) => {
      let el = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!el) {
        const tag = selector.startsWith("link") ? "link" : "meta";
        el = document.createElement(tag) as any;
        const m = selector.match(/\[([^=]+)="([^"]+)"\]/);
        if (m) el!.setAttribute(m[1], m[2]);
        document.head.appendChild(el!);
      }
      el!.setAttribute(attr, value);
    };

    if (description) {
      const d = description.length > 160 ? description.slice(0, 157) + "…" : description;
      set('meta[name="description"]', "content", d);
      set('meta[property="og:description"]', "content", d);
      set('meta[name="twitter:description"]', "content", d);
    }
    set('meta[property="og:title"]', "content", fullTitle);
    set('meta[name="twitter:title"]', "content", fullTitle);
    set('meta[property="og:type"]', "content", "website");
    set('meta[name="twitter:card"]', "content", "summary_large_image");

    if (image) {
      set('meta[property="og:image"]', "content", image);
      set('meta[name="twitter:image"]', "content", image);
    }
    if (canonical) {
      set('link[rel="canonical"]', "href", canonical);
    } else {
      set('link[rel="canonical"]', "href", window.location.href.split("?")[0]);
    }
  }, [title, description, canonical, image]);

  return null;
}
