import type { MediaAsset } from "@/lib/types";
import { isApprovedProductionImageAsset } from "@/lib/media/licenses";
import { PhotoWithCredit } from "./PhotoWithCredit";

export function MediaGallery({ assets }: { assets: MediaAsset[] }) {
  const photos = assets.filter(isApprovedProductionImageAsset).slice(0, 6);

  if (!photos.length) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {photos.map((asset) => (
        <PhotoWithCredit asset={asset} className="aspect-[4/3]" key={asset.id} sizes="(min-width: 768px) 50vw, 100vw" />
      ))}
    </div>
  );
}
