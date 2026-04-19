let nodes = ["A", "B", "C", "D", "E", "F", "G"];
let graph = {};
let visNodes, visEdges, network;

let isRunning = false;
let speedMultiplier = 1;

const MENU_CONTENT = {
  about:
    "This project visualizes the working of Dijkstra's Algorithm on a randomly generated weighted graph. Users can select a start and end node, and the system computes the shortest path using a priority-based approach that always chooses the minimum distance node. The process is shown step-by-step, highlighting how different paths are explored and distances are updated through edge relaxation. Finally, the optimal path is displayed along with its total cost, making it easier to understand how shortest path algorithms work in real time",
};

const COLORS = {
  nodeBg: "rgba(56,189,248,0.22)",
  nodeBorder: "rgba(56,189,248,0.95)",
  nodeText: "#e2e8f0",
  edge: "rgba(148,163,184,0.35)",
  edgeHover: "rgba(147,197,253,0.9)",
  edgeHighlight: "rgba(96,165,250,0.95)",
  edgeText: "#e2e8f0",
  edgeTextBg: "rgba(2,6,23,0.72)",
  warnBg: "rgba(250,204,21,0.28)",
  warnBorder: "rgba(250,204,21,0.95)",
  goodBg: "rgba(34,197,94,0.25)",
  goodBorder: "rgba(34,197,94,0.95)",
  bad: "rgba(239,68,68,0.95)",
};

const UI_FONT = '"Segoe UI", ui-sans-serif, system-ui, -apple-system, Arial, sans-serif';

function $(id) {
  return document.getElementById(id);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function toast(message, type = "info") {
  const el = $("toast");
  if (!el) return;
  el.hidden = false;
  el.textContent = message;
  el.style.borderColor =
    type === "error"
      ? "rgba(239,68,68,0.55)"
      : type === "success"
        ? "rgba(34,197,94,0.55)"
        : "rgba(148,163,184,0.45)";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

function setBusy(busy) {
  isRunning = busy;
  const gen = $("generateGraphBtn");
  const run = $("findPathBtn");
  if (gen) gen.disabled = busy;
  if (run) run.disabled = busy;
}

function sleep(ms) {
  const scaled = Math.max(0, Math.round(ms / speedMultiplier));
  return new Promise((r) => setTimeout(r, scaled));
}

function highlightEdge(u, v, color, width) {
  visEdges.forEach((e) => {
    if ((e.from === u && e.to === v) || (e.from === v && e.to === u)) {
      visEdges.update({ id: e.id, color, width });
    }
  });
}

function resetVisuals() {
  if (visNodes) {
    visNodes.forEach((n) => {
      visNodes.update({
        id: n.id,
        color: { background: COLORS.nodeBg, border: COLORS.nodeBorder },
      });
    });
  }

  if (visEdges) {
    visEdges.forEach((e) => {
      visEdges.update({
        id: e.id,
        color: COLORS.edge,
        width: 4,
      });
    });
  }
}

function updateDistTable(dist) {
  let out = [];
  for (let n of nodes) {
    const v = dist[n];
    out.push(`${n}: ${v === Infinity ? "∞" : v}`);
  }
  $("distTable").textContent = out.join("\n");
}

function updatePQ(_pq) {}

function drawGraph() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#020617";
  network = new vis.Network(
    $("graph"),
    {
      nodes: visNodes,
      edges: visEdges,
    },
    {
      physics: false,
      interaction: {
        hover: true,
        tooltipDelay: 80,
        dragView: false,
        zoomView: false,
        dragNodes: false,
      },
      layout: {
        improvedLayout: true,
      },
      nodes: {
        shape: "circle",
        size: 32,
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: "rgba(0,0,0,0.35)",
          size: 18,
          x: 0,
          y: 8,
        },
        font: {
          color: COLORS.nodeText,
          face: UI_FONT,
          size: 16,
          strokeWidth: 4,
          strokeColor: bg,
        },
      },
      edges: {
        width: 3,
        smooth: false,
        color: { color: COLORS.edge, highlight: COLORS.edgeHighlight, hover: COLORS.edgeHover },
        font: {
          color: COLORS.edgeText,
          size: 14,
          face: UI_FONT,
          strokeWidth: 4,
          strokeColor: COLORS.edgeTextBg,
          align: "horizontal",
          background: COLORS.edgeTextBg,
        },
        chosen: {
          edge: function (values) {
            values.shadow = true;
            values.shadowColor = "rgba(59,130,246,0.35)";
            values.shadowSize = 12;
          },
        },
      },
    },
  );

  try {
    network.fit({ animation: { duration: 300, easingFunction: "easeInOutQuad" } });
  } catch {}
}

function generateGraph() {
  if (isRunning) return;

  let edgeCount = parseInt($("edges").value);
  if (Number.isNaN(edgeCount)) edgeCount = 8;

  graph = {};
  nodes.forEach((n) => (graph[n] = []));

  visNodes = new vis.DataSet(
    nodes.map((n, i) => {
      const el = $("graph");
      const w = el?.clientWidth || 900;
      const h = el?.clientHeight || 700;
      const radius = Math.max(240, Math.min(w, h) / 2 - 70);
      return ({
      id: n,
      label: n,
      x: radius * Math.cos((2 * Math.PI * i) / nodes.length),
      y: radius * Math.sin((2 * Math.PI * i) / nodes.length),
      fixed: true,
      color: {
        background: COLORS.nodeBg,
        border: COLORS.nodeBorder,
      },
    });
    }),
  );

  visEdges = new vis.DataSet();

  let added = new Set();
  let maxEdges = (nodes.length * (nodes.length - 1)) / 2;

  const complexityCap = Math.min(maxEdges, 12);
  edgeCount = clamp(edgeCount, 1, complexityCap);
  if (parseInt($("edges").value) !== edgeCount) {
    $("edges").value = edgeCount;
  }

  while (added.size < edgeCount) {
    let i = Math.floor(Math.random() * nodes.length);
    let j = Math.floor(Math.random() * nodes.length);
    if (i === j) continue;

    let u = nodes[i],
      v = nodes[j];
    let key = u < v ? u + v : v + u;

    if (!added.has(key)) {
      let w = Math.floor(Math.random() * 10) + 1;

      graph[u].push([v, w]);
      graph[v].push([u, w]);

      visEdges.add({
        id: key,
        from: u,
        to: v,
        label: w.toString(),
        width: 3,
        color: COLORS.edge,
        smooth: false,
      });

      added.add(key);
    }
  }

  drawGraph();
  $("distTable").textContent = "";
  $("historyTable").textContent = "Run the algorithm to see the final path and cost.";
  toast("Graph generated.", "success");
}

async function dijkstraSteps(start, target) {
  let dist = {},
    prev = {},
    pq = [];

  nodes.forEach((n) => {
    dist[n] = Infinity;
    prev[n] = null;
  });

  dist[start] = 0;
  pq.push([0, start]);

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    updatePQ(pq);

    let [d, node] = pq.shift();
    if (d !== dist[node]) continue;

    visNodes.update({
      id: node,
      color: { background: COLORS.warnBg, border: COLORS.warnBorder },
    });

    updateDistTable(dist);
    await sleep(450);

    // In Dijkstra, once the target is removed from the queue,
    // its shortest distance is finalized and we can stop.
    if (node === target) break;

    for (let [nei, w] of graph[node]) {
      highlightEdge(node, nei, COLORS.bad, 5);
      await sleep(900);

      let nd = d + w;
      if (nd < dist[nei]) {
        dist[nei] = nd;
        prev[nei] = node;
        pq.push([nd, nei]);
      }

      highlightEdge(node, nei, COLORS.edge, 4);
    }
  }

  return { dist, prev };
}

async function animatePath(path) {
  for (let i = 0; i < path.length; i++) {
    visNodes.update({
      id: path[i],
      color: { background: COLORS.goodBg, border: COLORS.goodBorder },
    });

    await sleep(250);

    if (i < path.length - 1) {
      highlightEdge(path[i], path[i + 1], COLORS.goodBorder, 6);
      await sleep(350);
    }
  }
}

async function findPath() {
  if (isRunning) return;
  if (!visNodes || !visEdges) {
    toast("Generate a graph first.", "error");
    return;
  }

  let start = $("start").value.trim().toUpperCase();
  let end = $("end").value.trim().toUpperCase();

  if (start.length !== 1 || end.length !== 1) {
    toast("Start/End should be a single letter (A–G).", "error");
    return;
  }

  if (!graph[start] || !graph[end]) {
    toast("Invalid nodes. Use A–G.", "error");
    return;
  }

  if (start === end) {
    $("historyTable").textContent = `Path: ${start}\nCost: 0`;
    toast("Nothing to compute.", "success");
    return;
  }

  setBusy(true);
  $("historyTable").textContent = "Running Dijkstra...";

  // Reset before running
  resetVisuals();

  let { dist, prev } = await dijkstraSteps(start, end);

  if (dist[end] === Infinity) {
    resetVisuals();
    $("historyTable").textContent = `No path found from ${start} to ${end}`;
    toast("No path found.", "error");
    setBusy(false);
    return;
  }

  let path = [],
    curr = end;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }

  // Final look: ONLY the chosen path remains green.
  resetVisuals();
  await animatePath(path);

  $("historyTable").textContent = `Path: ${path.join(" -> ")}\nCost: ${dist[end]}`;
  toast("Done.", "success");
  setBusy(false);
}

function setupUI() {
  const edges = $("edges");
  const gen = $("generateGraphBtn");
  const run = $("findPathBtn");
  const speed = $("speed");
  const speedLabel = $("speedLabel");
  const toggleSidebar = $("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const menuPanel = $("menuPanel");
  const menuBackdrop = $("menuBackdrop");
  const menuCloseBtn = $("menuCloseBtn");
  const aboutText = $("aboutText");

  if (edges && !edges.value) edges.value = "10";
  if (gen) gen.addEventListener("click", generateGraph);
  if (run) run.addEventListener("click", findPath);

  function updateSpeed() {
    speedMultiplier = parseFloat(speed?.value ?? "1");
    if (Number.isNaN(speedMultiplier) || speedMultiplier <= 0) speedMultiplier = 1;
    if (speedLabel) speedLabel.textContent = `${speedMultiplier.toFixed(2)}×`;
  }

  if (speed) {
    speed.addEventListener("input", updateSpeed);
    updateSpeed();
  }

  if (edges) {
    edges.addEventListener("keydown", (e) => {
      if (e.key === "Enter") generateGraph();
    });
  }

  const start = $("start");
  const end = $("end");
  if (start) {
    start.addEventListener("keydown", (e) => {
      if (e.key === "Enter") findPath();
    });
  }
  if (end) {
    end.addEventListener("keydown", (e) => {
      if (e.key === "Enter") findPath();
    });
  }

  if (toggleSidebar && sidebar) {
    toggleSidebar.addEventListener("click", () => {
      if (menuPanel && menuBackdrop) {
        const willOpen = menuPanel.hidden;
        menuPanel.hidden = !willOpen;
        menuBackdrop.hidden = !willOpen;
        toggleSidebar.setAttribute("aria-expanded", willOpen ? "true" : "false");
      }
    });
  }

  function closeMenu() {
    if (!menuPanel || !menuBackdrop || !toggleSidebar) return;
    menuPanel.hidden = true;
    menuBackdrop.hidden = true;
    toggleSidebar.setAttribute("aria-expanded", "false");
  }

  if (menuCloseBtn) menuCloseBtn.addEventListener("click", closeMenu);
  if (menuBackdrop) menuBackdrop.addEventListener("click", closeMenu);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Static menu content (not editable by viewers).
  if (aboutText) aboutText.textContent = MENU_CONTENT.about;
}

window.addEventListener("DOMContentLoaded", () => {
  setupUI();
  generateGraph();
});