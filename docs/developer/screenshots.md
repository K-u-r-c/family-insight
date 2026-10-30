---
description: How the documentation screenshots are generated from the real app, how to add a scene and how to annotate steps.
---

# Updating screenshots

Every picture of the app in this documentation is generated from the real program – never edited
by hand – in **English and Polish** and in the **light and dark** theme.

```sh
npm run docs:screenshots                 # build the app and regenerate everything (~25 min)
npm run docs:screenshots -- -g welcome   # only scenes whose name matches "welcome"
npm run docs:screenshots -- -g "· pl-dark"  # one language/theme variant
```

The output goes to `docs/public/screenshots/<lang>/<theme>/<scene>.webp`, and
`docs/.vitepress/screenshots.json` records the size of each image. Commit both. Screenshots are
**not** regenerated in CI: fonts and rendering differ between machines, so run the script after UI
changes and review the images.

## How it works

`playwright.screenshots.config.ts` runs `docs/.screenshots/scenes.spec.ts`. Each `scene(name, run)`
registers one test per language and theme. A test:

1. starts the built app with a fresh profile, a hidden 1280 × 800 window, the chosen language and
   theme, and a fixed time zone;
2. calls `run`, which brings the app into the state to show and returns what to capture;
3. captures it as **WebP** through the Chrome DevTools Protocol and closes the app.

The capture is always the last step of a session: taking a screenshot of a hidden Electron window
stops `requestAnimationFrame` in that window for good, which would break any interaction after it
(see the [decision log](./reference/decisions#screenshots)).

## Adding a scene

```ts
scene('statistics', async (s) => {
  await openSample(s) // helpers at the top of the file
  await s.page.getByRole('button', { name: s.t('stats.title') }).click()
  await dialog(s).waitFor()
  return dialogShot(s, { settle: 1200 }) // crop to the dialog, plain background
})
```

- `s.t(key, vars)` translates like the app, so selectors work in both languages.
- Return nothing to capture the whole window, or `ShotOptions`:

| Option    | Meaning                                                                         |
| --------- | ------------------------------------------------------------------------------- |
| `clip`    | A locator (or several) to crop to – their union plus `pad` pixels (default 16). |
| `steps`   | Elements to mark with numbered rings, in order.                                 |
| `isolate` | Replace the dimmed app behind an open dialog with a plain background.           |
| `settle`  | Extra wait before capturing (default 900 ms) so animations finish.              |

Then use it in a page:

```md
<Screenshot name="statistics" alt="The Statistics window with …" caption="Optional caption" />
```

The `<Screenshot>` component picks the page's language, shows the image matching the site theme,
reserves the right size (no layout shift) and opens a full-size view on click. Always write a
meaningful `alt` text in the page's language. An unknown `name` fails the documentation build.

## Step annotations

For tutorials, number the elements the reader should use, and use the same numbers in the text:

```ts
return {
  steps: [
    { target: dialog.getByRole('textbox'), badge: 'above' },
    { target: dialog.getByRole('button', { name: s.t('welcome.create') }), badge: 'above' }
  ]
}
```

`badge` places the number `corner` (default), `left`, `right` or `above` the ring – pick the side
where it doesn't cover text. The rings are drawn as a top-layer popover, so they also appear on top
of open dialogs.

## Reviewing

Look at the new images in all four variants before committing – for example with
`montage docs/public/screenshots/*/*/statistics.webp -tile 2x2 -geometry +4+4 review.png`
(ImageMagick) – and check that nothing is cut off, annotations don't hide labels, and the dark
variant looks as good as the light one.
