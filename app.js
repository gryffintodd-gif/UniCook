// app.js: everything UniCook does. Plain JavaScript, no framework, so it runs by double-clicking index.html.
// Reading order: helpers, state, Fridge, recipe matching, Cook, recipe dialog + timer, Feed, Import, Me, routing.
(function () {
  "use strict";

  const D = window.UC_DATA;
  const Store = window.Store;

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const ingById = Object.fromEntries(D.ingredients.map((i) => [i.id, i]));
  const toolById = Object.fromEntries(D.tools.map((t) => [t.id, t]));
  const recipeById = Object.fromEntries(D.recipes.map((r) => [r.id, r]));
  // Total time comes from the steps, so a recipe's headline time can never disagree with its steps.
  D.recipes.forEach((r) => { r.minutes = r.steps.reduce((sum, s) => sum + s.min, 0); });

  // Anything a user typed is escaped before it goes into HTML.
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ingName = (id) => (ingById[id] ? ingById[id].name : id);
  // Built-in appliances come from data.js; ones you typed yourself live on your profile.
  const toolName = (id) => {
    if (toolById[id]) return toolById[id].name;
    const custom = state.profile && (state.profile.customTools || []).find((t) => t.id === id);
    return custom ? custom.name : id;
  };
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // A stable small number per word, so each tape label keeps the same tilt on every render.
  const hash = (s) => { let h = 5381; for (const c of s) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return Math.abs(h); };
  const tilt = (id) => ((hash(id) % 7) - 3) * 0.9;

  // ---------- state (saved through store.js) ----------
  const state = {
    fridge: Store.get("fridge", []),     // [{id, name, cat}]
    profile: Store.get("profile", null), // {name, school, tools: [ids]} or null
    likes: Store.get("likes", {}),       // {postId: true}
    imports: Store.get("imports", []),   // [{url, platform, recipe, at}]
    cooked: Store.get("cooked", []),     // [{recipe, at}]
    list: Store.get("list", []),         // recipe ids picked for the grocery list
    listChecked: Store.get("listChecked", {}), // {ingredientId: true} for items ticked off
    rack: Store.get("rack", []),         // [{id, name}] seasonings you have (presets + your own)
    myPosts: Store.get("myPosts", []),   // [{id, recipe, caption, at, user, school}] your own posts
    comments: Store.get("comments", {}), // {postId: [{id, user, text, at}]} comments you wrote
    openComments: new Set(),             // posts whose comment section is open (kept across re-renders)
    filters: { diff: "Any", time: "Any", ing: "Any" }, // shared by Cook and Feed
    feed: { school: "All", canMake: false },
    justAdded: null,                     // id of the newest tape, so only it plays the "stick" animation
    readyBefore: new Set()               // recipes READY at the last render, so only new ones get stamped
  };
  const save = (key) => Store.set(key, state[key]);

  // ---------- toast (with optional Undo) ----------
  let toastTimer;
  function toast(msg, action) {
    const el = $("#toast");
    el.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button type="button" class="toast-btn">${esc(action.label)}</button>` : "");
    if (action) el.querySelector("button").addEventListener("click", () => { action.fn(); hideToast(); });
    el.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, action ? 6000 : 3000);
  }
  function hideToast() { $("#toast").classList.remove("is-on"); }

  // ================= FRIDGE =================
  function findIngredient(text) {
    const t = text.toLowerCase().trim();
    const tSingular = t.replace(/s$/, "");
    return D.ingredients.find((i) =>
      [i.name.toLowerCase(), i.id.replace(/-/g, " "), ...i.alias].some((n) => n === t || n === tSingular || n.replace(/s$/, "") === tSingular)
    );
  }

  function addItem(text, cat) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean) return { error: "Type an ingredient first." };
    const known = findIngredient(clean);
    // Unknown foods are still welcome on the shelf; they just don't unlock demo recipes.
    const item = known
      ? { id: known.id, name: known.name, cat: known.cat }
      : { id: "u-" + slug(clean), name: clean, cat: cat || "pantry" };
    if (item.id === "u-") return { error: "Use letters or numbers for the name." };
    if (state.fridge.some((i) => i.id === item.id)) return { error: `${item.name} is already on your shelf.` };
    state.fridge.push(item);
    state.justAdded = item.id;
    save("fridge");
    return { item };
  }

  function removeItem(id) {
    const index = state.fridge.findIndex((i) => i.id === id);
    if (index < 0) return;
    const [item] = state.fridge.splice(index, 1);
    save("fridge");
    renderAll();
    toast(`Peeled off ${item.name}.`, {
      label: "Undo",
      fn: () => { state.fridge.splice(index, 0, item); state.justAdded = item.id; save("fridge"); renderAll(); }
    });
  }

  function tapeHTML(item) {
    const isNew = item.id === state.justAdded;
    return `<li><button type="button" class="tape${isNew ? " tape-in" : ""}" style="--r:${tilt(item.id)}deg" data-peel="${esc(item.id)}" aria-label="Remove ${esc(item.name)}">${esc(item.name)}</button></li>`;
  }

  function renderShelves() {
    const box = $("#shelves");
    if (state.fridge.length === 0) {
      box.innerHTML = `<div class="empty"><p class="empty-big">Your shelves are empty.</p><p>Even the ramen's gone. Type what you have, tap it above, or try the sample fridge.</p></div>`;
      return;
    }
    box.innerHTML = D.categories.map((c) => {
      const items = state.fridge.filter((i) => i.cat === c.id);
      return `<section class="shelf"><h3 class="shelf-name">${c.label}</h3>${
        items.length ? `<ul class="tapes">${items.map(tapeHTML).join("")}</ul>` : `<p class="shelf-empty">Nothing here yet.</p>`
      }</section>`;
    }).join("");
    state.justAdded = null; // the stick animation plays once only
  }

  function chipHTML(ing, attr) {
    return `<button type="button" class="chip" ${attr}="${ing.id}">+ ${esc(ing.name)}</button>`;
  }

  function renderQuickChips() {
    const cat = $("#add-cat").value;
    const have = new Set(state.fridge.map((i) => i.id));
    const options = D.ingredients.filter((i) => i.cat === cat && !have.has(i.id));
    const label = D.categories.find((c) => c.id === cat).label;
    $("#quick-label").textContent = options.length ? `Tap to add (${label})` : `Everything on the ${label} list is already in.`;
    $("#quick-chips").innerHTML = options.map((i) => chipHTML(i, "data-quick")).join("");
  }

  function renderPhotoChips() {
    const have = new Set(state.fridge.map((i) => i.id));
    $("#photo-chips").innerHTML = D.ingredients.map((i) =>
      have.has(i.id)
        ? `<button type="button" class="chip is-on" aria-pressed="true" data-photo="${i.id}">${esc(i.name)}</button>`
        : `<button type="button" class="chip" aria-pressed="false" data-photo="${i.id}">+ ${esc(i.name)}</button>`
    ).join("");
  }

  // ================= RECIPE MATCHING =================
  function match(r) {
    const have = new Set(state.fridge.map((i) => i.id));
    const missing = r.need.filter((id) => !have.has(id));
    // With no profile yet, every appliance counts as available (and the Cook screen says so).
    const toolsMissing = state.profile ? r.tools.filter((t) => !state.profile.tools.includes(t)) : [];
    return { r, missing, haveCount: r.need.length - missing.length, toolsOk: toolsMissing.length === 0, toolsMissing };
  }
  const allMatches = () => D.recipes.map(match).sort((a, b) => a.missing.length - b.missing.length || a.r.minutes - b.r.minutes);

  function receiptHTML(m, stampNew) {
    const ready = m.missing.length === 0;
    const fresh = ready && stampNew && !state.readyBefore.has(m.r.id);
    return `<li class="receipt-item" data-id="${m.r.id}">
      <button type="button" class="receipt${ready ? " is-ready" : ""}" data-open="${m.r.id}">
        <span class="receipt-top"><span class="receipt-name">${esc(m.r.name)}</span></span>
        <span class="receipt-tags"><span class="tag receipt-time">${m.r.minutes} min</span><span class="tag">${m.r.diff}</span>${m.r.tools.map((t) => `<span class="tag">${toolName(t)}</span>`).join("")}</span>
        <span class="receipt-line${ready ? " ok" : ""}">${ready ? "Missing: nothing" : "Missing: " + m.missing.map(ingName).join(", ")}</span>
        <span class="receipt-total"><span>Have</span><span>${m.haveCount} of ${m.r.need.length}</span></span>
        ${ready ? `<span class="sr-only">Ready to cook.</span><span class="stamp${fresh ? " stamp-in" : ""}" aria-hidden="true">Ready</span>` : ""}
      </button></li>`;
  }

  // FLIP: remember where each receipt was, re-render, then slide it from old to new spot.
  // Why: the reshuffle is the "one live thing", so you should see recipes move, not just jump.
  function flip(container, render) {
    const first = new Map();
    const animate = !reduceMotion() && container.offsetParent !== null;
    if (animate) container.querySelectorAll("[data-id]").forEach((el) => first.set(el.dataset.id, el.getBoundingClientRect()));
    render();
    if (!animate) return;
    container.querySelectorAll("[data-id]").forEach((el) => {
      const f = first.get(el.dataset.id);
      const l = el.getBoundingClientRect();
      if (!f) { el.animate([{ opacity: 0, transform: "translateY(16px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(.2,.7,.2,1)" }); return; }
      const dx = f.left - l.left, dy = f.top - l.top;
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
  }

  function renderStack() {
    const list = allMatches().filter((m) => m.toolsOk);
    const readyNow = list.filter((m) => m.missing.length === 0);
    $("#stack-count").textContent = state.fridge.length === 0
      ? "Add a few things and recipes start lining up here."
      : readyNow.length === 0 ? "Nothing ready yet. The closest ones are below." : `${readyNow.length} ready right now.`;
    flip($("#stack"), () => { $("#stack").innerHTML = list.slice(0, 5).map((m) => receiptHTML(m, true)).join(""); });
    state.readyBefore = new Set(readyNow.map((m) => m.r.id));
    updateBadge(readyNow.length);
  }

  // ---------- floating READY badge (phones; hidden on desktop by CSS) ----------
  let badgeCount = null;
  function updateBadge(count) {
    const badge = $("#ready-badge");
    if (typeof count === "number") {
      const changed = badgeCount !== null && count !== badgeCount;
      badgeCount = count;
      badge.textContent = count ? `${count} ready to cook` : "See closest recipes";
      if (changed && !reduceMotion()) badge.animate([{ transform: "scale(1.15)" }, { transform: "scale(1)" }], { duration: 240, easing: "ease-out" });
    }
    // Only worth showing while the recipe stack is still below the screen.
    const head = $(".stack-head");
    const below = head.getBoundingClientRect().top > window.innerHeight - 40;
    badge.hidden = !(currentTab === "fridge" && state.fridge.length > 0 && below);
  }

  // ================= COOK =================
  const DIFFS = ["Any", "Easy", "Medium", "Hard"];
  const TIMES = [["Any", "Any time"], ["10", "10 min or less"], ["20", "20 min or less"], ["45", "45 min or less"]];
  const INGS = [["Any", "Any number"], ["3", "3 or fewer"], ["4", "4 or fewer"], ["5", "5 or fewer"]];
  const FILTER_GROUPS = [
    ["diff", "Level", DIFFS.map((d) => [d, d === "Any" ? "Any level" : d])],
    ["time", "Time", TIMES],
    ["ing", "Ingredients", INGS]
  ];

  // One rule for both screens: does this recipe fit the level, time and ingredient filters?
  function passesFilters(r) {
    const f = state.filters;
    return (f.diff === "Any" || r.diff === f.diff) &&
      (f.time === "Any" || r.minutes <= Number(f.time)) &&
      (f.ing === "Any" || r.need.length <= Number(f.ing));
  }
  const filtersActive = () => Object.values(state.filters).some((v) => v !== "Any");

  // Labeled chip rows; "scope" keeps the label ids unique on each screen.
  function filterBarHTML(scope) {
    return FILTER_GROUPS.map(([key, label, opts]) => `<div class="filter-group" role="group" aria-labelledby="${scope}-${key}-label">
        <span class="filter-label" id="${scope}-${key}-label">${label}</span>
        <div class="chip-row">${opts.map(([v, l]) => `<button type="button" class="chip" aria-pressed="${state.filters[key] === v}" data-filter="${key}" data-value="${v}">${l}</button>`).join("")}</div>
      </div>`).join("");
  }

  function filteredForCook() {
    const all = allMatches();
    const hiddenByTools = all.filter((m) => !m.toolsOk);
    const shown = all.filter((m) => m.toolsOk && passesFilters(m.r));
    return { shown, hiddenByTools, total: all.length - hiddenByTools.length };
  }

  function renderCook() {
    $("#cook-filters").innerHTML = filterBarHTML("cook");
    const { shown, hiddenByTools, total } = filteredForCook();
    $("#cook-count").textContent = `Showing ${shown.length} of ${total} recipes.`;
    $("#cook-clear").hidden = !filtersActive();
    const notes = [];
    if (state.fridge.length === 0) notes.push(`Your fridge is empty, so every recipe is missing something. <a href="#fridge">Add food</a> to see what's ready.`);
    if (!state.profile) notes.push(`Showing recipes for every appliance. <a href="#me">Add yours</a> to hide what your kitchen can't do.`);
    else if (hiddenByTools.length) {
      const need = [...new Set(hiddenByTools.flatMap((m) => m.toolsMissing))].map((t) => toolName(t).toLowerCase());
      notes.push(`${hiddenByTools.length} hidden because they need: ${need.join(", ")}. <a href="#me">Change appliances</a>.`);
    }
    $("#cook-note").innerHTML = notes.join(" ");
    $("#cook-list").innerHTML = shown.length
      ? shown.map((m) => receiptHTML(m, false)).join("")
      : `<li class="empty"><p class="empty-big">Nothing fits those filters.</p><p>Try a longer time limit, any level, or more ingredients.</p></li>`;
  }

  // Surprise me: pick a ready recipe (or one of the closest), with a quick name shuffle first.
  function surprise() {
    const { shown } = filteredForCook();
    if (!shown.length) { toast("Nothing to pick from. Loosen the filters first."); return; }
    const fewest = shown[0].missing.length;
    const pool = shown.filter((m) => m.missing.length === fewest);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    const btn = $("#surprise");
    if (reduceMotion()) { openRecipe(pick.r.id); return; }
    btn.disabled = true;
    let n = 0;
    const spin = setInterval(() => {
      btn.textContent = shown[n % shown.length].r.name;
      n += 1;
      if (n > 9) { clearInterval(spin); btn.textContent = "Surprise me"; btn.disabled = false; openRecipe(pick.r.id); }
    }, 70);
  }

  // ================= RECIPE DIALOG + COOK TIMER =================
  let cook = null; // {id, idx, left (seconds), running, timer}

  function clock(sec) { const m = Math.floor(sec / 60), s = sec % 60; return `${m}:${String(s).padStart(2, "0")}`; }

  function openRecipe(id) {
    const r = recipeById[id];
    if (!r) return;
    stopCook();
    const m = match(r);
    const have = r.need.filter((x) => !m.missing.includes(x));
    let t = 0;
    const steps = r.steps.map((s, i) => {
      const from = t; t += s.min;
      return `<li class="step" data-step="${i}"><span class="step-clock">${from}–${t} min</span><span class="step-text">${esc(s.text)}</span></li>`;
    }).join("");
    $("#dlg-body").innerHTML = `
      <div class="dlg-top"><span class="dlg-top-name" aria-hidden="true">${esc(r.name)}</span><button type="button" class="btn btn--ghost btn--small" data-close>Close</button></div>
      <h2 id="dlg-title" class="dlg-title">${esc(r.name)}</h2>
      <p class="dlg-blurb">${esc(r.blurb)}</p>
      <p class="receipt-tags"><span class="tag">${r.minutes} min total</span><span class="tag">${r.diff}</span>${r.tools.map((x) => `<span class="tag">${toolName(x)}</span>`).join("")}</p>
      ${m.toolsMissing.length ? `<p class="warn">Your kitchen card says you don't have: ${m.toolsMissing.map(toolName).join(", ").toLowerCase()}.</p>` : ""}
      <div class="dlg-cols">
        <div><h3 class="dlg-h">You have</h3>${have.length ? `<ul class="ticks">${have.map((x) => `<li>${esc(ingName(x))}</li>`).join("")}</ul>` : `<p class="muted-ink">None of it yet.</p>`}</div>
        <div><h3 class="dlg-h">Missing</h3>${m.missing.length ? `<ul class="misses">${m.missing.map((x) => `<li>${esc(ingName(x))}</li>`).join("")}</ul>` : `<p class="ok-ink">Nothing. You're set.</p>`}</div>
      </div>
      ${seasoningsHTML(r)}
      <p class="muted-ink small">Assumed in every kitchen: ${D.assumed}.</p>
      <div><button type="button" class="btn btn--ghost btn--small" id="list-toggle" data-listtoggle="${r.id}">${listButtonLabel(r.id)}</button></div>
      <h3 class="dlg-h">The whole process</h3>
      <ol class="steps" id="steps">${steps}</ol>
      <div class="cook-panel" id="cook-panel"></div>`;
    $("#recipe-dialog").dataset.recipe = id;
    renderCookPanel();
    $("#recipe-dialog").showModal();
  }

  function renderCookPanel() {
    const panel = $("#cook-panel");
    if (!panel) return;
    const id = $("#recipe-dialog").dataset.recipe;
    const r = recipeById[id];
    document.querySelectorAll("#steps .step").forEach((li, i) => {
      li.classList.toggle("is-current", !!cook && i === cook.idx);
      li.classList.toggle("is-done", !!cook && i < cook.idx);
      if (cook && i === cook.idx) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    if (!cook) {
      panel.innerHTML = `<button type="button" class="btn btn--big" id="cook-start">Cook this</button><p class="small">Starts a timer for each step. You can still see every step while you cook.</p>`;
      return;
    }
    const last = cook.idx === r.steps.length - 1;
    panel.innerHTML = `
      <div class="cook-row">
        <p class="cook-time${cook.left === 0 ? " is-up" : ""}" id="cook-time" aria-live="off">${clock(cook.left)}</p>
        <div><p class="cook-step">Step ${cook.idx + 1} of ${r.steps.length}</p>
        <p class="cook-msg" id="cook-msg" aria-live="polite">${cook.left === 0 ? "Time's up for this step." : ""}</p></div>
      </div>
      <div class="cook-btns">
        <button type="button" class="btn btn--ghost-light btn--small" id="cook-pause">${cook.running ? "Pause" : "Resume"}</button>
        <button type="button" class="btn btn--small" id="cook-next">${last ? "Finish" : "Next step"}</button>
        <button type="button" class="btn btn--ghost-light btn--small" id="cook-stop">Stop</button>
      </div>`;
    const cur = document.querySelector("#steps .is-current");
    if (cur) cur.scrollIntoView({ block: "nearest", behavior: reduceMotion() ? "auto" : "smooth" });
  }

  function startStep(idx) {
    const r = recipeById[cook.id];
    cook.idx = idx;
    cook.left = r.steps[idx].min * 60;
    cook.running = true;
    renderCookPanel();
  }

  function startCook() {
    const id = $("#recipe-dialog").dataset.recipe;
    cook = { id, idx: 0, left: 0, running: true, timer: null };
    // One timer for the whole session; it only counts down while running.
    cook.timer = setInterval(() => {
      if (!cook || !cook.running || cook.left === 0) return;
      cook.left -= 1;
      const el = $("#cook-time");
      if (el) el.textContent = clock(cook.left);
      if (cook.left === 0) renderCookPanel(); // shows "Time's up" once; it never skips a step by itself
    }, 1000);
    startStep(0);
  }

  function stopCook() { if (cook) clearInterval(cook.timer); cook = null; }

  function finishCook() {
    const id = cook.id;
    stopCook();
    state.cooked.unshift({ recipe: id, at: Date.now() });
    state.cooked = state.cooked.slice(0, 30);
    save("cooked");
    renderCookPanel();
    const panel = $("#cook-panel");
    panel.insertAdjacentHTML("afterbegin", `<span class="stamp stamp--big${reduceMotion() ? "" : " stamp-in"}" aria-hidden="true">Cooked</span><p class="ok-ink"><strong>Cooked it.</strong> It's on your kitchen card now.</p><button type="button" class="btn btn--ghost-light btn--small" data-share="${id}">Share it to the feed</button>`);
    renderMe();
  }

  // ================= GROCERY LIST =================
  const listButtonLabel = (id) => (state.list.includes(id) ? "On your grocery list (remove)" : "Add to grocery list");

  function toggleList(id) {
    if (state.list.includes(id)) state.list = state.list.filter((x) => x !== id);
    else state.list.push(id);
    save("list");
    renderList();
    const btn = $("#list-toggle");
    if (btn) btn.textContent = listButtonLabel(id);
  }

  // Everything the chosen meals still need, merged so an item shared by two meals appears once.
  function neededItems() {
    const have = new Set(state.fridge.map((i) => i.id));
    const need = new Map(); // ingredientId -> [recipe names]
    state.list.forEach((rid) => {
      const r = recipeById[rid];
      if (!r) return;
      r.need.filter((id) => !have.has(id)).forEach((id) => {
        if (!need.has(id)) need.set(id, []);
        need.get(id).push(r.name);
      });
    });
    return need;
  }

  function renderList() {
    $("#list-meals").innerHTML = state.list.length
      ? state.list.map((rid) => `<li class="list-meal">
          <button type="button" class="link-btn" data-open="${rid}">${esc(recipeById[rid].name)}</button>
          <button type="button" class="btn btn--ghost btn--small" data-unlist="${rid}" aria-label="Remove ${esc(recipeById[rid].name)} from the list">Remove</button>
        </li>`).join("")
      : `<li class="empty-inline">No meals yet. Add one below, or tap "Add to grocery list" on any recipe.</li>`;

    const options = allMatches().filter((m) => !state.list.includes(m.r.id));
    $("#list-pick").innerHTML = options.length
      ? options.map((m) => `<option value="${m.r.id}">${esc(m.r.name)} (${m.missing.length ? `missing ${m.missing.length}` : "ready"})</option>`).join("")
      : `<option value="">Every recipe is already on your list</option>`;
    $("#list-add").disabled = !options.length;

    const need = neededItems();
    const box = $("#list-items");
    if (!state.list.length) { box.innerHTML = `<div class="empty"><p class="empty-big">Nothing to buy yet.</p><p>Pick a meal and its missing items show up here.</p></div>`; return; }
    if (!need.size) { box.innerHTML = `<div class="empty"><p class="empty-big">Nothing to buy.</p><p>You already have everything for these meals.</p></div>`; return; }
    const checkedCount = [...need.keys()].filter((id) => state.listChecked[id]).length;
    box.innerHTML = `<ul class="buy">${[...need.entries()].map(([id, names]) => `
        <li><label class="buy-item"><input type="checkbox" data-buy="${id}" ${state.listChecked[id] ? "checked" : ""}>
          <span><span class="buy-name">${esc(ingName(id))}</span><span class="buy-for">for ${names.map(esc).join(", ")}</span></span></label></li>`).join("")}</ul>
      <p class="small buy-count">${need.size} item${need.size === 1 ? "" : "s"} to buy, ${checkedCount} in the cart.</p>
      <button type="button" class="btn" id="buy-move" ${checkedCount ? "" : "disabled"}>Put checked items in my fridge</button>`;
  }

  function moveCheckedToFridge() {
    const need = neededItems();
    let moved = 0;
    [...need.keys()].filter((id) => state.listChecked[id]).forEach((id) => {
      const ing = ingById[id];
      if (!state.fridge.some((i) => i.id === id)) { state.fridge.push({ id, name: ing.name, cat: ing.cat }); moved += 1; }
      delete state.listChecked[id];
    });
    save("fridge"); save("listChecked");
    renderAll();
    toast(`Put ${moved} item${moved === 1 ? "" : "s"} in your fridge.`);
  }

  // ================= FEED =================
  // No tape-colored field: tape labels would vanish on it.
  const FIELD_COLORS = ["maroon", "yolk"];

  function timeAgo(ts) {
    const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  // Your posts first (newest on top), then the demo posts.
  function feedPosts() {
    const mine = state.myPosts.map((p) => ({ ...p, mine: true, likes: 0, when: timeAgo(p.at) }));
    return mine.concat(D.posts.map((p) => ({ ...p, when: `${p.ago} ago` })));
  }

  function openPostForm(recipeId) {
    if (!state.profile) {
      toast("Make your kitchen card first, so posts show your nickname and school.", { label: "Make it", fn: () => { location.hash = "me"; } });
      return;
    }
    const pick = recipeId || (state.cooked[0] && state.cooked[0].recipe) || D.recipes[0].id;
    $("#post-form-body").innerHTML = `
      <div class="input-group"><label for="post-recipe">What did you make?</label>
        <select id="post-recipe">${D.recipes.map((r) => `<option value="${r.id}" ${r.id === pick ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select></div>
      <div class="input-group"><label for="post-cap">Caption <span id="post-count" class="num">0/140</span></label>
        <textarea id="post-cap" maxlength="140" rows="3" placeholder="How did it go?"></textarea></div>
      <p class="form-error" id="post-error" role="alert"></p>
      <p class="small post-note">Posting as <strong>@${esc(state.profile.name)}</strong>${state.profile.school ? `, ${esc(state.profile.school)}` : ""}. Saved on this device only; other students can't see it yet.</p>
      <div class="row"><button class="btn" type="submit">Post it</button><button class="btn btn--ghost" type="button" id="post-cancel">Cancel</button></div>`;
    $("#post-form").hidden = false;
    $("#post-cap").focus();
  }

  function closePostForm() { $("#post-form").hidden = true; $("#post-form-body").innerHTML = ""; }

  // Thumbs-up icon (Lucide "thumbs-up", ISC license), inline so there is no extra file or request.
  const THUMB = `<svg class="thumb" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>`;

  // Demo comments (from data.js) first, then the ones you wrote, oldest at the top.
  function commentsFor(postId) {
    const demo = ((D.comments && D.comments[postId]) || []).map((c) => ({ ...c, when: `${c.ago} ago` }));
    const mine = (state.comments[postId] || []).map((c) => ({ ...c, when: timeAgo(c.at), mine: true }));
    return demo.concat(mine);
  }

  const commentLI = (c) => `<li class="comment${c.mine ? " comment--mine" : ""}"><p class="comment-who"><strong>@${esc(c.user)}</strong> <span>${c.when}</span></p><p>${esc(c.text)}</p></li>`;

  function commentsHTML(postId) {
    const list = commentsFor(postId);
    return `<div class="comments" id="c-${postId}" ${state.openComments.has(postId) ? "" : "hidden"}>
      <ul class="comment-list" data-clist="${postId}">${list.length ? list.map(commentLI).join("") : `<li class="comment-empty">No comments yet. Say something nice.</li>`}</ul>
      <form class="comment-form" data-cform="${postId}" novalidate>
        <label class="sr-only" for="ci-${postId}">Write a comment</label>
        <input id="ci-${postId}" type="text" maxlength="200" autocomplete="off" placeholder="Add a comment">
        <button class="btn btn--small" type="submit">Post</button>
      </form>
      <p class="form-error" data-cerror="${postId}" role="alert"></p>
    </div>`;
  }

  // Like animation: the thumb flicks up and a "+1" floats off. Skipped under reduced motion.
  function celebrateLike(btn) {
    if (reduceMotion()) return;
    const thumb = btn.querySelector(".thumb");
    thumb.animate([
      { transform: "rotate(0) scale(1)" },
      { transform: "rotate(-24deg) scale(1.45)", offset: 0.45 },
      { transform: "rotate(8deg) scale(.95)", offset: 0.75 },
      { transform: "rotate(0) scale(1)" }
    ], { duration: 520, easing: "cubic-bezier(.2,.7,.2,1)" });
    const plus = document.createElement("span");
    plus.className = "plus-one";
    plus.setAttribute("aria-hidden", "true");
    plus.textContent = "+1";
    btn.appendChild(plus);
    plus.animate([{ opacity: 0, transform: "translate(-50%, 0)" }, { opacity: 1, transform: "translate(-50%, -18px)", offset: 0.3 }, { opacity: 0, transform: "translate(-50%, -44px)" }], { duration: 700, easing: "ease-out" }).onfinish = () => plus.remove();
  }

  function renderFeed() {
    const schools = [...new Set(feedPosts().map((p) => p.school))];
    const mine = state.profile && state.profile.school;
    if (mine && !schools.includes(mine)) schools.unshift(mine);
    const sel = $("#feed-school");
    sel.innerHTML = `<option value="All">All schools</option>` + schools.map((s) => `<option value="${esc(s)}">${esc(s)}${s === mine ? " (my school)" : ""}</option>`).join("");
    sel.value = state.feed.school;
    if (sel.value !== state.feed.school) { state.feed.school = "All"; sel.value = "All"; }
    $("#feed-canmake").checked = state.feed.canMake;

    $("#feed-filters").innerHTML = filterBarHTML("feed");
    const all = feedPosts();
    const posts = all.filter((p) => passesFilters(recipeById[p.recipe]) &&
      (state.feed.school === "All" || p.school === state.feed.school) &&
      (!state.feed.canMake || match(recipeById[p.recipe]).missing.length <= 1));
    $("#posts").innerHTML = posts.length ? posts.map((p, i) => {
      const r = recipeById[p.recipe];
      const m = match(r);
      const liked = !!state.likes[p.id];
      return `<article class="post${p.mine ? " post--mine" : ""}">
        <div class="post-field field--${FIELD_COLORS[i % FIELD_COLORS.length]}">
          <p class="post-dish">${esc(r.name)}</p>
          <ul class="tapes tapes--small">${r.need.map((x) => `<li><span class="tape tape--static" style="--r:${tilt(p.id + x)}deg">${esc(ingName(x))}</span></li>`).join("")}</ul>
        </div>
        <div class="post-body">
          ${p.mine ? `<p class="post-mine-label">Your post, saved on this device only</p>` : ""}
          <p class="post-who"><strong>@${esc(p.user)}</strong> <span>${esc(p.school)}</span> <span>${p.when}</span></p>
          <p class="post-cap">${esc(p.caption)}</p>
          <p class="post-match">${m.missing.length === 0 ? "You have everything for this." : `You're missing ${m.missing.length}: ${m.missing.map(ingName).join(", ")}.`}</p>
          <div class="post-actions">
            <button type="button" class="btn btn--ghost btn--small like" aria-pressed="${liked}" data-like="${p.id}" data-base="${p.likes}"><span class="sr-only">Like</span>${THUMB}<span class="num">${p.likes + (liked ? 1 : 0)}</span></button>
            <button type="button" class="btn btn--ghost btn--small" data-comments="${p.id}" aria-expanded="${state.openComments.has(p.id)}" aria-controls="c-${p.id}">Comments <span class="num" data-ccount="${p.id}">${commentsFor(p.id).length}</span></button>
            <button type="button" class="btn btn--small" data-open="${r.id}">Cook this</button>
            ${p.mine ? `<button type="button" class="btn btn--ghost btn--small" data-delpost="${p.id}">Delete</button>` : ""}
          </div>
          ${commentsHTML(p.id)}
        </div>
      </article>`;
    }).join("") : `<div class="empty"><p class="empty-big">No posts match.</p><p>Try all schools, turn off the fridge filter, or clear the level, time and ingredient filters.</p></div>`;
    $("#feed-count").textContent = `Showing ${posts.length} of ${all.length} posts.`;
    $("#feed-clear").hidden = !filtersActive();
  }

  // ================= IMPORT =================
  // Only checks that the link LOOKS like a TikTok or Reels link. It never opens or reads the video.
  function parseVideoLink(raw) {
    let u;
    try { u = new URL(raw.trim()); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol)) return null;
    const host = u.hostname.replace(/^(www\.|m\.)/, "");
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "TikTok";
    if (host === "instagram.com" && /^\/(reel|reels|p)\//.test(u.pathname)) return "Instagram";
    return null;
  }

  function importResultHTML(imp) {
    const m = match(recipeById[imp.recipe]);
    return `<div class="demo-box">
      <p class="demo-note"><strong>Demo import:</strong> UniCook did not watch this video. Below is a sample recipe showing what an import will look like.</p>
      <ol class="receipts">${receiptHTML(m, false)}</ol>
      <p class="small">A real import would need a server that gets the video's captions or transcript (where ${imp.platform} allows it), an AI model to turn them into steps, and a secret key kept on that server, never in this page.</p>
    </div>`;
  }

  function renderImports() {
    $("#imports").innerHTML = state.imports.length
      ? state.imports.map((imp) => `<li class="import-row">
          <span class="tag">${imp.platform}</span>
          <a href="${esc(imp.url)}" target="_blank" rel="noopener noreferrer" class="import-url">${esc(imp.url)}</a>
          <button type="button" class="btn btn--ghost btn--small" data-open="${imp.recipe}">Open steps</button>
        </li>`).join("")
      : `<li class="empty-inline">No imports yet. Paste a link above.</li>`;
  }

  // ================= ME (demo profile) =================
  function profileFormHTML(p) {
    const tools = p ? p.tools : ["microwave", "stovetop"];
    return `<form class="me-form" id="me-form" novalidate>
      <p class="demo-note"><strong>Demo sign-in:</strong> no password, nothing sent anywhere. It's saved on this device only.</p>
      <div class="input-group"><label for="me-name">Nickname (no real name needed)</label><input id="me-name" maxlength="24" autocomplete="off" value="${p ? esc(p.name) : ""}" placeholder="midnight_chef"></div>
      <div class="input-group"><label for="me-school">School</label><input id="me-school" list="school-list" maxlength="60" autocomplete="off" value="${p ? esc(p.school) : ""}" placeholder="UMass Amherst"><datalist id="school-list">${D.schools.map((s) => `<option value="${esc(s)}">`).join("")}</datalist></div>
      <fieldset class="tools-set"><legend>Appliances you have</legend>
        <div class="chips" id="tool-chips">${D.tools.map((t) => `<label class="check"><input type="checkbox" value="${t.id}" ${tools.includes(t.id) ? "checked" : ""}><span>${t.name}</span></label>`).join("")}${
          (p && p.customTools ? p.customTools : []).map(customToolHTML).join("")}</div>
        <div class="input-group tool-add">
          <label for="me-tool-new">Have something else? Add it</label>
          <div class="add-row">
            <input id="me-tool-new" class="grow" type="text" maxlength="30" autocomplete="off" placeholder="crockpot, waffle maker, hot plate">
            <button class="btn btn--small" type="button" id="me-tool-add">Add appliance</button>
          </div>
          <p class="form-error" id="me-tool-error" role="alert"></p>
        </div>
      </fieldset>
      <p class="form-error" id="me-error" role="alert"></p>
      <div class="row"><button class="btn" type="submit">Save my card</button>${p ? `<button class="btn btn--ghost" type="button" id="me-cancel">Cancel</button>` : ""}</div>
    </form>`;
  }

  // A typed-in appliance: checked by default; unchecking it before saving drops it.
  const customToolHTML = (t) => `<label class="check check--custom"><input type="checkbox" value="${esc(t.id)}" data-custom="${esc(t.name)}" checked><span>${esc(t.name)}</span></label>`;

  function addCustomTool() {
    const input = $("#me-tool-new");
    const err = $("#me-tool-error");
    err.classList.remove("is-info"); // the duplicate message below is info, not an error
    const name = input.value.trim().replace(/\s+/g, " ");
    if (!name) { err.textContent = "Type an appliance first."; input.focus(); return; }
    const id = "x-" + slug(name);
    if (id === "x-") { err.textContent = "Use letters or numbers for the name."; input.focus(); return; }
    // Already on the list (built-in or typed earlier)? Just tick it instead of adding a duplicate.
    const same = [...document.querySelectorAll("#tool-chips input")].find((i) =>
      i.value === id || i.nextElementSibling.textContent.trim().toLowerCase() === name.toLowerCase());
    if (same) { same.checked = true; err.classList.add("is-info"); err.textContent = `${same.nextElementSibling.textContent} is already on the list, so I ticked it.`; input.value = ""; input.focus(); return; }
    err.textContent = "";
    const display = name.charAt(0).toUpperCase() + name.slice(1);
    $("#tool-chips").insertAdjacentHTML("beforeend", customToolHTML({ id, name: display }));
    const added = $("#tool-chips").lastElementChild;
    if (!reduceMotion()) added.animate([{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" });
    input.value = "";
    input.focus();
  }

  let editing = false;
  let currentTab = "fridge";
  // ---------- spice rack ----------
  const presetSeasoning = Object.fromEntries(D.seasonings.map((s) => [s.id, s]));
  const inRack = (id) => state.rack.some((s) => s.id === id);
  const seasonName = (id) => (presetSeasoning[id] ? presetSeasoning[id].name : ((state.rack.find((s) => s.id === id) || {}).name || id));

  // In the recipe: each seasoning as a square tag, solid if it's in your rack, dashed if not.
  function seasoningsHTML(r) {
    const missing = r.seasonings.filter((id) => !inRack(id));
    const tip = state.rack.length === 0
      ? `Your spice rack is empty. <a href="#me" data-closego>Fill it in on Me</a> to see what you have.`
      : missing.length ? "Missing one? The dish still works, just plainer." : "You have every seasoning for this.";
    return `<div class="dlg-seasonings">
      <h3 class="dlg-h">Seasonings</h3>
      <p class="receipt-tags">${r.seasonings.map((id) => inRack(id)
        ? `<span class="tag tag--yes">✓ ${esc(seasonName(id))}<span class="sr-only"> (in your rack)</span></span>`
        : `<span class="tag tag--no">${esc(seasonName(id))}<span class="sr-only"> (not in your rack)</span></span>`).join("")}</p>
      <p class="muted-ink small">${tip}</p>
    </div>`;
  }

  function renderRack() {
    const customs = state.rack.filter((s) => !presetSeasoning[s.id]);
    const chip = (s, custom) => {
      const on = inRack(s.id);
      return `<button type="button" class="chip${custom ? " chip--custom" : ""}" aria-pressed="${on}" data-rack="${esc(s.id)}">${on ? "" : "+ "}${esc(s.name)}</button>`;
    };
    $("#rack-body").innerHTML = `<section class="rack" aria-labelledby="h-rack">
      <h2 class="h2" id="h-rack">Your spice rack</h2>
      <p class="rack-sub">Tap what you have. Every recipe shows which of its seasonings are in your rack. <strong class="num">${state.rack.length}</strong> in your rack.</p>
      <div class="chips">${D.seasonings.map((s) => chip(s, false)).join("")}${customs.map((s) => chip(s, true)).join("")}</div>
      <form class="add rack-form" id="rack-form" novalidate>
        <div class="add-row">
          <div class="input-group grow"><label for="rack-new">Add your own seasoning</label><input id="rack-new" type="text" maxlength="30" autocomplete="off" placeholder="adobo, curry powder, za'atar"></div>
          <button class="btn" type="submit">Add seasoning</button>
        </div>
        <p class="form-error" id="rack-error" role="alert"></p>
      </form>
    </section>`;
  }

  function toggleRack(id) {
    if (inRack(id)) state.rack = state.rack.filter((s) => s.id !== id);
    else state.rack.push({ id, name: presetSeasoning[id].name });
    save("rack");
    renderRack();
    const again = document.querySelector(`[data-rack="${id}"]`);
    if (again) again.focus(); // keep keyboard focus on the chip after the redraw
  }

  function addSeasoning(raw) {
    const err = () => $("#rack-error");
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) { err().classList.remove("is-info"); err().textContent = "Type a seasoning first."; $("#rack-new").focus(); return; }
    const preset = D.seasonings.find((s) => s.name.toLowerCase() === name.toLowerCase() || s.id === slug(name));
    const id = preset ? preset.id : "s-" + slug(name);
    if (id === "s-") { err().classList.remove("is-info"); err().textContent = "Use letters or numbers for the name."; return; }
    if (inRack(id)) { renderRack(); err().classList.add("is-info"); err().textContent = `${seasonName(id)} is already in your rack.`; $("#rack-new").focus(); return; }
    state.rack.push({ id, name: preset ? preset.name : name.charAt(0).toUpperCase() + name.slice(1) });
    save("rack");
    renderRack();
    const added = document.querySelector(`[data-rack="${id}"]`);
    if (added && !reduceMotion()) added.animate([{ opacity: 0, transform: "scale(.85)" }, { opacity: 1, transform: "none" }], { duration: 220, easing: "cubic-bezier(.2,.7,.2,1)" });
    $("#rack-new").focus();
  }

  function renderMe() {
    const body = $("#me-body");
    const p = state.profile;
    if (!p || editing) { body.innerHTML = profileFormHTML(p); return; }
    const recent = state.cooked.slice(0, 6);
    body.innerHTML = `<div class="me-grid">
      <div class="card-tag">
        <p class="card-hello">Hello, I'm</p>
        <p class="tape tape--name" style="--r:-2deg">${esc(p.name)}</p>
        <p class="card-school">${esc(p.school || "No school added")}</p>
        <p class="receipt-tags">${p.tools.length ? p.tools.map((t) => `<span class="tag tag--dark">${toolName(t)}</span>`).join("") : `<span class="tag tag--dark">No appliances yet</span>`}</p>
        <div class="row"><button type="button" class="btn" id="me-edit">Edit card</button><button type="button" class="btn btn--ghost" id="me-out">Sign out</button></div>
      </div>
      <div>
        <h2 class="h2">Cooked so far: ${state.cooked.length}</h2>
        ${recent.length ? `<ul class="cooked">${recent.map((c) => `<li><button type="button" class="link-btn" data-open="${c.recipe}">${esc(recipeById[c.recipe] ? recipeById[c.recipe].name : c.recipe)}</button> <span>${new Date(c.at).toLocaleDateString()}</span></li>`).join("")}</ul>` : `<p class="empty-inline">Nothing cooked yet. Your first dish lands here.</p>`}
        <h2 class="h2">On your shelves: ${state.fridge.length} items</h2>
        <button type="button" class="btn btn--ghost" id="reset">Reset all demo data</button>
      </div>
    </div>`;
  }

  // Two-tap confirm instead of a browser pop-up: first tap arms the button, second tap acts.
  function armThenRun(btn, armedLabel, run) {
    if (btn.dataset.armed) { run(); return; }
    const original = btn.textContent;
    btn.dataset.armed = "1";
    btn.textContent = armedLabel;
    setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = original; } }, 3000);
  }

  function renderHeader() {
    const who = $("#who");
    who.textContent = state.profile ? state.profile.name : "Sign in";
  }

  function renderAll() {
    renderShelves();
    renderQuickChips();
    renderStack();
    renderCook();
    renderList();
    renderFeed();
    renderImports();
    renderMe();
    renderRack();
    renderHeader();
    if (!$("#photo-panel").hidden) renderPhotoChips();
  }

  // ================= ROUTING (tabs via #hash, so refresh and Back work) =================
  const TABS = ["fridge", "cook", "list", "feed", "import", "me"];
  const TITLES = { fridge: "Fridge", cook: "Cook", list: "Grocery list", feed: "Feed", import: "Import", me: "Me" };
  function show(tab, scroll) {
    if (!TABS.includes(tab)) tab = "fridge";
    currentTab = tab;
    TABS.forEach((t) => {
      $("#view-" + t).hidden = t !== tab;
      const link = $("#tab-" + t);
      if (t === tab) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
    });
    document.title = `UniCook: ${TITLES[tab]}`;
    if (scroll) window.scrollTo(0, 0);
    updateBadge();
  }

  // ================= EVENTS =================
  // Fill the add form's lists once.
  $("#ing-list").innerHTML = D.ingredients.map((i) => `<option value="${esc(i.name)}">`).join("");
  $("#add-cat").innerHTML = D.categories.map((c) => `<option value="${c.id}">${c.label}</option>`).join("");

  // Typing a known food moves the shelf picker to the right shelf, so the user doesn't have to.
  $("#add-name").addEventListener("input", (e) => {
    const known = findIngredient(e.target.value);
    if (known) { $("#add-cat").value = known.cat; renderQuickChips(); }
    $("#add-error").textContent = "";
  });
  $("#add-cat").addEventListener("change", renderQuickChips);

  $("#add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = addItem($("#add-name").value, $("#add-cat").value);
    if (res.error) { $("#add-error").textContent = res.error; return; }
    $("#add-name").value = "";
    $("#add-error").textContent = "";
    renderAll();
    $("#add-name").focus();
  });

  $("#sample-btn").addEventListener("click", () => {
    let added = 0;
    D.sampleFridge.forEach((id) => {
      if (!state.fridge.some((i) => i.id === id)) { const ing = ingById[id]; state.fridge.push({ id, name: ing.name, cat: ing.cat }); added += 1; }
    });
    save("fridge");
    renderAll();
    toast(added ? `Added ${added} sample items.` : "The sample items are already on your shelves.");
  });

  // Photo: show the picture, then let the user tap what they see. No detection is faked.
  let photoUrl = null;
  $("#photo-btn").addEventListener("click", () => $("#photo-input").click());
  $("#photo-input").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("That file isn't a photo. Try a JPG or PNG."); return; }
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    photoUrl = URL.createObjectURL(file); // stays in this tab only; the photo is never uploaded or saved
    $("#photo-preview").src = photoUrl;
    $("#photo-panel").hidden = false;
    renderPhotoChips();
    e.target.value = ""; // lets the same photo be picked again later
  });
  $("#photo-done").addEventListener("click", () => {
    $("#photo-panel").hidden = true;
    if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
    $("#photo-preview").removeAttribute("src");
  });

  $("#feed-school").addEventListener("change", (e) => { state.feed.school = e.target.value; renderFeed(); });
  $("#feed-canmake").addEventListener("change", (e) => { state.feed.canMake = e.target.checked; renderFeed(); });
  $("#surprise").addEventListener("click", surprise);

  $("#import-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const raw = $("#import-url").value;
    const err = $("#import-error");
    if (!raw.trim()) { err.textContent = "Paste a TikTok or Instagram Reels link first."; return; }
    const platform = parseVideoLink(raw);
    if (!platform) { err.textContent = "That doesn't look like a TikTok or Instagram Reels link. It should start with https://www.tiktok.com/ or https://www.instagram.com/reel/."; return; }
    err.textContent = "";
    const url = raw.trim();
    // Same link always maps to the same sample recipe, so re-importing doesn't feel random.
    const imp = { url, platform, recipe: D.recipes[hash(url) % D.recipes.length].id, at: Date.now() };
    state.imports = [imp, ...state.imports.filter((i) => i.url !== url)].slice(0, 20);
    save("imports");
    $("#import-result").innerHTML = importResultHTML(imp);
    $("#import-url").value = "";
    renderImports();
  });

  // One click listener for buttons that are re-rendered often (tapes, chips, receipts, likes, dialog).
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.hasAttribute("data-closego")) { $("#recipe-dialog").close(); return; } // link inside the recipe: close, then follow it
    if (t.dataset.rack) { toggleRack(t.dataset.rack); return; }
    if (t.dataset.peel) {
      const id = t.dataset.peel;
      if (reduceMotion()) { removeItem(id); return; }
      const anim = t.animate([{ transform: getComputedStyle(t).transform, opacity: 1 }, { transform: "translate(24px,-28px) rotate(14deg)", opacity: 0 }], { duration: 220, easing: "ease-in" });
      anim.onfinish = () => removeItem(id);
      return;
    }
    if (t.dataset.quick) { addItem(ingById[t.dataset.quick].name); renderAll(); return; }
    if (t.dataset.photo) {
      const id = t.dataset.photo;
      if (state.fridge.some((i) => i.id === id)) { state.fridge = state.fridge.filter((i) => i.id !== id); save("fridge"); } else addItem(ingById[id].name);
      renderAll();
      return;
    }
    if (t.dataset.open) { openRecipe(t.dataset.open); return; }
    if (t.dataset.filter) {
      state.filters[t.dataset.filter] = t.dataset.value;
      renderCook(); renderFeed();
      // The chips were redrawn: put keyboard focus back on the same chip.
      const again = document.querySelector(`#view-${currentTab} [data-filter="${t.dataset.filter}"][data-value="${t.dataset.value}"]`);
      if (again) again.focus();
      return;
    }
    if (t.hasAttribute("data-clearfilters")) {
      state.filters = { diff: "Any", time: "Any", ing: "Any" };
      renderCook(); renderFeed();
      toast("Filters cleared.");
      return;
    }
    if (t.dataset.like) {
      const id = t.dataset.like;
      if (state.likes[id]) delete state.likes[id]; else state.likes[id] = true;
      save("likes");
      const liked = !!state.likes[id];
      t.setAttribute("aria-pressed", String(liked));
      t.querySelector(".num").textContent = Number(t.dataset.base) + (liked ? 1 : 0);
      if (liked) celebrateLike(t);
      return;
    }
    if (t.dataset.comments) {
      const id = t.dataset.comments;
      const box = document.getElementById("c-" + id);
      const open = box.hidden;
      box.hidden = !open;
      t.setAttribute("aria-expanded", String(open));
      if (open) { state.openComments.add(id); box.querySelector("input").focus(); } else state.openComments.delete(id);
      return;
    }
    if (t.dataset.listtoggle) { toggleList(t.dataset.listtoggle); return; }
    if (t.dataset.unlist) { toggleList(t.dataset.unlist); return; }
    if (t.id === "list-add") { const id = $("#list-pick").value; if (id) { toggleList(id); toast(`Added ${recipeById[id].name} to your list.`); } return; }
    if (t.id === "buy-move") { moveCheckedToFridge(); return; }
    if (t.id === "post-open") { if ($("#post-form").hidden) openPostForm(); else closePostForm(); return; }
    if (t.id === "post-cancel") { closePostForm(); return; }
    if (t.dataset.share) { const id = t.dataset.share; $("#recipe-dialog").close(); location.hash = "feed"; openPostForm(id); return; }
    if (t.dataset.delpost) {
      const id = t.dataset.delpost;
      armThenRun(t, "Tap again to delete", () => { state.myPosts = state.myPosts.filter((p) => p.id !== id); delete state.comments[id]; save("myPosts"); save("comments"); renderFeed(); toast("Post deleted."); });
      return;
    }
    if (t.id === "ready-badge") { $(".stack-head").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" }); return; }
    if (t.hasAttribute("data-close")) { $("#recipe-dialog").close(); return; }
    if (t.id === "cook-start") { startCook(); return; }
    if (t.id === "cook-pause") { cook.running = !cook.running; renderCookPanel(); return; }
    if (t.id === "cook-next") { const r = recipeById[cook.id]; if (cook.idx === r.steps.length - 1) finishCook(); else startStep(cook.idx + 1); return; }
    if (t.id === "cook-stop") { stopCook(); renderCookPanel(); return; }
    if (t.id === "me-tool-add") { addCustomTool(); return; }
    if (t.id === "me-edit") { editing = true; renderMe(); $("#me-name").focus(); return; }
    if (t.id === "me-cancel") { editing = false; renderMe(); return; }
    if (t.id === "me-out") {
      armThenRun(t, "Tap again to sign out", () => { state.profile = null; Store.set("profile", null); editing = false; renderAll(); toast("Signed out. Your fridge is still here."); });
      return;
    }
    if (t.id === "reset") {
      armThenRun(t, "Tap again to erase everything", () => {
        Store.clearAll();
        Object.assign(state, { fridge: [], profile: null, likes: {}, imports: [], cooked: [], list: [], listChecked: {}, myPosts: [], comments: {}, rack: [] });
        closePostForm();
        state.readyBefore = new Set();
        editing = false;
        $("#import-result").innerHTML = "";
        renderAll();
        toast("All demo data erased.");
      });
    }
  });

  // Grocery list checkboxes and the caption counter (inputs, so not caught by the click listener above).
  document.addEventListener("change", (e) => {
    const id = e.target.dataset && e.target.dataset.buy;
    if (!id) return;
    if (e.target.checked) state.listChecked[id] = true; else delete state.listChecked[id];
    save("listChecked");
    renderList();
    const again = document.querySelector(`[data-buy="${id}"]`);
    if (again) again.focus(); // keep keyboard focus after the list re-renders
  });
  // Enter in the "add appliance" box adds it instead of saving the whole card.
  document.addEventListener("keydown", (e) => {
    if (e.target.id === "me-tool-new" && e.key === "Enter") { e.preventDefault(); addCustomTool(); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "post-cap") $("#post-count").textContent = `${e.target.value.length}/140`;
  });

  // Adding your own seasoning to the rack.
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "rack-form") return;
    e.preventDefault();
    addSeasoning($("#rack-new").value);
  });

  // Writing a comment (needs a kitchen card so it shows your nickname).
  document.addEventListener("submit", (e) => {
    const postId = e.target.dataset && e.target.dataset.cform;
    if (!postId) return;
    e.preventDefault();
    const input = e.target.querySelector("input");
    const err = document.querySelector(`[data-cerror="${postId}"]`);
    if (!state.profile) {
      err.textContent = "Make your kitchen card first so comments show your nickname.";
      toast("Make your kitchen card first.", { label: "Make it", fn: () => { location.hash = "me"; } });
      return;
    }
    const text = input.value.trim();
    if (!text) { err.textContent = "Write something first."; input.focus(); return; }
    err.textContent = "";
    const c = { id: "c" + Date.now(), user: state.profile.name, text, at: Date.now() };
    (state.comments[postId] = state.comments[postId] || []).push(c);
    save("comments");
    // Update this post only, so other open comment boxes keep what's typed in them.
    const list = document.querySelector(`[data-clist="${postId}"]`);
    const empty = list.querySelector(".comment-empty");
    if (empty) empty.remove();
    list.insertAdjacentHTML("beforeend", commentLI({ ...c, when: "just now", mine: true }));
    if (!reduceMotion()) list.lastElementChild.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" });
    document.querySelector(`[data-ccount="${postId}"]`).textContent = commentsFor(postId).length;
    input.value = "";
    input.focus();
  });

  // Your own feed post.
  $("#post-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const caption = $("#post-cap").value.trim();
    if (!caption) { $("#post-error").textContent = "Write a short caption first."; $("#post-cap").focus(); return; }
    state.myPosts.unshift({ id: "m" + Date.now(), recipe: $("#post-recipe").value, caption, at: Date.now(), user: state.profile.name, school: state.profile.school || "No school added" });
    save("myPosts");
    closePostForm();
    state.feed.school = "All";
    renderFeed();
    toast("Posted. It's saved on this device only.");
  });

  // The badge hides once the recipe stack scrolls into view.
  window.addEventListener("scroll", () => updateBadge(), { passive: true });
  window.addEventListener("resize", () => updateBadge());

  // Profile form submit (the form is re-rendered, so listen on the document).
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "me-form") return;
    e.preventDefault();
    const name = $("#me-name").value.trim();
    if (!name) { $("#me-error").textContent = "Pick a nickname so your card has a name."; $("#me-name").focus(); return; }
    const checked = [...document.querySelectorAll("#tool-chips input:checked")];
    const tools = checked.map((i) => i.value);
    const customTools = checked.filter((i) => i.dataset.custom).map((i) => ({ id: i.value, name: i.dataset.custom }));
    state.profile = { name, school: $("#me-school").value.trim(), tools, customTools };
    save("profile");
    editing = false;
    renderAll();
    toast("Kitchen card saved.");
  });

  // Closing the dialog (button, Esc or backdrop) always stops the timer.
  const dlg = $("#recipe-dialog");
  dlg.addEventListener("close", stopCook);
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); }); // click on the dark backdrop

  window.addEventListener("hashchange", () => show(location.hash.slice(1), true));

  // First paint: anything already READY on load is not stamped again.
  state.readyBefore = new Set(allMatches().filter((m) => m.toolsOk && m.missing.length === 0).map((m) => m.r.id));
  renderAll();
  show(location.hash.slice(1), false);
})();
