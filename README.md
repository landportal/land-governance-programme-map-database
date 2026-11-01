# Land governance programme map: static version (GitHub Pages)

Snapshot of landgov.donorplatform.org (data as of 2026-11-01), published with authorization.
No server needed: `assets/js/engine.js` answers the three map requests in the browser
from `assets/data/data.json` (853 programmes, 144 countries, 21 donors, 25 VGGT chapters).

## Preview locally
    python3 -m http.server 8090 --bind 127.0.0.1     # then open http://127.0.0.1:8090/

## Publish
Push this folder's contents to a repo and set Settings > Pages > Deploy from branch
(root, or put it in /docs). All paths are relative, so a project path such as user.github.io/repo/ works.

## Differences from the original site
- Map tiles: OpenStreetMap (https), not Mapbox. Attribution is in the page footer.
- Print and Export buttons removed (the original used server endpoints).
- Several donors combine as OR (verified on one sample); several VGGT chapters also as OR (unverified).
- Programme order in lists follows the original's master order; 56 of 9,411 cached lists differ
  only in the order of identical duplicate programmes (ids 1120/1307, 168/1322).
- Data is a snapshot. To refresh: rebuild `assets/data/data.json` from a new cache.

## Checks done
`engine.js` was compared with 30,423 cached answers of the original site (pins, popups, programme lists,
all donor / chapter / donor+chapter / status combinations): all match except the 56 ordering ties above.
