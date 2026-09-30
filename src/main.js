import OBR from '@owlbear-rodeo/sdk';
import './style.css';

const ID = 'com.nathanfugisse.baldur-initiative-bar';
const INITIATIVE_KEY = `${ID}/initiative`;
const TURN_KEY = `${ID}/turn`;

let sceneItems = [];
let turnState = { currentId: null, round: 1, active: false };

const app = document.querySelector('#app');
app.innerHTML = `
  <section class="initiative-bar" aria-label="Baldur Initiative Bar">
    <div class="toolbar">
      <div class="round-control">
        <button class="icon-btn" id="roundDown" title="Previous round">−</button>
        <span class="round-label">ROUND <strong id="round">1</strong></span>
        <button class="icon-btn" id="roundUp" title="Next round">+</button>
      </div>
      <button class="mode-btn" id="sortMode" title="Initiative is sorted from highest to lowest">RAW</button>
      <span class="drag-label">DRAG INITIATIVE</span>
      <button class="nav-btn" id="prev" title="Previous turn">◀ PREV</button>
      <button class="nav-btn primary" id="next" title="Next turn">NEXT ▶</button>
      <button class="end-btn" id="end" title="End combat">END COMBAT</button>
      <button class="menu-btn" id="clear" title="Clear initiative">⋮</button>
    </div>

    <div class="track-wrap">
      <button class="side-arrow" id="scrollLeft" aria-label="Scroll left">‹</button>
      <div id="track" class="track"></div>
      <button class="side-arrow" id="scrollRight" aria-label="Scroll right">›</button>
    </div>

    <div class="status-line">
      <span id="count">0 COMBATANTS</span>
      <span id="turnText">NO COMBATANTS</span>
      <span>DOUBLE-CLICK TO EDIT</span>
    </div>
  </section>
`;

const track = document.querySelector('#track');
const roundEl = document.querySelector('#round');
const countEl = document.querySelector('#count');
const turnTextEl = document.querySelector('#turnText');

const getInitiative = (item) => {
  const value = Number(item?.metadata?.[INITIATIVE_KEY]);
  return Number.isFinite(value) ? value : null;
};

const isInInitiative = (item) => getInitiative(item) !== null;

function getPortrait(item) {
  return item?.image?.url || item?.image?.src || '';
}

function getInitiativeList() {
  return sceneItems
    .filter((item) => item.layer === 'CHARACTER' && isInInitiative(item))
    .map((item) => ({
      item,
      initiative: getInitiative(item),
      name: item.name || 'Unknown',
      image: getPortrait(item),
    }))
    .sort((a, b) => b.initiative - a.initiative || a.name.localeCompare(b.name));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

async function saveTurn() {
  await OBR.room.setMetadata({ [TURN_KEY]: turnState });
}

function render() {
  const list = getInitiativeList();
  roundEl.textContent = String(turnState.round);
  countEl.textContent = `${list.length} COMBATANT${list.length === 1 ? '' : 'S'}`;

  const current = list.find((entry) => entry.item.id === turnState.currentId);
  turnTextEl.textContent = current ? `${current.name.toUpperCase()} • ${current.initiative}` : 'NO ACTIVE TURN';

  track.replaceChildren();

  if (!list.length) {
    track.innerHTML = `<div class="empty-state"><span class="empty-mark">✦</span><span>SELECT A CHARACTER AND USE <b>ADD TO INITIATIVE</b></span></div>`;
    return;
  }

  for (const entry of list) {
    const card = document.createElement('button');
    const active = entry.item.id === turnState.currentId;
    card.className = `combatant ${active ? 'active' : ''}`;
    card.title = `${entry.name} — Initiative ${entry.initiative}`;
    card.innerHTML = `
      <div class="portrait-frame">
        ${entry.image
          ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.name)}">`
          : `<span class="fallback">${escapeHtml((entry.name[0] || '?').toUpperCase())}</span>`}
        <span class="initiative-number">${entry.initiative}</span>
        ${active ? '<span class="active-rune">◆</span>' : ''}
      </div>
      <div class="resource-strip" aria-hidden="true"><span></span><i></i></div>
    `;

    card.addEventListener('click', async () => {
      turnState.currentId = entry.item.id;
      turnState.active = true;
      await saveTurn();
      render();
    });

    card.addEventListener('dblclick', (event) => {
      event.preventDefault();
      editInitiative(entry.item);
    });

    track.appendChild(card);
  }
}

async function editInitiative(item) {
  const current = getInitiative(item);
  const value = window.prompt(`Initiative for ${item.name || 'character'}:`, String(current));
  if (value === null) return;
  const initiative = Number(value);
  if (!Number.isFinite(initiative)) return;

  await OBR.scene.items.updateItems([item], (items) => {
    for (const target of items) target.metadata[INITIATIVE_KEY] = initiative;
  });
}

async function advanceTurn(direction) {
  const list = getInitiativeList();
  if (!list.length) return;

  let index = list.findIndex((entry) => entry.item.id === turnState.currentId);
  if (index < 0) index = direction > 0 ? -1 : 0;

  const nextIndex = index + direction;

  if (nextIndex >= list.length) {
    turnState.round += 1;
    turnState.currentId = list[0].item.id;
  } else if (nextIndex < 0) {
    turnState.round = Math.max(1, turnState.round - 1);
    turnState.currentId = list[list.length - 1].item.id;
  } else {
    turnState.currentId = list[nextIndex].item.id;
  }

  turnState.active = true;
  await saveTurn();
  render();
}

async function endCombat() {
  if (!getInitiativeList().length) return;
  turnState = { currentId: null, round: 1, active: false };
  await saveTurn();
  render();
}

async function clearInitiative() {
  const list = getInitiativeList();
  if (!list.length) return;
  if (!window.confirm('Remove every character from initiative?')) return;

  await OBR.scene.items.updateItems(
    (item) => item.layer === 'CHARACTER' && isInInitiative(item),
    (items) => {
      for (const item of items) delete item.metadata[INITIATIVE_KEY];
    },
  );

  turnState = { currentId: null, round: 1, active: false };
  await saveTurn();
  render();
}

function setupScrolling() {
  document.querySelector('#scrollLeft').onclick = () => track.scrollBy({ left: -180, behavior: 'smooth' });
  document.querySelector('#scrollRight').onclick = () => track.scrollBy({ left: 180, behavior: 'smooth' });
}

async function setupContextMenu() {
  await OBR.contextMenu.create({
    id: `${ID}/context-menu`,
    icons: [
      {
        icon: '/add.svg',
        label: 'Add to Initiative',
        filter: {
          every: [
            { key: 'layer', value: 'CHARACTER' },
            { key: ['metadata', INITIATIVE_KEY], value: undefined },
          ],
        },
      },
      {
        icon: '/remove.svg',
        label: 'Remove from Initiative',
        filter: {
          every: [
            { key: 'layer', value: 'CHARACTER' },
          ],
        },
      },
    ],
    onClick: async (context) => {
      const add = context.items.every((item) => getInitiative(item) === null);

      if (add) {
        const value = window.prompt('Enter initiative value:', '10');
        if (value === null) return;
        const initiative = Number(value);
        if (!Number.isFinite(initiative)) return;

        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) item.metadata[INITIATIVE_KEY] = initiative;
        });

        if (!turnState.currentId && context.items[0]) {
          turnState.currentId = context.items[0].id;
          turnState.active = true;
          await saveTurn();
        }
      } else {
        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) delete item.metadata[INITIATIVE_KEY];
        });

        if (context.items.some((item) => item.id === turnState.currentId)) {
          turnState.currentId = null;
          await saveTurn();
        }
      }

      render();
    },
  });
}

document.querySelector('#prev').onclick = () => advanceTurn(-1);
document.querySelector('#next').onclick = () => advanceTurn(1);
document.querySelector('#end').onclick = endCombat;
document.querySelector('#clear').onclick = clearInitiative;
document.querySelector('#roundDown').onclick = async () => {
  turnState.round = Math.max(1, turnState.round - 1);
  await saveTurn();
  render();
};
document.querySelector('#roundUp').onclick = async () => {
  turnState.round += 1;
  await saveTurn();
  render();
};

document.querySelector('#sortMode').onclick = () => {
  window.alert('Initiative is always ordered from highest to lowest, matching the tracker criterion.');
};

OBR.onReady(async () => {
  const metadata = await OBR.room.getMetadata();
  if (metadata?.[TURN_KEY]) turnState = { ...turnState, ...metadata[TURN_KEY] };

  await setupContextMenu();
  setupScrolling();

  OBR.scene.items.onChange((items) => {
    sceneItems = items;
    if (turnState.currentId && !getInitiativeList().some((entry) => entry.item.id === turnState.currentId)) {
      turnState.currentId = null;
      saveTurn();
    }
    render();
  });

  OBR.room.onMetadataChange((metadata) => {
    if (metadata?.[TURN_KEY]) {
      turnState = { ...turnState, ...metadata[TURN_KEY] };
      render();
    }
  });

  sceneItems = await OBR.scene.items.getItems();
  render();
});
