# Media Attribution

## Current State

Every route and place has placeholder image metadata with alt text. Cards use local gradient placeholders, not remote hotlinks.

## Rules

- Every media asset must have alt text.
- Direct remote image URLs are blocked by `npm run validate:media`.
- Real images must store attribution metadata before use.
- Imported media candidates must go through review before becoming public route/place media.
- Detail pages should expose attribution once real media is added.

## Placeholder Policy

Placeholders are intentional until licensed media is reviewed. They are acceptable for MVP fallback mode because they avoid licensing problems and keep cards visually complete.

## Future Fields To Add

- License label and URL
- Creator/credit
- Source URL
- Accessed date
- Local storage path
- Focal point for responsive crops
