# assets/mock/

Placeholder-photo staging folder for facility banners and logos used in
`script.js` (`mockFacilities`). Nothing in here is loaded yet — the app
currently points `photo`/`logo` at hosted Unsplash images and ui-avatars
initials badges so the UI has real, distinct imagery to preview without
needing files checked into the repo.

## When real facility photos are ready

Drop each file in here using this naming convention, then update the
matching facility's `photo`/`logo` field in `script.js` to the local path
(e.g. `assets/mock/facility-1-photo.jpg`):

| Facility ID | Photo filename           | Logo filename            |
|-------------|---------------------------|---------------------------|
| 1           | facility-1-photo.jpg      | facility-1-logo.png       |
| 2           | facility-2-photo.jpg      | facility-2-logo.png       |
| 3           | facility-3-photo.jpg      | facility-3-logo.png       |
| 4           | facility-4-photo.jpg      | facility-4-logo.png       |
| 5           | facility-5-photo.jpg      | facility-5-logo.png       |
| 6           | facility-6-photo.jpg      | facility-6-logo.png       |
| 7           | facility-7-photo.jpg      | facility-7-logo.png       |

## Recommended dimensions

- **Photo**: ~640x360 (16:9) or similar landscape crop — displayed via
  `object-fit: cover` in `.result-card__photo`, so any aspect ratio works,
  but landscape avoids heavy cropping.
- **Logo**: square, ~96x96 or larger — displayed via `object-fit: contain`
  in a circular `.result-card__logo` frame.

## Safety net

`style.css` hides broken-image alt text on `.result-card__photo` and
`.result-card__logo` (`color: transparent; font-size: 0; overflow: hidden`),
so a missing or misnamed file here will fail gracefully — no layout
breakage — while you're filling this folder in.
