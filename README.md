# Wordle Helper

Helps check for possible Wordle solutions and shows words that have already been solutions in the past.
Try it [here](https://juharris.github.io/wordle-helper/home).

<img src="./assets/example.png" alt="example of entering letters into the tool" width="500"/>

To avoid spoilers, the page will not show if a word was a solution from the last few days.

Data sources:
* Past solutions:
  * https://www.fiveforks.com/wordle
* Possible solutions:
  * https://wordsrated.com/wordle-words
  * Seen when using the app.
  * TODO: Need more.

# Development
Built using a sample for Next.js + Jest.

This includes Next.js' built-in support for Global CSS, CSS Modules and TypeScript. This example also shows how to use Jest with the App Router and React Server Components.

## Setup
Use Node '20.*'.

```bash
npm install
```

## Running
```bash
npm run dev
```

Open [localhost:3000/home](http://localhost:3000/home) in your web browser to see the project.

## Running Tests

```bash
npm run test:ci
```

To automatically re-run tests when files change, run:
```bash
npm run test
```

## Updating Words
To update the words, run:
```bash
npm run update-words
```

To help see this difference clearly, run:
```bash
git diff --color-words='[^,]'
```