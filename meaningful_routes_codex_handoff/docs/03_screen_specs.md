# Screen Specs

The visual mockup collage is in `assets/feature_mockup_collage.png`.

## 1. Home / Around Me

### Purpose

Answer: “What can I discover near me right now?”

### Must show

- Current city: Montreal, QC
- Greeting / small context line
- Search input
- Quick filter chips: 30 min, 1 hour, 2 hours, scenic, history, cafés, architecture, parks
- Nearby route cards
- Secondary suggestions
- Responsive navigation: top/side navigation on desktop and compact bottom or header navigation on mobile web

### States

- Location permission unknown
- Location denied
- Loading nearby routes
- No routes nearby
- Route data error
- Montreal-only scope note

## 2. Discover & Filter

### Purpose

Let user narrow down route options without a rigid planning form.

### Must show

- Map background or route list
- Search input
- Filter panel/bottom sheet
- Filter groups:
  - time
  - distance
  - interests
  - pace
  - route type
- Reset button
- Result count
- Show routes CTA

### MVP filters

- time
- distance
- interests
- start area/neighborhood
- route type

## 3. Route Cards / List View

### Purpose

Browse route options quickly.

### Card content

- Route image/map thumbnail
- Title
- Distance
- Estimated time
- Stop count
- Tags
- Difficulty/pace
- Start area
- Save/bookmark button

### Example card

```text
Old Montreal Stone Streets Loop
3.2 km · 55 min · 8 stops
History · Architecture · Easy
Starts near Place d’Armes
```

## 4. Route Comparison

### Purpose

Help users choose between similar routes.

### Comparison rows

- Distance
- Est. time
- Stops
- Difficulty
- Elevation if available
- Scenery
- History/culture
- Cafés/food
- Best for
- Start distance
- Loop/one-way
- Crowd level if available

### Acceptance rule

Labels must not contradict metrics. A longer/steeper route cannot be labeled easier unless the explanation is explicit.

## 5. Route Detail

### Purpose

Build confidence before starting.

### Must show

- Hero photo or map preview
- Save/share buttons
- Tags
- Title
- Distance, time, stops, difficulty
- Loop/one-way and start point
- Route description
- “Good for” chips
- Stop list
- Save CTA
- Start route CTA

### Useful sections

- Why do this route?
- Know before you go
- Transit/parking/access notes
- Accessibility notes
- Best time to do it

## 6. Map & Stops

### Purpose

Show the full route geometry and stop order.

### Must show

- Route line fitted to viewport
- Numbered stops
- Start/end markers
- User location if available
- Bottom sheet stop list
- Route detail CTA

### Error states

- No geometry
- Map provider failed
- Stops exist but route line missing

## 7. Active Walk Mode

### Purpose

Be the live walking companion.

### Primary content hierarchy

1. Map and route progress
2. Next action/turn/stop
3. Elapsed time and distance
4. Pause/end controls

### Must show

- Route line
- User position
- Progress percentage
- Distance completed/remaining
- Elapsed time
- Stops visited
- Next stop
- Pause / End Walk buttons

### Layout rules

- Controls never overlap fixed navigation, CTAs, or mobile browser viewport controls.
- Text must be readable outdoors.
- Progress must be more prominent than fitness metrics.

## 8. Next Stop Preview

### Purpose

Tell the user what is coming up and why it matters.

### Must show

- Stop photo
- Stop name
- Distance/time to stop
- Short description
- Why it matters
- Progress along route
- Got it / Continue CTA

## 9. Completion Screen

### Purpose

Celebrate and save the actual session.

### Must show

- Completed route name
- Actual distance
- Actual elapsed time
- Stops visited
- Completion percentage
- Tags
- Rating prompt
- Save to History
- Share
- Similar routes

## 10. Saved Routes

### Purpose

Let users return to planned or favorite routes.

### Must show

- All / Routes / Places / Collections tabs
- Route cards with image, name, area, distance, time, saved date
- Add collection CTA later

## 11. History

### Purpose

Memory of completed routes.

### Must show

- Summary stats: walks, distance, time
- Completed route cards
- Actual metrics and completed date
- Route tags / city

## 12. Destination & Trip Mode

### MVP

- Montreal neighborhoods and route categories only.

### Later

- City pages
- Destination search
- Weekend route bundles
- Road-trip routes
- Heritage/UNESCO layers
- Long-distance/pilgrimage routes
