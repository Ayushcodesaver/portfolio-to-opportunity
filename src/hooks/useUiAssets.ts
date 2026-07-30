import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UiAsset = {
  id: string;
  name: string;
  storage_path: string;
  kind: string;
  page: string;
  position: string;
  opacity: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export const ASSET_KINDS = ["sticker", "overlay", "background"] as const;
export const ASSET_PAGES = ["global", "landing", "pricing", "showcase", "login", "register"] as const;
export const ASSET_POSITIONS = [
  "top-left", "top-right", "bottom-left", "bottom-right", "center",
] as const;

/** Signed URL for a private ui-assets object (valid 1 hour). */
export async function signedAssetUrl(path: string) {
  const { data } = await supabase.storage.from("ui-assets").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Live list of decorative assets. Pass a page to filter to active assets for that page. */
export function useUiAssets(page?: string) {
  const [assets, setAssets] = useState<UiAsset[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    let q = supabase.from("ui_assets").select("*").order("sort_order").order("created_at");
    if (page) q = q.eq("is_active", true).in("page", [page, "global"]);
    const { data } = await q;
    const rows = (data ?? []) as UiAsset[];
    setAssets(rows);
    const entries = await Promise.all(
      rows.map(async (a) => [a.id, await signedAssetUrl(a.storage_path)] as const),
    );
    setUrls(Object.fromEntries(entries.filter(([, u]) => u)) as Record<string, string>);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`ui_assets_${page ?? "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ui_assets" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return { assets, urls, loading, reload: load };
}
