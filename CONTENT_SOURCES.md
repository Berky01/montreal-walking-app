# Meaningful Routes Content Sources

Meaningful Routes uses real, licensed local media first and generated visuals only as a fallback. Every production image must be stored locally and trace back to source/license metadata.

## Visual Content Hierarchy

### Tier 1 - Real Owned Photos

- Photos taken during Montreal field walks.
- Preferred long-term source for hero images, route cards, place cards, and neighborhood surfaces.
- Lowest licensing risk because Meaningful Routes owns the originals.

### Tier 2 - Real Open-Licensed Photos

Use only with valid metadata:

- Wikimedia Commons.
- Wikidata image references.
- Openverse.
- Public-domain images.
- CC0.
- CC-BY.
- CC-BY-SA when attribution and share-alike obligations are acceptable.

### Tier 3 - Real Public/Open-Data Media

Use only when the license allows reuse:

- Ville de Montreal open data media where available.
- Quebec/MCC heritage media where reuse is explicit.
- Public art/cultural datasets with explicit reuse license.
- Official public-domain government/media assets where applicable.

### Tier 4 - Manual Editorial References

Use for fact checking, not display, unless image reuse license is explicit:

- Official place websites.
- Museum, church, market, and venue websites.
- Montreal heritage databases.
- Tourism pages.
- Historical references.

### Tier 5 - Generated Local Visuals

Use only as fallback:

- CSS/SVG route visuals.
- Category icons.
- Neighborhood patterns.
- Generated map previews.
- Abstract route hero art.
- Completion cards and empty states.

## Current MVP State

- Approved real local photos are stored under `public/media/places/`.
- Source/license metadata is stored in `data/media/media-assets.json`.
- Runtime helpers live in `lib/media/*`.
- `npm run validate:media` blocks hotlinked, unsafe, missing-license, rejected, or review-only production media.
