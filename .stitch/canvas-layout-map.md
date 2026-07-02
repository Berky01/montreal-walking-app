# Meaningful Routes Stitch Canvas Layout Map

Purpose: arrange the Stitch canvas as a readable product-system walkthrough. Use this as the target layout for manual canvas cleanup or for any future Stitch API that can update screen instance positions.

Project: `7741303272075430847`
Design system: `assets/7afda6fefe6b4e6baeab8ab7fa4ea0b6`

## Layout Rules

- Group each feature as a desktop/mobile pair.
- Place desktop first, mobile immediately to the right.
- Keep related flows on the same horizontal row.
- Use even spacing between pairs.
- Put duplicate, failed, hidden, or superseded screens outside the walkthrough rows.

Suggested pair spacing:
- Desktop width: `1280`
- Mobile width: `390`
- Desktop/mobile gap: `64`
- Pair gap: `260`
- Row gap: `2600`

Suggested row y positions:
- Row 1 Core discovery: `0`
- Row 2 Core route/session/account: `2600`
- Row 3 P1 route/public/growth: `5200`
- Row 4 P1 place/accessibility/partner/admin: `8400`
- Row 5 P2 expansion A: `11800`
- Row 6 P2 expansion B: `14400`

Rows 4-6 intentionally use wider vertical offsets than the nominal `2600` row gap so the taller P1 page mockups do not overlap the P2 rows.

Suggested x positions for pairs:
- Pair 1 desktop `0`, mobile `1344`
- Pair 2 desktop `1994`, mobile `3338`
- Pair 3 desktop `3988`, mobile `5332`
- Pair 4 desktop `5982`, mobile `7326`
- Pair 5 desktop `7976`, mobile `9320`

## Row 1 - Core Discovery

1. Landing page / first impression
   - Desktop: `acfcfb43b7fb454491494732a8233366`
   - Mobile: inspect manually if needed; likely `1390a16b4d3744baa409038ffd849677`
2. App home
   - Desktop: `d4ddd8802505418786eaea041f09ff5e`
   - Mobile: `93c91968783d4525a462c601622f7162`
3. Discover monuments
   - Desktop: `7f7a5529e5de489aa9f3c43238e4d089`
   - Mobile: `0bdf6f8e03fb48879cebe378b610165c`
4. Route results
   - Desktop: `d34082ff85ea4ceb99d3c4c6f5b98f05`
   - Mobile: `11c0aa4f71714ed09f5af715dfa2ee57`
5. Map explorer
   - Desktop: `fca08ee193bd4ce1b25bdf16455d8587`
   - Mobile: `85848be2bcca44f18bab60c84035dc5f`

## Row 2 - Core Route, Session, Account, Reporting

1. Route detail
   - Desktop: `0c24733a88214d0b85a9ea69f801c33d`
   - Mobile: `742131844fb5417886715e6724697fce`
2. Route comparison
   - Desktop: `5243c2a14eee44efaf3186096ce66814`
   - Mobile: `96967772c08e4138887b4cf3b412e556`
3. Live route / next stop
   - Desktop: `af8f7a66243148d8b442d9889e95282b`
   - Mobile: `151eef8ec3c048c68ff5475224e7eeff`
4. Route completed
   - Desktop: `44b1e7c226a04ed5aff5f16d48ca2625`
   - Mobile: `a76e325c7d164d0a8a3b6bc3a725b6ff`
5. Saved / history / settings / reporting cluster
   - Saved desktop: `c8e9634c11a54c89b8cf5ed8a45bd57c`
   - Saved mobile: `2007d20643364c6c9cae492527b3d6fe`
   - History desktop: `94d463aeb2184f5185b0e5dd30f62e0a`
   - History mobile: `c62b560b7b0c493ba006ce8f960b9636`
   - Settings desktop: `6dd67c816c7342b0bbeee6f9e8d0243b`
   - Settings mobile: `c11a2166108546fc86f0d0e4f8016a8f`
   - Issue report desktop: `da6ed5e45aa946148084685203b87a5c`
   - Issue report mobile: `ae1f5fe24dec4cf0a93d843bd14d7be9`

## Row 3 - P1 Route Public, Neighborhood, Paid Packs, Offline, Share, Weather

1. Public route page
   - Desktop: `1e8b9bbe23554d2aa842246224508d02`
   - Mobile: `42121c2264a34b1a9580f05a876dc5f0`
2. Neighborhood page
   - Desktop: `de561218a95d4a18b4d3309c869ed549`
   - Mobile: `8b3b1c17fe1a4f8e895dc5626290c2bb`
3. Premium city packs
   - Desktop: `a16695318a1042829817f35bb0c2bcc4`
   - Mobile: `85a27ff2ba294f3692ed44fdcd170650`
4. Offline route cards
   - Desktop: `447a6baf1bb34e969afa08d7e51a063e`
   - Mobile: `dd277ed5a3f042cfb980c9b218576d69`
5. Share route and completion
   - Desktop: `c14575512c6d43528d946755a09e96d5`
   - Mobile: `2b868980b8864012af266948f1725111`
6. Weather/time suggestions
   - Desktop: `d36c1aaaa82b4055964deb33336b1b41`
   - Mobile: `04bb7dd25e344efcb941c185b47d431a`

## Row 4 - P1 Place, Accessibility, Partner, Admin

1. Public place page
   - Desktop: `43fa5671d7ca4a08ae1d933062def0bb`
   - Mobile: `13b1135590f548cca6aa294df3049705`
2. Accessibility route notes
   - Desktop: `abea2342aaf9400bade6427059b01209`
   - Mobile: `90a586a62694423989b6610df9c2e620`
3. Partner guest route kits
   - Desktop: `0d162ecb839a46fab08f191e32d30a8f`
   - Mobile: `f3ab96fc7eab4abab94b63ee3fde8500`
4. Admin route QA
   - Desktop: `22e714c50fe14a77b6ecc94d5c0dc1fc`
   - Mobile: `09634b3496b149b4a97aa5800a4edd9a`

## Row 5 - P2 Expansion A

1. More cities
   - Desktop: `1cbbbe619a074b048628bb2465a17aa3`
   - Mobile: `e6a2ad4d21364871b2bbab2f041adeb7`
2. City pack detail
   - Desktop: `a4fa4e5c4d474c1d99ded2fe28e1fd69`
   - Mobile: `2582cfea638b4809bb18efaa65fbcc36`
3. Audio snippets
   - Desktop: `2ecc79f7fba94fce9543de037ec664e4`
   - Mobile: `f21731645ca94868b39567ca0959bf21`
4. Natural language search
   - Desktop: `478f7bb18cd34d939f35a8c5cd68c3d8`
   - Mobile: `a51d42f736d94314ab9efcfd7cefebba`
5. Dynamic route generation
   - Desktop: `79d12998557e47ab8cbafc157c6e2d66`
   - Mobile: `75bdee652e3a489ca934f68861464a37`

## Row 6 - P2 Expansion B

1. Road-trip mode
   - Desktop: `97d4801b451f48e1bd0a2491ca58de3e`
   - Mobile: `926ed747bffc482786ed9a179ff16e13`
2. Heritage/UNESCO layer
   - Desktop: `76f9fd6943db45cea08f107f8fbe6cc3`
   - Mobile: `712999d782f448f580a1682e1ef85579`
3. Long-distance/pilgrimage mode
   - Desktop: `fc132247bf3b4d23ae603b88d1bd905a`
   - Mobile: `7e87640ad3aa46e99e0debdef40ea154`
4. Ticket/tour affiliates
   - Desktop: `572b93b5743b43feb923383c3f1d2bcb`
   - Mobile: `74a86512839f46b289c3a1035ccd18e9`
5. PDF/GPX export
   - Desktop: `d5be518a97144138b12cb48b4a78c75a`
   - Mobile: `1513a00e28fa48ccb974a0984846c6c6`

## Superseded Or Utility Screens To Keep Outside The Walkthrough Rows

- `77d5e526a1284d4183578c9376ba5dd0` - Reorganized inventory markdown screen.
- `a40f3495abe54a9083b149d58a490ce4` - earlier long-distance mobile screen replaced by `7e87640ad3aa46e99e0debdef40ea154`.
- Hidden or duplicate core attempts: `41b70f765a2143b9a661eeec49eeb4f1`, `9136bee5797e421b9f57d00d5ea7a880`, `9eba016917df435bbb377a4d648101b3`, `a02fd9b5acce495f9d099edfdbf39760`, `d688da9ff45247b18b9080c575d37f2b`.

## Current Tooling Limitation

Current exposed Stitch tools can read projects/screens, generate/edit screens, and apply/update design systems. They do not expose a callable operation to update `screenInstances[].x`, `screenInstances[].y`, hidden state, or canvas ordering. The private Stitch page is not accessible through the current in-app browser session because it is not signed into the owning Google account.
