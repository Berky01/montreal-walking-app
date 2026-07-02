# Test Plan

## Unit tests

Shared domain:

- route filtering
- route sorting
- route comparison label calculation
- estimated time formatting
- distance formatting
- session progress calculation
- completion math
- save state reducer/store

## Integration tests

- load route list
- load route detail
- compare routes
- save/unsave route
- start/pause/end route session
- save completion to history
- report route issue

## UI tests / manual browser checklist

Screens:

1. Home / Around Me
2. Discover & Filter
3. Route Cards
4. Route Comparison
5. Route Detail
6. Map & Stops
7. Active Walk
8. Next Stop Preview
9. Completion
10. Saved Routes
11. History
12. Settings

## Edge cases

- no location permission
- no routes matching filters
- map provider failure
- route missing geometry
- route has stops but no image
- save fails
- active session browser tab background/foreground
- end walk at low progress
- duplicate save attempt
- disabled premium/offline controls

## Snapshot evidence

Save screenshots to:

```text
qa/screenshots/desktop/
qa/screenshots/mobile/
```

Recommended naming:

```text
01_home_around_me.png
02_discover_filter.png
03_route_cards.png
04_route_comparison.png
05_route_detail.png
06_map_stops.png
07_active_walk.png
08_completion.png
09_saved.png
10_history.png
```
