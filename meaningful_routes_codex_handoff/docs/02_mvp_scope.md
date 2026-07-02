# MVP Scope

## MVP thesis

Montreal is the controlled proving ground. The MVP should prove that users prefer a route-first discovery companion over generic maps, static walking tours, or fitness trackers.

## MVP user promise

> Open the webapp, find a beautiful or interesting walk in Montreal, compare options, follow it live, and save the memory afterward.

## MVP must include

### Discovery

- Current city/location display
- Montreal-only scope clearly visible
- Nearby route suggestions
- Search/filter by route name, area, or theme
- Quick filters for time, distance, interests, route type

### Route cards

Each route card must show:

- name
- image or map preview
- distance
- estimated time
- number of stops
- route type/tags
- start area
- loop vs one-way
- difficulty/pace
- save state

### Route comparison

Compare 2–4 routes by:

- distance
- estimated time
- stops
- difficulty
- scenery
- history/culture density
- café/food density
- start distance from user
- loop vs one-way
- best-for label

### Route detail

Each route detail page must include:

- title
- description
- map
- stops
- distance/time
- difficulty
- route type/tags
- start/end
- save button
- start route button
- “Why do this route?”
- “Know before you go”

### Active Walk

- route line on map
- user location
- elapsed time
- distance completed
- distance remaining
- progress percentage
- next stop
- pause/end controls
- mobile browser safe layout with non-overlapping bottom controls

### Completion

Completion must show actual session metrics first:

- actual elapsed time
- actual distance
- progress/completion
- stops visited
- route name
- save to history
- rating/feedback
- similar routes CTA

### Saved and History

- saved routes list
- completed routes list
- cards distinguish routes by title, area, distance, time, tags, save/completion date

### Settings

- units
- pace preference
- interests
- location permissions state
- offline/premium toggles disabled if not ready
- Montreal MVP scope note

## MVP route categories

Create 20–50 draft routes across:

- Old Montreal history
- Mount Royal scenic routes
- Plateau murals
- Mile End cafés/culture
- Lachine Canal
- downtown architecture
- churches and heritage
- romantic evening walks
- rainy-day walks
- first-time visitor route
- hidden-gem neighborhood walks
- 30-minute lunch walks

## Hard non-goals

- Public UGC routes
- Social feed
- Messaging
- Full road-trip planning
- Global automatic route generation
- Full UNESCO ingestion
- Full pilgrimage logistics
- Paid subscriptions before core validation

## Definition of done

MVP is complete only when:

- Web route preview is nonblank in supported browsers and fits full geometry.
- Save state is visible and reliable.
- Active walk controls never overlap CTAs, fixed navigation, or mobile browser viewport controls.
- Active walk shows live progress as primary content.
- Completion uses actual session metrics.
- Compare labels accurately reflect route metrics.
- Saved/History cards are distinguishable.
- Settings values are formatted and disabled controls clearly belong to toggles.
- User-facing scope stays Montreal-only.
- Tests/typecheck/build/API readiness if used/browser screenshots pass at desktop and mobile widths.
