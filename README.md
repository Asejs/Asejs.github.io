# asejs.github.io

<img width="1200" height="627" alt="banner-image" src="https://github.com/user-attachments/assets/e9c219f0-71e4-4401-8ca0-7139329db736" />

Personlig CV-side for Åse Sagebakken – https://asejs.github.io/

Vue 3, Vite og TypeScript. Publiseres til GitHub Pages ved push til `main`.

## Utvikling

```bash
npm install
npm run dev
```

## Tester

```bash
npm test           # kjør testene
npm run coverage   # med dekningsrapport (minst 80 %)
```

Testene bruker Vitest og Vue Test Utils. 3D-scenene (three.js) er holdt utenfor dekningskravet.

## Kodekvalitet

```bash
npm run lint           # ESLint for Vue og TypeScript
npm run format         # formaterer koden med Prettier
npm run format:check   # sjekker formateringen uten å endre noe
```

CI kjører lint, formatsjekk, bygg og tester på hver pull request.

Alt innhold ligger i `src/data.ts`.

Bildene er mine og logoene tilhører de respektive selskapene – de kan ikke gjenbrukes.
