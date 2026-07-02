# Media Folder

Store reviewed local media assets here. The current MVP uses approved local place photos with source/license metadata in `data/media/media-assets.json`.

Rules:

- Keep direct external URLs out of route and place media records.
- Store creator, license, source URL, attribution text, dimensions, owner id, and review status before publishing real media.
- Use generated/local fallbacks only when approved real media is unavailable.
- Keep large raw import downloads out of this folder.
- Run `npm run validate:media` after media edits.
