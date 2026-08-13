import { getSiteMeta } from "@shared/siteMeta";
import { useEffect } from "react";
import { useLocation } from "wouter";

function ensureMeta(selector: string, attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function DocumentHead() {
  const [location] = useLocation();

  useEffect(() => {
    const meta = getSiteMeta(location);
    document.title = meta.title;
    ensureMeta('meta[name="description"]', "name", "description", meta.description);
    ensureMeta('meta[property="og:title"]', "property", "og:title", meta.title);
    ensureMeta('meta[property="og:description"]', "property", "og:description", meta.description);
    ensureMeta('meta[name="twitter:title"]', "name", "twitter:title", meta.title);
    ensureMeta('meta[name="twitter:description"]', "name", "twitter:description", meta.description);
    ensureMeta('meta[name="robots"]', "name", "robots", meta.noindex ? "noindex, follow" : "index, follow");
  }, [location]);

  return null;
}
