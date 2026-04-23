# Percussion samples

The app ships with `*.mp3` one-shots in this folder (see [CREDITS.md](./CREDITS.md)). Vite includes them at build time; `loadSamples()` decodes them into the Web Audio graph.

To replace, keep the same basenames: `clave`, `conga`, `cowbell`, `maracas`, `bajo` (`.wav`, `.mp3` or `.flac`).

If a file is missing or fails to decode, `INSTRUMENT_SYNTHS` in `src/data/rhythmPatterns.js` is used for that track.
