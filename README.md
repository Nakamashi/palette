# Palette Lab 3.0

A browser-based acrylic colour mixer built with HTML, CSS and JavaScript. Your collection, exclusions, sections, target colour and recipes are stored locally in browser storage. No login, server or database needed. Responsive layout designed for phone use later.

## Get started

1. Unzip the files into a normal Windows folder.
2. Double-click `index.html` to open the app in Chrome/Edge.
3. If you have saved work in the previous version, **Export backup** from that version, then **Import backup** in this version (import **replaces** current settings). If both versions run from the same origin/storage, the owned library and recipes are read automatically.
4. **Mixbox is now loaded automatically**, from a local `mixbox.js` file if present, otherwise from the author's website while you are connected to the internet. The pill near the top reads **Mixbox active** when the correct mixing engine is running.
5. For **fully offline Mixbox**: while online, double-click `install-mixbox-windows.bat` once. It downloads the original library straight from `https://scrtwpns.com/mixbox.js` into the same folder. Next time you open the app, no internet connection is necessary. You can alternatively download the script yourself from that address and save it as `mixbox.js` next to `index.html`.

If neither Mixbox source is accessible the app keeps working with its basic RYB mixing fallback, and shows **RYB fallback · offline** at the top.

## New in 3.0

- Mixing engine: automatic Mixbox integration for pigment-inspired mixing, with original library attribution and optional single-click offline setup.
- Colour search: pick **2, 3 or 4 maximum ingredients**. Instead of enumerating all combinations, it uses a fast RYB prefilter and a bounded search that scores and refines candidates through Mixbox when available. It does **not guarantee** the mathematically closest possible recipe.
- The **best recipe found loads directly** into the mixing bowl. Alternatives remain optional buttons.
- **All five sections can be collapsed individually** using their headings. The open/closed states save automatically, and Expand all / Collapse all buttons are provided.
- Keeps the BASICS / Regular / Other browse filters, Owned vs Include checkboxes, four matching scopes, editable hex and strength, custom paints, target photo picker, saved recipes, and JSON backups from 2.0.

## Catalogue and fidelity

- Liquitex BASICS: 80 entries from the Japanese colour catalogue.
- Liquitex Regular Type: 122 official May 2026 chart entries. The distributor advertises 119 for sale, so the additional entries are **not guaranteed purchasable**.
- Turner U-35 Yellow Ochre: one Other entry. **203 total** on first run, and your existing 15 paints are premarked Owned.
- Catalogue swatches are **approximate digital hex values**, not paint reflectance measurements. Mixbox improves *behaviour* of digital mixing, but does not make brand-specific physical recipes exact. Opacity, undertone, tinting strength and wet/dry shifts still vary in real paint.
- Automatic matching excludes metallic and fluorescent finishes unless you enable them.

## Owned, Included and saving

- **Owned** marks paints in your physical collection.
- **Include** allows a paint in manual mixes and in automatic matching (uncheck to suppress it without removing it).
- Match scopes allow My owned, Liquitex BASICS, Liquitex Regular or All included.
- Changes **automatically save** in your browser's `localStorage` on this device, including whether you collapsed each section. A backup JSON saves your work to a portable file.
- **Export backup before changing computers, browsers, local file paths, clearing browser history or uploading to a website.** Importing a backup replaces your collection/recipes on that device. No cloud sync or account is present.

## Hosting later on your phone

Upload the following to any HTTPS static hosting folder: `index.html`, `styles.css`, `catalog.js`, `app.js` and (for reliable offline-style use without a dependency on a third-party domain) `mixbox.js` after you install it. The browser on your phone can open the HTTPS page. **Phone and computer will not automatically share saved data** unless you later add a synchronisation system; use Export/Import backup to transfer it manually. Hosting it online does not automatically require a paid service or database.

## Mixbox licensing and attribution

The Mixbox library is authored by **Sarka Sochorova and Ondrej Jamriska**, copyright © 2022 **Secret Weapons**. Official project: https://scrtwpns.com/mixbox/ . JavaScript library: https://scrtwpns.com/mixbox.js . It is made available for **non-commercial use under CC BY-NC 4.0**: https://creativecommons.org/licenses/by-nc/4.0/ . A licence link and credit are shown inside Palette Lab. This project does not modify Mixbox. If your future website has advertising, sponsors, pays for access, or other commercial aspects, clarify licence requirements with the publisher first.

## Files

- `index.html`: interface
- `styles.css`: responsive styles
- `catalog.js`: complete offline catalogue
- `app.js`: app functionality, mixing and matching
- `catalog-reference.csv`: data reference
- `install-mixbox-windows.bat`: optional one-time installer for the unmodified upstream `mixbox.js`
- `README.md`: instructions and licensing
