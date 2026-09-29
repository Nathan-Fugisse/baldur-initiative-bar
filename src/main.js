import OBR from "@owlbear-rodeo/sdk";
import "./style.css";

const ID = "com.fullpeople.baldur-initiative-bar";
const KEY = `${ID}/metadata`;
const STATE_KEY = `${ID}/state`;

const app = document.querySelector("#app");

let sceneItems = [];
let state = { currentId: null, round: 1 };

app.innerHTML = `
  <section class="initiative-shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">⚔</div>
        <div>
          <div class="title">INITIATIVE</div>
          <div class="subtitle">BATTLE ORDER</div>
        </div>
      </div>
      <div class="round">
        <span>ROUND</span>
        <strong id="round">1</strong>
      </div>
      <button class="icon-btn" id="clear" title="Clear initiative">×</button>
    </header>

    <div class="turn-controls">
      <button class="nav-btn" id="prev" title="Previous turn">‹</button>
      <div class="turn-label" id="turnLabel">No combatants</div>
      <button class="nav-btn" id="next" title="Next turn">›</button>
    </div>

    <div class="track" id="track"></div>

    <footer>
      <span id="count">0 combatants</span>
      <span>Right-click a character to add/remove</span>
    </footer>
  </section>
`;

const track = document.querySelector("#track");
const roundEl = document.querySelector("#round");
const turnLabel = document.querySelector("#turnLabel");
const countEl = document.querySelector("#count");

function getInitiative(item) {
  const value = item?.metadata?.[KEY]?.initiative;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getPortrait(item) {
  // Owlbear image items normally expose image.url through the item data.
  return item?.image?.url || item?.image?.source || "";
}

function participants() {
  return sceneItems
    .filter((item) => item.layer === "CHARACTER" && getInitiative(item) !== null)
    .map((item) => ({
      item,
      initiative: getInitiative(item),
      name: item.name || "Unknown",
      portrait: getPortrait(item)
    }))
    .sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
}

async function readState() {
  try {
    const metadata = await OBR.room.getMetadata();
    const saved = metadata?.[STATE_KEY];
    if (saved) state = { ...state, ...saved };
  } catch {}
}

async function writeState(next) {
  state = { ...state, ...next };
  try {
    await OBR.room.setMetadata({ [STATE_KEY]: state });
  } catch {}
}

function render() {
  const list = participants();
  const currentIndex = list.findIndex((x) => x.item.id === state.currentId);

  track.replaceChildren();

  if (!list.length) {
    track.innerHTML = `<div class="empty">Select a character and use the context menu to add it.</div>`;
    turnLabel.textContent = "No combatants";
  } else {
    list.forEach((entry, index) => {
      const card = document.createElement("button");
      card.className = "combatant" + (entry.item.id === state.currentId ? " active" : "");
      card.title = `${entry.name} — initiative ${entry.initiative}`;
      card.innerHTML = `
        <div class="portrait-wrap">
          ${entry.portrait
            ? `<img class="portrait" src="${entry.portrait}" alt="">`
            : `<div class="portrait fallback">${escapeHtml((entry.name[0] || "?").toUpperCase())}</div>`}
          <span class="initiative">${entry.initiative}</span>
        </div>
        <span class="combatant-name">${escapeHtml(entry.name)}</span>
      `;
      card.addEventListener("click", () => writeState({ currentId: entry.item.id }).then(render));
      card.addEventListener("dblclick", () => editInitiative(entry.item));
      track.appendChild(card);
    });

    const current = currentIndex >= 0 ? list[currentIndex] : list[0];
    turnLabel.textContent = current ? `Turn: ${current.name}` : "Select a turn";
  }

  roundEl.textContent = String(state.round);
  countEl.textContent = `${list.length} combatant${list.length === 1 ? "" : "s"}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

async function editInitiative(item) {
  const current = getInitiative(item);
  const value = window.prompt(`Initiative for ${item.name || "character"}:`, String(current));
  if (value === null) return;
  const n = Number(value);
  if (!Number.isFinite(n)) return;
  await OBR.scene.items.updateItems([item], (items) => {
    for (const target of items) {
      target.metadata[KEY] = { initiative: n };
    }
  });
}

async function advance(direction) {
  const list = participants();
  if (!list.length) return;
  let index = list.findIndex((x) => x.item.id === state.currentId);
  if (index < 0) index = direction > 0 ? -1 : 0;
  const nextIndex = index + direction;

  if (direction > 0 && nextIndex >= list.length) {
    await writeState({ currentId: list[0].item.id, round: state.round + 1 });
  } else if (direction < 0 && nextIndex < 0) {
    await writeState({ currentId: list[list.length - 1].item.id, round: Math.max(1, state.round - 1) });
  } else {
    await writeState({ currentId: list[nextIndex].item.id });
  }
  render();
}

document.querySelector("#next").addEventListener("click", () => advance(1));
document.querySelector("#prev").addEventListener("click", () => advance(-1));

document.querySelector("#clear").addEventListener("click", async () => {
  if (!participants().length) return;
  if (!window.confirm("Clear the initiative tracker?")) return;
  await OBR.scene.items.updateItems(
    (item) => item.metadata?.[KEY] !== undefined,
    (items) => {
      for (const item of items) delete item.metadata[KEY];
    }
  );
  await writeState({ currentId: null, round: 1 });
  render();
});

OBR.onReady(async () => {
  await readState();

  OBR.scene.items.onChange((items) => {
    sceneItems = items;
    render();
  });

  OBR.room.onMetadataChange((metadata) => {
    const saved = metadata?.[STATE_KEY];
    if (saved) {
      state = { ...state, ...saved };
      render();
    }
  });

  OBR.contextMenu.create({
    id: `${ID}/context-menu`,
    icons: [
      {
        icon: "/add.svg",
        label: "Add to Initiative",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", KEY], value: undefined }
          ]
        }
      },
      {
        icon: "/remove.svg",
        label: "Remove from Initiative",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }]
        }
      }
    ],
    async onClick(context) {
      const shouldAdd = context.items.every((item) => item.metadata?.[KEY] === undefined);

      if (shouldAdd) {
        const input = window.prompt("Initiative value:", "10");
        if (input === null) return;
        const initiative = Number(input);
        if (!Number.isFinite(initiative)) return;

        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) item.metadata[KEY] = { initiative };
        });
      } else {
        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) delete item.metadata[KEY];
        });
      }
    }
  });

  const initial = await OBR.scene.items.getItems();
  sceneItems = initial;
  render();
});
