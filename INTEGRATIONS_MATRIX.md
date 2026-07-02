# Integrations Matrix

| Feature area | Provider/source | Mode | No-key fallback | Priority | Cost tier | Licensing risk | Privacy risk | Lock-in risk | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Owned field photography | Manual field walks | Manual | Generated local visual | Now | Staff time | Low | Low | Low | Preferred long-term hero/card source. |
| Manual licensed import | Local editorial workflow | Manual | Generated local visual | Now | Free/manual | Medium | Low | Low | Requires license review before display. |
| Open photo import | Wikimedia Commons | Batch | Existing local manifest | Now | Free | Medium | Low | Low | Current MVP source for approved local photos. |
| Image enrichment | Wikidata image refs | Batch | Commons/manual import | Next | Free | Medium | Low | Low | Useful once `wikidataQid` refs are curated. |
| Open photo search | Openverse | Batch | Commons/manual import | Later | Free | Medium | Low | Medium | Add only with the same local-download/license gate. |
| POI enrichment | OpenStreetMap/Overpass | Batch | Curated mock data | Next | Free | Low | Low | Low | Coordinates and tags only; no runtime dependency. |
| Civic data | Ville de Montreal open data | Batch | Curated mock data | Later | Low/free | Medium | Low | Medium | Use only media/data with explicit reuse license. |
| Heritage data | Quebec/MCC heritage data | Batch | Curated mock data | Later | Low/free | Medium | Low | Medium | Good for facts and refs; image reuse must be explicit. |
| Basemap | MapLibre + Stadia Maps | Runtime | Local SVG/Leaflet fallback | Later | Low/paid | Low | Medium | Medium | Keep app boot independent from provider key. |
| Basemap alternative | MapTiler | Runtime | Local SVG/Leaflet fallback | Later | Low/paid | Low | Medium | Medium | Alternative to Stadia if terms/cost fit. |
| Hours/photos | Google Places | Runtime/batch | Curated local content | Later | Paid | High | Medium | High | Targeted use only; no boot requirement. |
| Media hosting | Supabase Storage or ImageKit | Runtime | `public/media` local assets | Later | Low/paid | Low | Medium | Medium | Use after media library outgrows repo storage. |
| Product analytics | PostHog | Runtime | No analytics | Later | Free/paid | Low | Medium | Medium | Defer until privacy posture is defined. |
| Errors | Sentry | Runtime | Server logs | Later | Free/paid | Low | Medium | Medium | Defer until live ops need it. |
| Email | Resend | Runtime | No email | Later | Low/paid | Low | Medium | Medium | For feedback/admin later. |
| Auth/backend | Supabase/Auth | Runtime | Local storage | Later | Free/paid | Low | Medium | Medium | Not part of current local-first MVP. |
| Payments | Stripe/Paddle | Runtime | None | Deferred | Paid | Low | High | High | Explicitly out of scope. |
| AI | LLM provider | Runtime/batch | Verified local data | Deferred | Paid | Medium | Medium | High | Only after verified data and guardrails exist. |
