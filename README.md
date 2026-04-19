# Shortest Path Visualizer (Dijkstra)

Interactive single-page app that generates a random weighted graph on seven nodes (A–G) and animates **Dijkstra’s algorithm** step by step. The final shortest path is highlighted in green.

## Live demo

**[https://djikstra-web-visualizer.vercel.app/](https://djikstra-web-visualizer.vercel.app/)**

## Features

- Random undirected weighted graphs with a configurable number of edges (capped for clarity).
- Pick start and end nodes, then run the algorithm with adjustable animation speed.
- Live distance table during the run; final path and total cost when finished.
- Graph built with [vis-network](https://visjs.org/) (straight edges, fixed circular layout, no pan/zoom for a stable “slide” feel).
- Menu panel with a short **About** description of how Dijkstra works on this demo.

## Tech stack

- Plain **HTML**, **CSS**, and **JavaScript** (no build step).
- **vis-network** loaded from CDN in `index.html`.

## Project structure

| File        | Role                                      |
| ----------- | ----------------------------------------- |
| `index.html`| Page structure, vis-network script tag    |
| `style.css` | Layout, theme, sidebar, graph stage       |
| `script.js` | Graph generation, Dijkstra + animation  |

## Run locally

1. Clone or download this folder.
2. Open `index.html` in a browser, **or** serve the folder with any static file server, for example:

   ```bash
   npx --yes serve .
   ```

   Then open the URL shown in the terminal (often `http://localhost:3000`).

Serving over HTTP avoids any edge cases with modules or mixed content; for this project, opening the file directly usually works because there are no ES modules.

## Deploy

The live site is hosted on **Vercel**. To deploy your own copy, connect the repo (or this directory) to Vercel as a static site with `index.html` as the entry.

---

*Course / portfolio project: visualizing shortest-path search on a small graph.*
