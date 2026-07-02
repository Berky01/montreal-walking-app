# Photo Sourcing

## Acceptable Image States

1. `owned_internal`
2. Public domain
3. CC0
4. CC-BY with attribution
5. CC-BY-SA with attribution and share-alike obligation noted
6. Generated local visual fallback

## Rejected Image States

1. Unknown license
2. All rights reserved
3. CC-BY-NC or other non-commercial licenses
4. No source URL
5. No creator/credit when required
6. Hotlinked remote image without permission
7. Copied official website image without explicit license

## Attribution Rules

- Store `creator`, `title`, `sourceUrl`, `licenseName`, `licenseUrl`, and `attributionText`.
- Keep attribution visible on hero/detail media and available in detail sections.
- CC-BY-SA assets must set `licenseRequiresShareAlike: true`.
- Public-domain/CC0 assets still keep source and title metadata for auditability.

## Download And Storage Rules

- Download approved images into `public/media/places/`, `public/media/routes/`, or `public/media/neighborhoods/`.
- Use local paths such as `/media/places/place-darmes.jpg` in production.
- Do not render direct `https://upload.wikimedia.org/...` or other remote media URLs.
- Keep `originalUrl` and `sourceUrl` in metadata for review.

## Manual Add Flow

1. Confirm license permits commercial reuse.
2. Download the image into `public/media/...`.
3. Add a `MediaAsset` entry to `data/media/media-assets.json`.
4. Include alt text, creator, source URL, license name/URL, dimensions if known, owner id, and status `approved`.
5. Run `npm run validate:media`, `npm run typecheck`, and the relevant page smoke check.

## Replacing Open Photos With Owned Photos

1. Add the owned photo as a new `owned_internal` asset.
2. Put it before the open-licensed asset for that place/route.
3. Keep the old open asset in the manifest only if it remains useful for gallery or audit history.
4. Run `npm run validate:media`.

## Required Metadata Fields

- `id`
- `type`
- `role`
- `localPath`
- `originalUrl`
- `sourceUrl`
- `sourceType`
- `provider`
- `creator`
- `title`
- `alt`
- `attributionText`
- `licenseName`
- `licenseUrl`
- `licenseAllowsCommercialUse`
- `licenseRequiresAttribution`
- `licenseRequiresShareAlike`
- `width`
- `height`
- owner id: `placeId`, `routeId`, or `neighborhoodId`
- `importedAt`
- `lastCheckedAt`
- `confidence`
- `status`

## Priority Montreal MVP Photo List

- Place d'Armes
- Notre-Dame Basilica
- Pointe-a-Calliere
- Bonsecours Market
- Old Port and quays
- Saint Joseph's Oratory
- Mount Royal lookout and chalet
- Lachine Canal
- Jean-Talon Market
- McGill campus area
- Quartier des spectacles
- Chinatown
- Saint-Louis Square
- Montreal City Hall
- Champ-de-Mars
- Old Montreal streets
- Plateau and Mile End streets
- Little Italy market area

## Media QA Checklist

- Image is local and loads on production build.
- License allows commercial use.
- Attribution/source/license metadata exists.
- Alt text describes the visible place, not the source.
- No review/rejected media appears as hero or card.
- Generated visual appears only as fallback.
- `npm run validate:media` passes.
