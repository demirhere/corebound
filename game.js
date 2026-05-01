/* COREBOUND: Starpath - rules engine and renderer (solo leadership prototype). */

(function () {
  "use strict";

  var D = window.COREBOUND_STARPATH_DATA;
  var STORAGE_KEY = "corebound.starpath.v3";

  if (!D) return;

  var state;
  var scoutContinuation = null; // not persisted; cleared on reload
  var wakeContinuation = null;  // not persisted; cleared on reload
  var boardDrag = null;
  var resolvingMotherIds = null;
  var BOARD_AREA_X = 320;

  document.addEventListener("DOMContentLoaded", init);

  // ============================================================
  // INIT / WIRING
  // ============================================================

  function init() {
    state = normalizeState(loadState()) || newGameState();
    if (state.pendingScout) state.pendingScout = null;
    if (state.pendingWake) state.pendingWake = null;
    state.proposal = null;
    ensureBoardState();

    document.body.addEventListener("click", onClick);
    document.body.addEventListener("pointerdown", onBoardPointerDown);
    document.addEventListener("keydown", onKeydown);

    saveState();
    exposeState();
    render();
  }

  function onClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target) return;
    var action = target.dataset.action;
    if (typeof actions[action] !== "function") return;
    event.preventDefault();
    actions[action](target);
  }

  function onKeydown(event) {
    if (isTypingTarget(event.target)) return;
    var key = event.key.toLowerCase();
    if (key === "m") return toggleManual();
    if (key === "escape") return closeOverlays();
    if (key === "r") {
      if (window.confirm("Reset the voyage?")) hardReset();
    }
  }

  function isTypingTarget(target) {
    return target && target.matches && target.matches("input, textarea, select");
  }

  // ============================================================
  // STATE MODEL
  // ============================================================

  function defaultPlayers() {
    return [
      { id: "p1", name: "Solo Captain", color: "#2c4259" }
    ];
  }

  function newGameState() {
    var chamberDeck = shuffle(D.chambers.map(function (c) { return c.id; }));
    var market = chamberDeck.splice(0, 3);
    var players = defaultPlayers();
    var ownerId = players[0].id;

    var motherCards = [];
    for (var i = 0; i < D.starting.motherCards; i += 1) {
      motherCards.push({ id: "m" + (i + 1), used: false });
    }

    return {
      phase: "play",
      hull: D.starting.hull,
      fuel: D.starting.fuel,
      parts: D.starting.parts,
      motherCards: motherCards,
      players: players,
      activePlayerIndex: 0,
      crew: D.crew.map(function (c) {
        return {
          id: c.id,
          name: c.name,
          icons: c.icons.slice(),
          awake: c.startsAwake,
          tired: false,
          wounded: false,
          ownerPlayerId: c.startsAwake ? ownerId : null
        };
      }),
      cryoDeck: D.crew.filter(function (c) { return !c.startsAwake; }).map(function (c) { return c.id; }),
      decks: {
        sector1: shuffle(D.sector1Stars.map(function (s) { return s.id; })),
        sector2: shuffle(D.sector2Stars.map(function (s) { return s.id; })),
        sector3: shuffle(D.sector3Stars.map(function (s) { return s.id; }))
      },
      discards: { sector1: [], sector2: [], sector3: [] },
      sectorGates: {},
      sectorIndex: 0,
      starsThisSector: 0,
      sectorRevealed: false,
      horizon: null,
      highlightedCrew: [],
      highlightedMother: [],
      proposal: null,
      currentImplementer: null,
      lastGateImplementerPlayerId: null,
      finalGatePassed: false,
      winnerPlayerId: null,
      winnerPlayerIds: [],
      finalGateContributions: {},
      freeStarNext: false,
      driveCathedralActive: false,
      log: [],
      pendingScout: null,
      pendingWake: null,
      gateDraft: null,
      chamberMarket: market,
      chamberDeck: chamberDeck,
      chamberInstalled: [],
      chamberFlags: {},
      board: { z: 20, cards: [] },
      message: "",
      lossReason: null
    };
  }

  function normalizeState(s) {
    if (!s || typeof s !== "object") return null;

    if (!Array.isArray(s.players) || s.players.length === 0) s.players = defaultPlayers();
    if (typeof s.activePlayerIndex !== "number") s.activePlayerIndex = 0;
    if (s.activePlayerIndex < 0 || s.activePlayerIndex >= s.players.length) s.activePlayerIndex = 0;

    if (!Array.isArray(s.highlightedCrew)) s.highlightedCrew = [];
    if (!Array.isArray(s.highlightedMother)) s.highlightedMother = [];
    if (!Array.isArray(s.log)) s.log = [];
    if (!s.chamberFlags) s.chamberFlags = {};
    if (!Array.isArray(s.chamberInstalled)) s.chamberInstalled = [];
    if (!Array.isArray(s.chamberMarket)) s.chamberMarket = [];
    if (!Array.isArray(s.chamberDeck)) s.chamberDeck = [];
    if (!s.board || typeof s.board !== "object") s.board = { z: 20, cards: [] };
    if (!Array.isArray(s.board.cards)) s.board.cards = [];
    if (typeof s.board.z !== "number") s.board.z = 20;
    if (!s.discards) s.discards = { sector1: [], sector2: [], sector3: [] };
    if (!s.decks) {
      s.decks = {
        sector1: shuffle(D.sector1Stars.map(function (st) { return st.id; })),
        sector2: shuffle(D.sector2Stars.map(function (st) { return st.id; })),
        sector3: shuffle(D.sector3Stars.map(function (st) { return st.id; }))
      };
    }
    if (!s.sectorGates) s.sectorGates = {};
    if (typeof s.sectorIndex !== "number") s.sectorIndex = 0;
    if (typeof s.starsThisSector !== "number") s.starsThisSector = 0;
    if (s.sectorRevealed == null) s.sectorRevealed = false;

    var ownerId = s.players[0].id;
    if (!Array.isArray(s.crew) || s.crew.length === 0) {
      s.crew = D.crew.map(function (c) {
        return {
          id: c.id,
          name: c.name,
          icons: c.icons.slice(),
          awake: c.startsAwake,
          tired: false,
          wounded: false,
          ownerPlayerId: c.startsAwake ? ownerId : null
        };
      });
    }
    s.crew.forEach(function (c) {
      var base = D.crew.find(function (d) { return d.id === c.id; });
      if (base) {
        if (!c.name) c.name = base.name;
        if (!Array.isArray(c.icons)) c.icons = base.icons.slice();
      }
      c.awake = !!c.awake;
      c.tired = !!c.tired;
      c.wounded = !!c.wounded;
      if (!c.awake) c.ownerPlayerId = null;
      else if (!c.ownerPlayerId) c.ownerPlayerId = ownerId;
    });
    if (!Array.isArray(s.cryoDeck)) {
      s.cryoDeck = D.crew.map(function (c) { return c.id; }).filter(function (id) {
        var crew = s.crew.find(function (c) { return c.id === id; });
        return crew && !crew.awake;
      });
    }
    s.cryoDeck = dedupe(s.cryoDeck).filter(function (id) {
      var crew = s.crew.find(function (c) { return c.id === id; });
      return crew && !crew.awake;
    });
    s.crew.forEach(function (c) {
      if (!c.awake && s.cryoDeck.indexOf(c.id) < 0) s.cryoDeck.push(c.id);
    });

    if (!Array.isArray(s.motherCards) || s.motherCards.length === 0) {
      s.motherCards = [];
      for (var i = 0; i < D.starting.motherCards; i += 1) s.motherCards.push({ id: "m" + (i + 1), used: false });
    }

    if (s.phase === "setup") s.phase = "play";
    if (["play", "gate", "gateDraft", "finished", "loss"].indexOf(s.phase) < 0) s.phase = "play";

    if (s.phase !== "gateDraft") s.gateDraft = null;
    if (s.phase !== "loss") s.lossReason = s.lossReason || null;
    s.proposal = null;
    if (s.pendingScout) s.pendingScout = null;
    if (s.pendingWake) s.pendingWake = null;

    [
      ["arr", "ivalDeck"],
      ["arr", "ivalDraw"],
      ["arr", "ivalChosen"],
      ["selected", "Arr", "ival"],
      ["drawn", "Arr", "ivals"],
      ["visited", "Leg", "acyCounts"],
      ["dominant", "Leg", "acy"],
      ["mother", "Tone"],
      ["end", "ingTitle"],
      ["end", "ingBody"],
      ["end", "ingText"],
      ["final", "Approach"]
    ].forEach(function (parts) { delete s[parts.join("")]; });

    if (!s.finalGateContributions) s.finalGateContributions = {};
    if (!Array.isArray(s.winnerPlayerIds)) s.winnerPlayerIds = [];

    return s;
  }

  function dedupe(arr) {
    var seen = {};
    return arr.filter(function (id) {
      if (seen[id]) return false;
      seen[id] = true;
      return true;
    });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ============================================================
  // LOOKUPS
  // ============================================================

  function getStar(id) {
    var all = D.sector1Stars.concat(D.sector2Stars, D.sector3Stars);
    return all.find(function (s) { return s.id === id; });
  }

  function getGate(id) {
    var all = D.gates.sector1.concat(D.gates.sector2, D.gates.sector3);
    return all.find(function (g) { return g.id === id; });
  }

  function getChamber(id) {
    return D.chambers.find(function (c) { return c.id === id; });
  }

  function getCrew(id) {
    return state.crew.find(function (c) { return c.id === id; });
  }

  function getPlayer(id) {
    return state.players.find(function (p) { return p.id === id; });
  }

  function activePlayer() {
    return state.players[state.activePlayerIndex] || state.players[0];
  }

  function activePlayerId() {
    var p = activePlayer();
    return p ? p.id : "p1";
  }

  function currentSectorKey() {
    return D.sectorOrder[Math.min(state.sectorIndex, 2)];
  }

  function currentDeck() {
    return state.decks[currentSectorKey()];
  }

  function currentGateId() {
    return state.sectorGates[currentSectorKey()];
  }

  function hasChamber(id) {
    return state.chamberInstalled.indexOf(id) >= 0;
  }

  function isFinalSector() {
    return state.sectorIndex >= 2;
  }

  // ============================================================
  // MOTHER BANDS
  // ============================================================

  function motherUsedCount() {
    return state.motherCards.filter(function (m) { return m.used; }).length;
  }

  function motherUnusedCount() {
    return state.motherCards.length - motherUsedCount();
  }

  function motherDeckCount() {
    return state.motherCards.filter(function (m) {
      return !m.used && state.highlightedMother.indexOf(m.id) < 0;
    }).length;
  }

  function motherBand() {
    var n = motherUsedCount();
    if (n <= 2) return "clear";
    if (n <= 4) return "bent";
    if (n <= 6) return "hostile";
    return "wheel";
  }

  function thresholdActive(card, level) {
    if (!card) return null;
    var n = motherUsedCount();
    if (level === 3 && card.mother3 && n >= 3) return card.mother3;
    if (level === 5 && card.mother5 && n >= 5) return card.mother5;
    return null;
  }

  // ============================================================
  // EFFECTIVE STAR / GATE PROPERTIES
  // ============================================================

  function effectiveStarTravel(starId) {
    var s = getStar(starId);
    if (!s) return 0;
    var travel = s.travel;
    var t3 = thresholdActive(s, 3);
    var t5 = thresholdActive(s, 5);
    if (t3 && t3.travelDelta) travel += t3.travelDelta;
    if (t5 && t5.travelDelta) travel += t5.travelDelta;
    if (state.driveCathedralActive) {
      var driveOk = true;
      if (motherUsedCount() >= 3 && travel > 1) driveOk = false;
      if (driveOk) travel = Math.max(0, travel - 1);
    }
    if (travel < 0) travel = 0;
    return travel;
  }

  function effectiveStarReward(starId) {
    var s = getStar(starId);
    if (!s) return [];
    var t5 = thresholdActive(s, 5);
    if (t5 && t5.rewardOverride) return t5.rewardOverride;
    var t3 = thresholdActive(s, 3);
    if (t3 && t3.rewardOverride) return t3.rewardOverride;
    return s.reward || [];
  }

  function effectiveStarNeed(starId) {
    var s = getStar(starId);
    if (!s) return [];
    var need = s.need.slice();
    var t3 = thresholdActive(s, 3);
    var t5 = thresholdActive(s, 5);
    if (t3 && t3.addNeed) need = need.concat(t3.addNeed);
    if (t5 && t5.addNeed) need = need.concat(t5.addNeed);
    return need;
  }

  function effectiveStarExtraCrew(starId) {
    var s = getStar(starId);
    if (!s) return 0;
    var extra = 0;
    var t3 = thresholdActive(s, 3);
    var t5 = thresholdActive(s, 5);
    if (t3 && t3.extraCrew) extra += t3.extraCrew;
    if (t5 && t5.extraCrew) extra += t5.extraCrew;
    return extra;
  }

  function effectiveStarScout(starId) {
    var s = getStar(starId);
    if (!s) return 3;
    var base = 3;
    var rewards = effectiveStarReward(starId);
    var rewardScout = rewards.find(function (e) { return e.type === "scout"; });
    if (rewardScout) base = rewardScout.amount || 3;
    var t3 = thresholdActive(s, 3);
    var t5 = thresholdActive(s, 5);
    if (t3 && t3.scoutDelta) base += t3.scoutDelta;
    if (t5 && t5.scoutDelta) base += t5.scoutDelta;
    if (base < 1) base = 1;
    return base;
  }

  function gateExtraIcons(gate) {
    if (motherUsedCount() >= 5) {
      return gate.need[0] ? [gate.need[0]] : [];
    }
    return [];
  }

  function gateNeed() {
    var g = getGate(currentGateId());
    if (!g) return [];
    return g.need.concat(gateExtraIcons(g));
  }

  // ============================================================
  // ICON COVERAGE
  // ============================================================

  function getCrewIconContribution(crew) {
    if (!crew || !crew.awake) return [];
    if (crew.wounded) return [crew.icons[0]];
    return crew.icons.slice();
  }

  function highlightedCrewIcons() {
    var icons = [];
    state.highlightedCrew.forEach(function (id) {
      var c = getCrew(id);
      icons = icons.concat(getCrewIconContribution(c));
    });
    return icons;
  }

  function highlightedMotherCount() {
    return state.highlightedMother.length;
  }

  function coverageReport(need) {
    var provided = highlightedCrewIcons().slice();
    var missing = [];
    need.forEach(function (icon) {
      var idx = provided.indexOf(icon);
      if (idx >= 0) provided.splice(idx, 1);
      else missing.push(icon);
    });
    var wilds = highlightedMotherCount();
    return { need: need, provided: provided, missing: missing, wildsLeft: wilds - missing.length };
  }

  function coverageFrom(need, provided, wilds) {
    var pool = provided.slice();
    var missing = [];
    need.forEach(function (icon) {
      var idx = pool.indexOf(icon);
      if (idx >= 0) pool.splice(idx, 1);
      else missing.push(icon);
    });
    return { missing: missing, wildsLeft: wilds - missing.length };
  }

  function humanCount() {
    return state.highlightedCrew.length;
  }

  function selectedHumanCountByPlayer() {
    var counts = {};
    state.highlightedCrew.forEach(function (crewId) {
      var c = getCrew(crewId);
      if (!c || !c.ownerPlayerId) return;
      counts[c.ownerPlayerId] = (counts[c.ownerPlayerId] || 0) + 1;
    });
    return counts;
  }

  // ============================================================
  // ACTIONS
  // ============================================================

  var actions = {
    drawSector: function () { doDrawSector(); },
    drawHorizon: function () { doDrawHorizon(); },
    addCrewToBoard: function (el) { doAddCrewToBoard(el.dataset.crewId); },
    returnBoardCard: function (el) { doReturnBoardCard(el.dataset.boardUid); },
    dismissBoardStack: function (el) { doDismissBoardStack(el.dataset.boardUid); },
    takeBoardAction: function (el) { doTakeBoardAction(el.dataset.boardUid); },
    toggleCrew: function (el) { doToggleCrew(el.dataset.crewId); },
    toggleMother: function (el) { doToggleMother(el.dataset.motherId); },
    drawMother: function () { doDrawMother(); },
    proposeStar: function (el) { doPropose("star", el.dataset.starId); },
    proposeChamber: function (el) { doPropose("chamber", el.dataset.chamberId); },
    proposeGate: function () { doPropose("gate", currentGateId()); },
    resolveProposal: function () { doResolveProposal(); },
    dissolveProposal: function () { doDissolveProposal(); },
    reroute: function () { doReroute(); },
    chooseScout: function (el) { doChooseScout(el.dataset.starId); },
    chooseWake: function (el) { doChooseWake(el.dataset.crewId); },
    chooseGateDraft: function (el) { doChooseGateDraft(el.dataset.crewId); },
    useDriveCathedral: function () { doUseDriveCathedral(); },
    useArchiveNode: function () { doUseArchiveNode(); },
    closeManual: function () {
      var p = document.getElementById("manualPanel"); if (p) p.hidden = true;
    },
    openManual: function () {
      var p = document.getElementById("manualPanel"); if (p) p.hidden = false;
    },
    reset: function () {
      if (window.confirm("Reset the voyage?")) hardReset();
    },
    newGame: function () { hardReset(); }
  };

  function hardReset() {
    state = newGameState();
    scoutContinuation = null;
    wakeContinuation = null;
    saveAndRender();
  }

  function advanceActivePlayer() {
    if (!state.players.length) return;
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  }

  // ============================================================
  // FREE BOARD / STACKING
  // ============================================================

  function ensureBoardState() {
    if (!state.board || typeof state.board !== "object") state.board = { z: 20, cards: [] };
    if (!Array.isArray(state.board.cards)) state.board.cards = [];
    if (typeof state.board.z !== "number") state.board.z = 20;

    ensureResourceCards("hull", state.hull, BOARD_AREA_X + 20, 24);
    ensureResourceCards("fuel", state.fuel, BOARD_AREA_X + 145, 24);
    ensureResourceCards("parts", state.parts, BOARD_AREA_X + 270, 24);
    ensureResourceCards("mother", motherUsedCount(), BOARD_AREA_X + 395, 24);

    var gateId = currentGateId();
    var gateVisible = !!(gateId && (state.sectorRevealed || state.phase === "gate"));
    if (gateVisible) {
      var gateItem = ensureBoardItem("gate", gateId, BOARD_AREA_X + 780, 40);
      if (!gateItem.stackOn && gateItem.x < BOARD_AREA_X) gateItem.x = BOARD_AREA_X + 780;
    }
    removeBoardCards(function (item) { return item.type === "gate" && (!gateVisible || item.ref !== gateId); });

    var horizonIds = Array.isArray(state.horizon) ? state.horizon.slice() : [];
    horizonIds.forEach(function (id, i) {
      var starItem = ensureBoardItem("star", id, BOARD_AREA_X + 20 + (i * 245), 245);
      if (!starItem.stackOn && starItem.x < BOARD_AREA_X) starItem.x = BOARD_AREA_X + 20 + (i * 245);
    });
    removeBoardCards(function (item) { return item.type === "star" && horizonIds.indexOf(item.ref) < 0; });

    state.chamberMarket.forEach(function (id, i) {
      var chamberItem = ensureBoardItem("chamber", id, 14, 380 + (i * 255));
      chamberItem.x = 14;
      chamberItem.y = 380 + (i * 255);
    });
    state.chamberInstalled.forEach(function (id, i) {
      var installedItem = ensureBoardItem("chamber", id, BOARD_AREA_X + 760 + ((i % 2) * 245), 480 + (Math.floor(i / 2) * 230));
      if (!installedItem.stackOn && installedItem.x < BOARD_AREA_X) {
        installedItem.x = BOARD_AREA_X + 760 + ((i % 2) * 245);
        installedItem.y = 480 + (Math.floor(i / 2) * 230);
      }
    });
    var visibleChambers = state.chamberMarket.concat(state.chamberInstalled);
    removeBoardCards(function (item) { return item.type === "chamber" && visibleChambers.indexOf(item.ref) < 0; });

    if (state.freeStarNext) ensureBoardItem("token", "freeStar", BOARD_AREA_X + 740, 24);
    else removeBoardCards(function (item) { return item.type === "token" && item.ref === "freeStar"; });

    state.highlightedMother = state.highlightedMother.filter(function (id) {
      var card = state.motherCards.find(function (m) { return m.id === id; });
      return card && !card.used;
    });
    state.highlightedMother.forEach(function (id, i) { ensureBoardItem("mother", id, BOARD_AREA_X + 20 + (i * 36), 690); });
    removeBoardCards(function (item) { return item.type === "mother" && state.highlightedMother.indexOf(item.ref) < 0; });

    removeBoardCards(function (item) {
      if (item.type !== "crew") return false;
      var crew = getCrew(item.ref);
      return !crew || !crew.awake || crew.tired;
    });

    cleanBoardStacks();
  }

  function ensureResourceCards(resource, count, x, y) {
    removeBoardCards(function (item) {
      if (item.type !== "ship") return false;
      if (item.ref === resource) return true;
      if (shipResource(item) !== resource) return false;
      return resourceCardIndex(item) > count;
    });
    for (var i = 1; i <= count; i += 1) {
      var pos = resourceHomePosition(resource, i);
      var item = ensureBoardItem("ship", resource + "-" + i, x + ((i - 1) * 10), y + ((i - 1) * 12));
      item.resource = resource;
      if (!item.stackOn && item.x < BOARD_AREA_X) {
        item.x = pos.x;
        item.y = pos.y;
      }
    }
  }

  function shipResource(item) {
    if (!item || item.type !== "ship") return null;
    if (item.resource) return item.resource;
    if (["hull", "fuel", "parts", "mother"].indexOf(item.ref) >= 0) return item.ref;
    var match = String(item.ref || "").match(/^(hull|fuel|parts|mother)-\d+$/);
    return match ? match[1] : null;
  }

  function resourceCardIndex(item) {
    var match = String(item && item.ref || "").match(/-(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  function boardUid(type, ref) {
    return type + "-" + ref;
  }

  function boardItem(uid) {
    ensureBoardStateShape();
    return state.board.cards.find(function (item) { return item.uid === uid; });
  }

  function boardItemFor(type, ref) {
    return boardItem(boardUid(type, ref));
  }

  function ensureBoardStateShape() {
    if (!state.board || typeof state.board !== "object") state.board = { z: 20, cards: [] };
    if (!Array.isArray(state.board.cards)) state.board.cards = [];
    if (typeof state.board.z !== "number") state.board.z = 20;
  }

  function ensureBoardItem(type, ref, x, y) {
    ensureBoardStateShape();
    var uid = boardUid(type, ref);
    var item = boardItem(uid);
    if (item) return item;
    item = {
      uid: uid,
      type: type,
      ref: ref,
      x: x,
      y: y,
      z: ++state.board.z,
      stackOn: null
    };
    state.board.cards.push(item);
    return item;
  }

  function removeBoardCards(predicate) {
    ensureBoardStateShape();
    state.board.cards.slice().forEach(function (item) {
      if (predicate(item)) removeBoardCard(item.uid);
    });
  }

  function removeBoardCard(uid) {
    ensureBoardStateShape();
    state.board.cards.forEach(function (item) {
      if (item.stackOn === uid) item.stackOn = null;
    });
    state.board.cards = state.board.cards.filter(function (item) { return item.uid !== uid; });
  }

  function cleanBoardStacks() {
    var ids = {};
    state.board.cards.forEach(function (item) { ids[item.uid] = true; });
    state.board.cards.forEach(function (item) {
      if (item.stackOn && !ids[item.stackOn]) item.stackOn = null;
      if (item.stackOn === item.uid) item.stackOn = null;
    });
  }

  function stackedBoardItems(targetUid) {
    ensureBoardStateShape();
    return state.board.cards.filter(function (item) { return item.stackOn === targetUid; });
  }

  function stackedBoardDescendants(targetUid) {
    var result = [];
    function visit(uid) {
      stackedBoardItems(uid).forEach(function (item) {
        result.push(item);
        visit(item.uid);
      });
    }
    visit(targetUid);
    return result;
  }

  function boardCommitment(targetUid) {
    var stacked = stackedBoardDescendants(targetUid);
    return {
      items: stacked,
      crewIds: stacked.filter(function (item) { return item.type === "crew"; }).map(function (item) { return item.ref; }),
      motherIds: stacked.filter(function (item) { return item.type === "mother"; }).map(function (item) { return item.ref; }),
      shipRefs: stacked.filter(function (item) { return item.type === "ship"; }).map(shipResource).filter(Boolean),
      shipItems: stacked.filter(function (item) { return item.type === "ship"; }),
      tokenRefs: stacked.filter(function (item) { return item.type === "token"; }).map(function (item) { return item.ref; })
    };
  }

  function resourceStackItems(stack, resource) {
    return (stack.shipItems || []).filter(function (item) { return shipResource(item) === resource; });
  }

  function boardCrewIcons(crewIds) {
    var icons = [];
    crewIds.forEach(function (id) {
      icons = icons.concat(getCrewIconContribution(getCrew(id)));
    });
    return icons;
  }

  function boardHumanCount(crewIds) {
    return crewIds.filter(function (id) {
      var crew = getCrew(id);
      return crew && crew.awake && !crew.tired;
    }).length;
  }

  function boardActionKind(item) {
    if (!item) return null;
    if (item.type === "star" && state.phase === "play" && state.horizon && state.horizon.indexOf(item.ref) >= 0) return "star";
    if (item.type === "chamber" && state.phase === "play" && state.sectorRevealed && state.chamberMarket.indexOf(item.ref) >= 0) return "chamber";
    if (item.type === "gate" && state.phase === "gate" && item.ref === currentGateId()) return "gate";
    return null;
  }

  function boardActionInfo(item) {
    var kind = boardActionKind(item);
    if (!kind) return null;
    if (kind === "star") return { kind: kind, label: "Travel", eligibility: boardTravelEligibility(item) };
    if (kind === "chamber") return { kind: kind, label: "Activate", eligibility: boardInstallEligibility(item) };
    if (kind === "gate") return { kind: kind, label: isFinalSector() ? "Pass Final Gate" : "Pass Gate", eligibility: boardGateEligibility(item) };
    return null;
  }

  function boardTravelEligibility(item) {
    var starId = item.ref;
    var s = getStar(starId);
    if (!s) return { ok: false, reason: "unknown Star" };
    var stack = boardCommitment(item.uid);
    var cost = travelCostFor(starId);
    var fuelCards = resourceStackItems(stack, "fuel");
    if (fuelCards.length < cost) return { ok: false, reason: "Need " + cost + " Fuel card" + (cost === 1 ? "" : "s") + "." };
    if (state.fuel < cost) return { ok: false, reason: "Need " + cost + " Fuel (have " + state.fuel + ")." };
    if (boardHumanCount(stack.crewIds) < 1) return { ok: false, reason: "Stack at least one Ready human crew." };

    var need = effectiveStarNeed(starId);
    var rep = coverageFrom(need, boardCrewIcons(stack.crewIds), stack.motherIds.length);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Stacked icons + MOTHER do not cover the Need." };
    if (stack.motherIds.length > 0 && boardHumanCount(stack.crewIds) === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is stacked." };
    }
    var extraCrew = effectiveStarExtraCrew(starId);
    if (extraCrew > 0) {
      var baseline = Math.max(2, Math.ceil(need.length / 2));
      var needHumans = baseline + extraCrew;
      if (boardHumanCount(stack.crewIds) < needHumans) {
        return { ok: false, reason: "3+ " + D.icons.mother.glyph + ": stack +" + extraCrew + " crew (need >=" + needHumans + " humans)." };
      }
    }
    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector
        && s.travel >= 2 && motherUsedCount() >= 3 && boardHumanCount(stack.crewIds) < 2) {
      return { ok: false, reason: "Gravity Sails needs >=2 humans on this discounted Star." };
    }
    return { ok: true, cost: cost, fuelUids: fuelCards.slice(0, cost).map(function (card) { return card.uid; }), motherSpent: Math.max(0, rep.missing.length), crewIds: stack.crewIds, motherIds: stack.motherIds };
  }

  function boardInstallEligibility(item) {
    var chamber = getChamber(item.ref);
    if (!chamber) return { ok: false, reason: "unknown Chamber" };
    var stack = boardCommitment(item.uid);
    var partCards = resourceStackItems(stack, "parts");
    if (state.chamberInstalled.length >= 3) return { ok: false, reason: "Three Chambers already fixed." };
    if (partCards.length < chamber.parts) return { ok: false, reason: "Need " + chamber.parts + " Parts card" + (chamber.parts === 1 ? "" : "s") + "." };
    if (state.parts < chamber.parts) return { ok: false, reason: "Need " + chamber.parts + " Parts (have " + state.parts + ")." };
    if (boardHumanCount(stack.crewIds) < 1) return { ok: false, reason: "Stack at least one Ready human crew." };
    var rep = coverageFrom(chamber.build, boardCrewIcons(stack.crewIds), stack.motherIds.length);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Stacked icons + MOTHER do not cover the Build." };
    return { ok: true, cost: chamber.parts, partsUids: partCards.slice(0, chamber.parts).map(function (card) { return card.uid; }), motherSpent: Math.max(0, rep.missing.length), crewIds: stack.crewIds, motherIds: stack.motherIds };
  }

  function boardGateEligibility(item) {
    var stack = boardCommitment(item.uid);
    if (boardHumanCount(stack.crewIds) < 1) return { ok: false, reason: "Stack at least one Ready human crew." };
    var rep = coverageFrom(gateNeed(), boardCrewIcons(stack.crewIds), stack.motherIds.length);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Stacked icons + MOTHER do not cover the Gate." };
    return { ok: true, motherSpent: Math.max(0, rep.missing.length), crewIds: stack.crewIds, motherIds: stack.motherIds };
  }

  function canStackBoardItem(item, target) {
    if (!item || !target || item.uid === target.uid) return false;
    if (item.type === "ship" && target.type === "ship" && shipResource(item) && shipResource(item) === shipResource(target)) return true;
    var kind = boardActionKind(target);
    if (!kind) return false;
    if (item.type === "crew" || item.type === "mother") return true;
    if (item.type === "ship" && shipResource(item) === "fuel" && kind === "star") return true;
    if (item.type === "ship" && shipResource(item) === "parts" && kind === "chamber") return true;
    if (item.type === "token" && item.ref === "freeStar" && kind === "star") return true;
    return false;
  }

  function stackBoardItemOn(item, target) {
    var idx = stackedBoardItems(target.uid).filter(function (stacked) { return stacked.uid !== item.uid; }).length;
    item.stackOn = target.uid;
    item.x = target.x + 22 + (idx * 18);
    item.y = target.y + 32 + (idx * 20);
    item.z = Math.max(item.z, target.z + 1 + idx);
    state.board.z = Math.max(state.board.z, item.z);
  }

  function rootBoardItem(item) {
    var cursor = item;
    var guard = 0;
    while (cursor && cursor.stackOn && guard < 20) {
      cursor = boardItem(cursor.stackOn);
      guard += 1;
    }
    return cursor || item;
  }

  function bringBoardGroupToFront(uid) {
    var item = boardItem(uid);
    if (!item) return;
    var root = rootBoardItem(item);
    var group = [root].concat(stackedBoardItems(root.uid));
    group.sort(function (a, b) { return a.z - b.z; });
    group.forEach(function (groupItem) { groupItem.z = ++state.board.z; });
  }

  function moveStackChildren(uid, dx, dy) {
    if (!dx && !dy) return;
    stackedBoardItems(uid).forEach(function (child) {
      child.x += dx;
      child.y += dy;
      moveStackChildren(child.uid, dx, dy);
    });
  }

  function boardDragArea() {
    return document.getElementById("boardPlayArea") || document.getElementById("boardSurface");
  }

  function boardCoordinates(event, offsetX, offsetY) {
    var area = boardDragArea();
    if (!area) return { x: 0, y: 0 };
    var rect = area.getBoundingClientRect();
    var maxX = Math.max(0, area.scrollWidth - 120);
    var maxY = Math.max(0, area.scrollHeight - 120);
    var x = event.clientX - rect.left - offsetX;
    var y = event.clientY - rect.top - offsetY;
    return { x: Math.max(0, Math.min(maxX, x)), y: Math.max(0, Math.min(maxY, y)) };
  }

  function boardNodeForUid(uid) {
    if (!document.querySelector) return null;
    return document.querySelector('[data-board-uid="' + cssEscape(uid) + '"]');
  }

  function cssEscape(value) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  function fixedBoardItem(item) {
    return item && item.type === "chamber" && state.chamberMarket.indexOf(item.ref) >= 0;
  }

  function onBoardPointerDown(event) {
    if (event.button !== 0) return;
    if (event.target.closest("[data-action]")) return;
    var node = event.target.closest("[data-board-uid]");
    if (!node) return;
    var area = boardDragArea();
    if (!area || !area.contains(node)) return;
    var item = boardItem(node.dataset.boardUid);
    if (!item) return;
    if (fixedBoardItem(item)) return;

    event.preventDefault();
    var rect = node.getBoundingClientRect();
    var children = item.stackOn ? [] : stackedBoardItems(item.uid).map(function (child) {
      return { uid: child.uid, startX: child.x, startY: child.y, node: boardNodeForUid(child.uid) };
    });
    boardDrag = {
      uid: item.uid,
      node: node,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      children: children,
      moved: false
    };
    node.setPointerCapture(event.pointerId);
    document.addEventListener("pointermove", onBoardPointerMove);
    document.addEventListener("pointerup", onBoardPointerUp);
  }

  function onBoardPointerMove(event) {
    if (!boardDrag || event.pointerId !== boardDrag.pointerId) return;
    var item = boardItem(boardDrag.uid);
    if (!item) return;
    var dx = event.clientX - boardDrag.startClientX;
    var dy = event.clientY - boardDrag.startClientY;
    if (Math.abs(dx) + Math.abs(dy) > 3) boardDrag.moved = true;
    var coords = boardCoordinates(event, boardDrag.offsetX, boardDrag.offsetY);
    var childDx = coords.x - boardDrag.startX;
    var childDy = coords.y - boardDrag.startY;
    boardDrag.node.classList.add("is-dragging");
    boardDrag.node.style.left = coords.x + "px";
    boardDrag.node.style.top = coords.y + "px";
    boardDrag.children.forEach(function (child) {
      if (!child.node) return;
      child.node.style.left = (child.startX + childDx) + "px";
      child.node.style.top = (child.startY + childDy) + "px";
    });
  }

  function onBoardPointerUp(event) {
    if (!boardDrag || event.pointerId !== boardDrag.pointerId) return;
    document.removeEventListener("pointermove", onBoardPointerMove);
    document.removeEventListener("pointerup", onBoardPointerUp);

    var item = boardItem(boardDrag.uid);
    if (item) {
      if (boardDrag.moved) {
        var coords = boardCoordinates(event, boardDrag.offsetX, boardDrag.offsetY);
        var oldX = item.x;
        var oldY = item.y;
        item.stackOn = null;
        item.x = coords.x;
        item.y = coords.y;

        var target = findBoardDropTarget(item.uid, event.clientX, event.clientY);
        if (target && canStackBoardItem(item, target)) {
          stackBoardItemOn(item, target);
        } else {
          moveStackChildren(item.uid, item.x - oldX, item.y - oldY);
        }
      } else {
        bringBoardGroupToFront(item.uid);
      }
      cleanBoardStacks();
      saveAndRender();
    }
    boardDrag = null;
  }

  function findBoardDropTarget(draggedUid, clientX, clientY) {
    if (!document.elementsFromPoint) return null;
    var dragged = boardItem(draggedUid);
    var elements = document.elementsFromPoint(clientX, clientY);
    for (var i = 0; i < elements.length; i += 1) {
      var node = elements[i].closest && elements[i].closest("[data-board-uid]");
      if (!node) continue;
      var uid = node.dataset.boardUid;
      if (!uid || uid === draggedUid) continue;
      var candidate = boardItem(uid);
      if (candidate && candidate.stackOn) candidate = boardItem(candidate.stackOn) || candidate;
      if (candidate && candidate.uid !== draggedUid && canStackBoardItem(dragged, candidate)) return candidate;
    }
    return null;
  }

  function doAddCrewToBoard(id) {
    var crew = getCrew(id);
    if (!crew || !crew.awake) return;
    if (crew.tired) { showMessage(crew.name + " has already worked this sector."); return; }
    if (state.phase !== "play" && state.phase !== "gate") return;
    var item = boardItemFor("crew", id);
    if (!item) item = ensureBoardItem("crew", id, BOARD_AREA_X + 20 + (state.board.cards.length % 8) * 28, 690 + (state.board.cards.length % 4) * 18);
    bringBoardGroupToFront(item.uid);
    saveAndRender();
  }

  function doReturnBoardCard(uid) {
    var item = boardItem(uid);
    if (!item) return;
    if (item.type === "mother") {
      state.highlightedMother = state.highlightedMother.filter(function (id) { return id !== item.ref; });
      removeBoardCard(uid);
      saveAndRender();
      return;
    }
    if (item.type === "crew") {
      removeBoardCard(uid);
      saveAndRender();
    }
  }

  function doDismissBoardStack(uid) {
    unstackTargetToBoard(uid);
    saveAndRender();
  }

  function unstackTargetToBoard(uid) {
    stackedBoardItems(uid).forEach(function (item, i) {
      item.stackOn = null;
      if (item.type === "ship" || item.type === "token") {
        returnBoardUtilityCard(item);
        return;
      }
      item.x = BOARD_AREA_X + 25 + ((i % 5) * 125);
      item.y = 720 + (Math.floor(i / 5) * 110);
    });
  }

  function doTakeBoardAction(uid) {
    var item = boardItem(uid);
    var info = boardActionInfo(item);
    if (!info) return;
    if (!info.eligibility.ok) {
      showMessage(info.eligibility.reason || "Stack the required cards here first.");
      return;
    }

    var implementer = activePlayerId();
    var kind = info.kind;
    var elig = info.eligibility;
    state.highlightedCrew = elig.crewIds.slice();
    resolvingMotherIds = elig.motherIds.slice();
    state.currentImplementer = implementer;
    state.proposal = {
      cardId: item.ref,
      cardType: kind,
      proposerPlayerId: implementer,
      implementerPlayerId: implementer,
      status: "resolved"
    };

    if (kind === "star") return resolveTravelProposal(item.ref, elig, implementer);
    if (kind === "chamber") return resolveInstallProposal(item.ref, elig, implementer);
    if (kind === "gate") return resolveGateProposal(elig, implementer);
  }

  function returnBoardUtilityCard(item) {
    if (!item) return;
    var oldX = item.x;
    var oldY = item.y;
    if (item.type === "ship") {
      var pos = resourceHomePosition(shipResource(item), resourceCardIndex(item));
      item.x = pos.x;
      item.y = pos.y;
    }
    if (item.type === "token") {
      item.x = BOARD_AREA_X + 740;
      item.y = 24;
    }
    moveStackChildren(item.uid, item.x - oldX, item.y - oldY);
  }

  function resourceHomePosition(resource, index) {
    var columns = { hull: 20, fuel: 145, parts: 270, mother: 395 };
    var baseX = BOARD_AREA_X + (columns[resource] || 20);
    var i = Math.max(0, (index || 1) - 1);
    return { x: baseX + (i * 10), y: 24 + (i * 12) };
  }

  function removeBoardCardsByUid(uids) {
    (uids || []).forEach(removeBoardCard);
  }

  // ============================================================
  // HORIZON / REROUTE
  // ============================================================

  function doDrawSector() {
    if (state.phase !== "play" || state.proposal) return;
    if (state.sectorRevealed) return;
    var key = currentSectorKey();
    state.sectorGates[key] = pickRandom(D.gates[key]).id;
    state.sectorRevealed = true;
    state.horizon = null;
    saveAndRender();
  }

  function revealHorizon() {
    var deck = currentDeck();
    var slots = hasChamber("ch-observation-dome") ? 4 : 3;
    var picks = [];
    while (picks.length < slots && deck.length > 0) picks.push(deck.shift());

    if (hasChamber("ch-observation-dome") && picks.length === 4) {
      var dropIdx;
      if (motherUsedCount() >= 3) {
        var lowest = 99;
        dropIdx = 0;
        picks.forEach(function (id, i) {
          var t = effectiveStarTravel(id);
          if (t < lowest) { lowest = t; dropIdx = i; }
        });
      } else {
        var sorted = picks.map(function (id, i) { return { id: id, i: i, travel: effectiveStarTravel(id) }; });
        sorted.sort(function (a, b) { return a.travel - b.travel; });
        dropIdx = sorted[0].i;
      }
      var dropped = picks.splice(dropIdx, 1)[0];
      state.discards[currentSectorKey()].push(dropped);
      if (motherUsedCount() >= 5 && !state.chamberFlags.observationDomeUsedThisSector) {
        if (motherUnusedCount() < 1) {
          state.horizon = picks;
          enterLoss("MOTHER Takes the Wheel");
          return;
        }
        spendMotherCards(1);
        state.chamberFlags.observationDomeUsedThisSector = true;
      }
    }
    state.horizon = picks;
  }

  function doDrawHorizon() {
    if (state.phase !== "play" || state.proposal) return;
    if (!state.sectorRevealed) return;
    if (state.horizon) return;
    if (currentDeck().length < 1) {
      showMessage("The sector deck is empty.");
      return;
    }
    revealHorizon();
    saveAndRender();
  }

  function horizonAffordableExists() {
    if (!state.horizon) return true;
    return state.horizon.some(function (id) {
      var cost = travelCostFor(id);
      return state.fuel >= cost;
    });
  }

  function doReroute() {
    if (state.phase !== "play" || state.proposal) return;
    if (!state.horizon) return;
    if (horizonAffordableExists()) {
      showMessage("At least one of these Stars is reachable. Propose one or fix a Chamber first.");
      return;
    }
    if (motherUnusedCount() < 1) {
      enterLoss("Stranded in the Reach");
      return;
    }
    state.horizon.forEach(function (id) { state.discards[currentSectorKey()].push(id); });
    state.horizon = null;
    spendMotherCards(1);
    revealHorizon();
    advanceActivePlayer();
    saveAndRender();
  }

  // ============================================================
  // PROPOSALS
  // ============================================================

  function proposalTargetLegal(type, id) {
    if (type === "star") return state.phase === "play" && state.horizon && state.horizon.indexOf(id) >= 0;
    if (type === "chamber") return state.phase === "play" && state.sectorRevealed && state.chamberMarket.indexOf(id) >= 0;
    if (type === "gate") return state.phase === "gate" && id === currentGateId();
    return false;
  }

  function doPropose(type, id) {
    if (state.proposal) {
      showMessage("Resolve or dissolve the current proposal first.");
      return;
    }
    if (!proposalTargetLegal(type, id)) return;
    state.proposal = {
      cardId: id,
      cardType: type,
      proposerPlayerId: activePlayerId(),
      implementerPlayerId: null,
      status: "open"
    };
    saveAndRender();
  }

  function doResolveProposal() {
    if (!state.proposal) return;
    if (humanCount() < 1) {
      showMessage("A proposal needs at least one committed human crew.");
      return;
    }
    var elig = proposalEligibility(state.proposal);
    if (!elig.ok) {
      showMessage(elig.reason || "The proposal is not ready.");
      return;
    }
    var implementer = activePlayerId();
    state.currentImplementer = implementer;
    state.proposal.implementerPlayerId = implementer;
    state.proposal.status = "resolved";

    if (state.proposal.cardType === "star") return resolveTravelProposal(state.proposal.cardId, elig, implementer);
    if (state.proposal.cardType === "chamber") return resolveInstallProposal(state.proposal.cardId, elig, implementer);
    if (state.proposal.cardType === "gate") return resolveGateProposal(elig, implementer);
  }

  function doDissolveProposal() {
    if (!state.proposal) return;
    state.proposal.status = "dissolved";
    state.proposal = null;
    state.highlightedCrew = [];
    state.highlightedMother = [];
    state.currentImplementer = null;
    advanceActivePlayer();
    saveAndRender();
  }

  function openGateProposal() {
    state.proposal = {
      cardId: currentGateId(),
      cardType: "gate",
      proposerPlayerId: activePlayerId(),
      implementerPlayerId: null,
      status: "open"
    };
  }

  function proposalEligibility(proposal) {
    if (!proposal) return { ok: false, reason: "No proposal." };
    if (proposal.cardType === "star") return travelEligibility(proposal.cardId);
    if (proposal.cardType === "chamber") return installEligibility(proposal.cardId);
    if (proposal.cardType === "gate") {
      var gate = gateEligibility();
      return {
        ok: gate.attemptOk,
        reason: gate.reason || "The Gate must be fully covered to pass.",
        motherSpent: gate.motherSpent
      };
    }
    return { ok: false, reason: "Unknown proposal." };
  }

  function proposalNeed(proposal) {
    if (!proposal) return [];
    if (proposal.cardType === "star") return effectiveStarNeed(proposal.cardId);
    if (proposal.cardType === "chamber") {
      var c = getChamber(proposal.cardId);
      return c ? c.build.slice() : [];
    }
    if (proposal.cardType === "gate") return gateNeed();
    return [];
  }

  // ============================================================
  // TRAVEL
  // ============================================================

  function travelCostFor(starId) {
    return travelCostBreakdown(starId).due;
  }

  function travelCostBreakdown(starId) {
    var s = getStar(starId);
    if (!s) return { printed: 0, due: 0, modifiers: [] };
    var printed = s.travel;
    var due = printed;
    var modifiers = [];
    var t3 = thresholdActive(s, 3);
    var t5 = thresholdActive(s, 5);
    if (t3 && t3.travelDelta) {
      due += t3.travelDelta;
      modifiers.push("3+ " + D.icons.mother.glyph + ": +" + t3.travelDelta + " Fuel");
    }
    if (t5 && t5.travelDelta) {
      due += t5.travelDelta;
      modifiers.push("5+ " + D.icons.mother.glyph + ": +" + t5.travelDelta + " Fuel");
    }
    if (state.driveCathedralActive) {
      var driveOk = !(motherUsedCount() >= 3 && due > 1);
      if (driveOk) {
        due = Math.max(0, due - 1);
        modifiers.push("Drive Cathedral: -1 Fuel");
      } else {
        modifiers.push("Drive Cathedral armed but not eligible");
      }
    }
    if (state.freeStarNext) {
      due = 0;
      modifiers.push("Free Star token: Fuel cost becomes 0");
    }
    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector && s.travel >= 2) {
      due = Math.max(0, due - 1);
      modifiers.push("Gravity Sails: -1 Fuel");
    }
    return { printed: printed, due: due, modifiers: modifiers };
  }

  function travelEligibility(starId) {
    var s = getStar(starId);
    if (!s) return { ok: false, reason: "unknown Star" };
    var cost = travelCostFor(starId);
    if (state.fuel < cost) return { ok: false, reason: "Need " + cost + " Fuel (have " + state.fuel + ")." };

    var need = effectiveStarNeed(starId);
    var rep = coverageReport(need);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Pledged icons + MOTHER cards do not cover the Need." };
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is pledged." };
    }
    var extraCrew = effectiveStarExtraCrew(starId);
    if (extraCrew > 0) {
      var iconsRequired = need.length;
      var baseline = Math.max(2, Math.ceil(iconsRequired / 2));
      var needHumans = baseline + extraCrew;
      if (humanCount() < needHumans) {
        return { ok: false, reason: "3+ " + D.icons.mother.glyph + ": also commit +" + extraCrew + " crew (need >=" + needHumans + " humans)." };
      }
    }
    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector
        && s.travel >= 2 && motherUsedCount() >= 3 && humanCount() < 2) {
      return { ok: false, reason: "Gravity Sails (3+ " + D.icons.mother.glyph + ") needs >=2 humans on the discounted Star." };
    }
    return { ok: true, cost: cost, motherSpent: Math.max(0, rep.missing.length) };
  }

  function resolveTravelProposal(starId, elig, implementer) {
    if (state.phase !== "play") return;
    if (!state.horizon || state.horizon.indexOf(starId) < 0) return;

    var motherBefore = motherUsedCount();
    var motherSpent = elig.motherSpent;
    state.fuel -= elig.cost;
    removeBoardCardsByUid(elig.fuelUids);
    state.freeStarNext = false;

    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector) {
      var s = getStar(starId);
      if (s && s.travel >= 2) {
        state.chamberFlags.gravitySailsUsedThisSector = true;
        state.chamberFlags.gravitySailsAppliedTo = starId;
      }
    }
    if (state.driveCathedralActive) {
      state.chamberFlags.driveCathedralUsedThisSector = true;
      state.driveCathedralActive = false;
    }

    spendHighlightedCrewAsTired();
    spendMotherFromHighlight(motherSpent);
    refundLiaisonIfApplicable(motherSpent, "star", motherBefore);

    var sectorKey = currentSectorKey();
    state.horizon.forEach(function (id) {
      if (id !== starId) state.discards[sectorKey].push(id);
    });
    state.horizon = null;
    state.proposal = null;

    var card = getStar(starId);
    state.log.push({ type: "star", starId: starId, motherCards: motherSpent, name: card.name, implementerPlayerId: implementer });

    state.activeStarId = starId;
    var rewards = effectiveStarReward(starId);
    applyEffectsThen(rewards, function () {
      state.activeStarId = null;
      afterStarResolved(motherSpent);
    });
  }

  function afterStarResolved(motherSpentOnStar) {
    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }

    if (hasChamber("ch-commons-ring") && !state.chamberFlags.commonsRingUsedThisSector) {
      var allowed = true;
      if (motherUsedCount() >= 3 && motherSpentOnStar > 0) allowed = false;
      if (allowed) {
        var tired = state.crew.find(function (c) { return c.awake && c.tired && !c.wounded; });
        if (!tired) tired = state.crew.find(function (c) { return c.awake && c.tired; });
        if (tired) {
          tired.tired = false;
          state.chamberFlags.commonsRingUsedThisSector = true;
        }
      }
    }

    state.starsThisSector += 1;
    advanceActivePlayer();
    if (state.starsThisSector >= 3) {
      if (!gatePassPossible()) {
        enterLoss("Gate Failed");
        return;
      }
      state.phase = "gate";
    }
    saveAndRender();
  }

  // ============================================================
  // CHAMBER INSTALL
  // ============================================================

  function installEligibility(chamberId) {
    var c = getChamber(chamberId);
    if (!c) return { ok: false, reason: "unknown Chamber" };
    if (!state.sectorRevealed) return { ok: false, reason: "Draw the sector card first." };
    if (state.chamberInstalled.length >= 3) return { ok: false, reason: "Three Chambers already fixed." };
    if (state.parts < c.parts) return { ok: false, reason: "Need " + c.parts + " Parts (have " + state.parts + ")." };
    var rep = coverageReport(c.build);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Pledged icons + MOTHER cards do not cover the Build." };
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is pledged." };
    }
    return { ok: true, cost: c.parts, motherSpent: Math.max(0, rep.missing.length) };
  }

  function resolveInstallProposal(chamberId, elig, implementer) {
    if (state.phase !== "play") return;
    if (state.chamberMarket.indexOf(chamberId) < 0) return;

    var motherBefore = motherUsedCount();
    var chamber = getChamber(chamberId);
    state.parts -= chamber.parts;
    removeBoardCardsByUid(elig.partsUids);

    spendHighlightedCrewAsTired();
    spendMotherFromHighlight(elig.motherSpent);
    refundLiaisonIfApplicable(elig.motherSpent, "chamber", motherBefore);

    state.chamberInstalled.push(chamber.id);
    moveBoardItemToBoardArea(boardUid("chamber", chamber.id), 760 + ((state.chamberInstalled.length - 1) % 2) * 245, 480 + (Math.floor((state.chamberInstalled.length - 1) / 2) * 230));
    var marketIdx = state.chamberMarket.indexOf(chamber.id);
    if (marketIdx >= 0) state.chamberMarket.splice(marketIdx, 1);
    if (state.chamberDeck.length > 0) state.chamberMarket.push(state.chamberDeck.shift());
    state.log.push({ type: "chamber", chamberId: chamberId, motherCards: elig.motherSpent, name: chamber.name, implementerPlayerId: implementer });

    state.proposal = null;
    advanceActivePlayer();
    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }
    saveAndRender();
  }

  function moveBoardItemToBoardArea(uid, x, y) {
    var item = boardItem(uid);
    if (!item) return;
    item.stackOn = null;
    item.x = BOARD_AREA_X + x;
    item.y = y;
  }

  // ============================================================
  // GATE
  // ============================================================

  function gatePassPossible() {
    var need = gateNeed();
    var availableCrew = state.crew.filter(function (c) { return c.awake && !c.tired; });
    var icons = [];
    availableCrew.forEach(function (c) { icons = icons.concat(getCrewIconContribution(c)); });
    var rep = coverageFrom(need, icons, motherUnusedCount());
    if (rep.wildsLeft < 0) return false;
    if (rep.missing.length > 0 && availableCrew.length === 0) return false;
    return true;
  }

  function gateEligibility() {
    var need = gateNeed();
    var rep = coverageReport(need);
    var attemptOk = rep.wildsLeft >= 0;
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { attemptOk: false, willPass: false, reason: "MOTHER may only help if at least one human is pledged." };
    }
    return { attemptOk: attemptOk, willPass: attemptOk, missing: rep.missing.length, motherSpent: attemptOk ? Math.max(0, rep.missing.length) : 0 };
  }

  function resolveGateProposal(elig, implementer) {
    if (state.phase !== "gate") return;
    var motherBefore = motherUsedCount();
    var motherSpent = elig.motherSpent;
    var finalContributions = isFinalSector() ? selectedHumanCountByPlayer() : null;

    spendHighlightedCrewAsTired();
    spendMotherFromHighlight(motherSpent);
    refundLiaisonIfApplicable(motherSpent, "gate", motherBefore);

    state.proposal = null;
    state.lastGateImplementerPlayerId = implementer;
    state.log.push({ type: isFinalSector() ? "finalGate" : "gate", gateId: currentGateId(), motherCards: motherSpent, implementerPlayerId: implementer });

    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }
    if (isFinalSector()) {
      enterFinalWin(implementer, finalContributions || {});
      return;
    }
    advancePastGate(implementer);
  }

  function refreshAfterGate() {
    state.crew.forEach(function (c) { if (c.awake) c.tired = false; });
    state.chamberFlags = {};
    state.driveCathedralActive = false;
    state.starsThisSector = 0;
    state.sectorRevealed = false;
    state.horizon = null;
    state.highlightedCrew = [];
    state.highlightedMother = [];
  }

  function advancePastGate(implementer) {
    refreshAfterGate();
    state.sectorIndex += 1;
    advanceActivePlayer();
    if (startGateDraft(implementer)) return;
    state.phase = "play";
    saveAndRender();
  }

  // ============================================================
  // GATE DRAFT
  // ============================================================

  function startGateDraft(implementer) {
    if (state.sectorIndex > 2) return false;
    if (state.cryoDeck.length < 1) return false;

    var revealCount = state.players.length;
    var extraIds = [];
    if (hasChamber("ch-seed-vault") && motherUsedCount() < 5) revealCount += 1;
    var ids = drawCryo(revealCount);
    if (hasChamber("ch-seed-vault") && motherUsedCount() >= 3 && motherUsedCount() < 5 && ids.length > state.players.length) {
      extraIds = ids.slice(state.players.length);
    }
    if (ids.length < 1) return false;

    state.phase = "gateDraft";
    state.gateDraft = {
      ids: ids,
      extraIds: extraIds,
      gateImplementerPlayerId: implementer,
      playerOrder: gateDraftOrder(implementer),
      pickIndex: 0
    };
    saveAndRender();
    return true;
  }

  function gateDraftOrder(implementer) {
    var players = state.players.slice();
    players.sort(function (a, b) {
      var diff = livingLoyalCrewCount(a.id) - livingLoyalCrewCount(b.id);
      if (diff !== 0) return diff;
      return clockwiseDistanceFromImplementerLeft(a.id, implementer) - clockwiseDistanceFromImplementerLeft(b.id, implementer);
    });
    return players.map(function (p) { return p.id; });
  }

  function clockwiseDistanceFromImplementerLeft(playerId, implementer) {
    if (!implementer) return state.players.findIndex(function (p) { return p.id === playerId; });
    var start = state.players.findIndex(function (p) { return p.id === implementer; });
    if (start < 0) start = 0;
    for (var i = 1; i <= state.players.length; i += 1) {
      var idx = (start + i) % state.players.length;
      if (state.players[idx].id === playerId) return i - 1;
    }
    return 99;
  }

  function doChooseGateDraft(crewId) {
    if (state.phase !== "gateDraft" || !state.gateDraft) return;
    if (state.gateDraft.ids.indexOf(crewId) < 0) return;
    var playerId = state.gateDraft.playerOrder[state.gateDraft.pickIndex] || activePlayerId();
    var wounded = state.gateDraft.extraIds.indexOf(crewId) >= 0;
    recruitCrew(crewId, playerId, false, wounded);

    state.gateDraft.ids = state.gateDraft.ids.filter(function (id) { return id !== crewId; });
    state.gateDraft.pickIndex += 1;

    if (state.gateDraft.pickIndex >= state.gateDraft.playerOrder.length || state.gateDraft.ids.length === 0) {
      state.gateDraft.ids.forEach(returnCryoToBottom);
      state.gateDraft = null;
      state.phase = "play";
      saveAndRender();
      return;
    }
    saveAndRender();
  }

  // ============================================================
  // HIGHLIGHTING / MOTHER SPENDING
  // ============================================================

  function doToggleCrew(id) {
    var crew = getCrew(id);
    if (!crew || !crew.awake) {
      showMessage(crew ? crew.name + " is in Cryo." : "");
      return;
    }
    if (state.phase !== "play" && state.phase !== "gate") return;
    if (crew.tired) {
      showMessage(crew.name + " has already worked this sector.");
      return;
    }
    var idx = state.highlightedCrew.indexOf(id);
    if (idx >= 0) state.highlightedCrew.splice(idx, 1);
    else state.highlightedCrew.push(id);
    saveAndRender();
  }

  function doToggleMother(id) {
    var card = state.motherCards.find(function (m) { return m.id === id; });
    if (!card) return;
    if (state.phase !== "play" && state.phase !== "gate") return;
    if (card.used) { showMessage("That MOTHER card has already been spent."); return; }
    var idx = state.highlightedMother.indexOf(id);
    if (idx >= 0) state.highlightedMother.splice(idx, 1);
    else state.highlightedMother.push(id);
    saveAndRender();
  }

  function doDrawMother() {
    var commitable = state.phase === "play" || state.phase === "gate";
    if (!commitable) return;
    var card = state.motherCards.find(function (m) {
      return !m.used && state.highlightedMother.indexOf(m.id) < 0;
    });
    if (!card) {
      showMessage("No MOTHER cards remain in the deck.");
      return;
    }
    state.highlightedMother.push(card.id);
    saveAndRender();
  }

  function spendHighlightedCrewAsTired() {
    var spentIds = state.highlightedCrew.slice();
    spentIds.forEach(function (id) {
      var c = getCrew(id);
      if (!c) return;
      c.tired = true;
    });
    spentIds.forEach(function (id) { removeBoardCard(boardUid("crew", id)); });
    state.highlightedCrew = [];
  }

  function spendMotherFromHighlight(n) {
    var spent = 0;
    var ids = (resolvingMotherIds || state.highlightedMother).slice();
    var spentIds = [];
    ids.forEach(function (id) {
      if (spent >= n) return;
      var card = state.motherCards.find(function (m) { return m.id === id; });
      if (card && !card.used) {
        card.used = true;
        removeBoardCard(boardUid("mother", id));
        spentIds.push(id);
        spent += 1;
      }
    });
    resolvingMotherIds = null;
    state.highlightedMother = state.highlightedMother.filter(function (id) { return spentIds.indexOf(id) < 0; });
    return spent;
  }

  function spendMotherCards(n) {
    var spent = 0;
    for (var i = 0; i < state.motherCards.length && spent < n; i += 1) {
      if (!state.motherCards[i].used) {
        state.motherCards[i].used = true;
        var hi = state.highlightedMother.indexOf(state.motherCards[i].id);
        if (hi >= 0) state.highlightedMother.splice(hi, 1);
        removeBoardCard(boardUid("mother", state.motherCards[i].id));
        spent += 1;
      }
    }
    return spent;
  }

  function refundMotherCards(n) {
    var refunded = 0;
    for (var i = state.motherCards.length - 1; i >= 0 && refunded < n; i -= 1) {
      if (state.motherCards[i].used) {
        state.motherCards[i].used = false;
        refunded += 1;
      }
    }
    return refunded;
  }

  function refundLiaisonIfApplicable(motherSpent, cardType, motherBefore) {
    if (!hasChamber("ch-mother-liaison")) return;
    if (state.chamberFlags.liaisonUsedThisSector) return;
    if (motherSpent <= 0) return;
    if (motherBefore >= 5 && cardType === "gate") return;

    if (motherBefore >= 3) {
      refundMotherCards(1);
      state.chamberFlags.liaisonUsedThisSector = true;
      return;
    }
    if (motherSpent === 1) {
      refundMotherCards(1);
      state.chamberFlags.liaisonUsedThisSector = true;
    }
  }

  // ============================================================
  // CHAMBER ACTIONS
  // ============================================================

  function doUseDriveCathedral() {
    if (state.phase !== "play" || state.proposal) return;
    if (!hasChamber("ch-drive-cathedral")) return;
    if (state.chamberFlags.driveCathedralUsedThisSector) {
      showMessage("Drive Cathedral has already shaved a route this sector.");
      return;
    }
    state.driveCathedralActive = !state.driveCathedralActive;
    saveAndRender();
  }

  function doUseArchiveNode() {
    if (state.phase !== "play" || state.proposal) return;
    if (!hasChamber("ch-archive-node")) return;
    if (state.chamberFlags.archiveNodeUsedThisSector) {
      showMessage("Archive Node has already been consulted this sector.");
      return;
    }
    var deck = currentDeck();
    if (deck.length < 1) { showMessage("Deck is empty."); return; }
    var n = motherUsedCount() >= 3 ? 1 : 2;
    n = Math.min(n, deck.length);
    var top = deck.slice(0, n);
    state.pendingScout = { ids: top.slice(), source: "archiveNode" };
    state.chamberFlags.archiveNodeUsedThisSector = true;
    saveAndRender();
  }

  // ============================================================
  // EFFECT RESOLUTION
  // ============================================================

  function applyEffectsThen(effects, done) {
    var queue = effects.slice();
    function next() {
      if (queue.length === 0) { done(); return; }
      applyEffect(queue.shift(), next);
    }
    next();
  }

  function applyEffect(effect, cb) {
    var t = effect.type;
    var n = effect.amount || 1;

    if (t === "hull") {
      var delta = effect.amount;
      if (delta < 0) {
        if (hasChamber("ch-bulkhead-garden") && !state.chamberFlags.bulkheadUsedThisSector) {
          var allowed = motherUsedCount() < 3 || state.fuel >= 1;
          if (allowed) {
            delta = Math.min(0, delta + 1);
            state.chamberFlags.bulkheadUsedThisSector = true;
          }
        }
      }
      state.hull = Math.max(0, state.hull + delta);
      if (state.hull <= 0) { enterLoss("Hull reached 0"); return; }
      cb();
      return;
    }
    if (t === "fuel") {
      state.fuel = Math.max(0, state.fuel + effect.amount);
      cb();
      return;
    }
    if (t === "parts") {
      state.parts = Math.max(0, state.parts + effect.amount);
      cb();
      return;
    }
    if (t === "wake") {
      beginWakeChoice(n, cb);
      return;
    }
    if (t === "heal") {
      for (var j = 0; j < n; j += 1) {
        var w = state.crew.find(function (c) { return c.awake && c.wounded; });
        if (!w) break;
        w.wounded = false;
      }
      cb();
      return;
    }
    if (t === "wound") {
      for (var k = 0; k < n; k += 1) {
        var preventThis = false;
        if (hasChamber("ch-medical-bay") && !state.chamberFlags.medicalBayUsedThisSector) {
          var preventAllowed = !(motherUsedCount() >= 5);
          if (preventAllowed) preventThis = true;
        }
        var target = state.crew.find(function (c) { return c.awake && !c.wounded; });
        if (!target) break;
        if (preventThis) {
          state.chamberFlags.medicalBayUsedThisSector = true;
          if (motherUsedCount() >= 3) target.tired = true;
          continue;
        }
        target.wounded = true;
      }
      cb();
      return;
    }
    if (t === "freeStar") {
      state.freeStarNext = true;
      cb();
      return;
    }
    if (t === "scout") {
      var deck = currentDeck();
      var revealCount = n;
      if (state.activeStarId) revealCount = effectiveStarScout(state.activeStarId);
      var top = deck.slice(0, revealCount);
      if (top.length === 0) { cb(); return; }
      state.pendingScout = { ids: top.slice(), source: "starReward" };
      scoutContinuation = cb;
      saveAndRender();
      return;
    }

    cb();
  }

  function beginWakeChoice(count, cb) {
    if (count <= 0 || state.cryoDeck.length < 1) { cb(); return; }
    state.pendingWake = {
      remaining: count,
      choices: [],
      implementerPlayerId: state.currentImplementer || activePlayerId()
    };
    wakeContinuation = cb;
    prepareNextWakeChoice();
  }

  function prepareNextWakeChoice() {
    if (!state.pendingWake) return;
    if (state.pendingWake.remaining <= 0 || state.cryoDeck.length < 1) return finishWakeChoice();
    state.pendingWake.choices = drawCryo(Math.min(2, state.cryoDeck.length));
    if (state.pendingWake.choices.length < 1) return finishWakeChoice();
    saveAndRender();
  }

  function doChooseWake(crewId) {
    if (!state.pendingWake) return;
    if (state.pendingWake.choices.indexOf(crewId) < 0) return;
    var playerId = state.pendingWake.implementerPlayerId;
    recruitCrew(crewId, playerId, true, false);
    state.pendingWake.choices.forEach(function (id) {
      if (id !== crewId) returnCryoToBottom(id);
    });
    state.pendingWake.remaining -= 1;
    prepareNextWakeChoice();
  }

  function finishWakeChoice() {
    var cb = wakeContinuation;
    state.pendingWake = null;
    wakeContinuation = null;
    saveState();
    if (cb) cb();
    else render();
  }

  function drawCryo(n) {
    var ids = [];
    while (ids.length < n && state.cryoDeck.length > 0) {
      var id = state.cryoDeck.shift();
      var crew = getCrew(id);
      if (crew && !crew.awake) ids.push(id);
    }
    return ids;
  }

  function returnCryoToBottom(id) {
    var crew = getCrew(id);
    if (!crew || crew.awake) return;
    crew.ownerPlayerId = null;
    crew.tired = false;
    if (state.cryoDeck.indexOf(id) < 0) state.cryoDeck.push(id);
  }

  function recruitCrew(id, playerId, tired, wounded) {
    var crew = getCrew(id);
    if (!crew) return;
    var idx = state.cryoDeck.indexOf(id);
    if (idx >= 0) state.cryoDeck.splice(idx, 1);
    crew.awake = true;
    crew.ownerPlayerId = playerId;
    crew.tired = !!tired;
    crew.wounded = !!wounded;
  }

  function doChooseScout(starId) {
    if (!state.pendingScout) return;
    var deck = currentDeck();
    var ids = state.pendingScout.ids.slice();
    if (ids.indexOf(starId) < 0) return;
    var source = state.pendingScout.source;

    for (var i = 0; i < ids.length; i += 1) deck.shift();
    var others = ids.filter(function (id) { return id !== starId; });
    deck.unshift(starId);

    if (source === "archiveNode") {
      others.forEach(function (id) { deck.push(id); });
    } else {
      others.forEach(function (id) { state.discards[currentSectorKey()].push(id); });
    }

    state.pendingScout = null;
    saveState();
    if (scoutContinuation) {
      var cb = scoutContinuation;
      scoutContinuation = null;
      cb();
    } else {
      render();
    }
  }

  // ============================================================
  // FINAL / LOSS
  // ============================================================

  function enterLoss(reason) {
    state.phase = "loss";
    state.lossReason = reason;
    state.proposal = null;
    saveAndRender();
  }

  function enterFinalWin(implementer, contributionCounts) {
    refreshAfterGate();
    state.finalGatePassed = true;
    state.finalGateContributions = contributionCounts || {};
    state.lastGateImplementerPlayerId = implementer;
    var winners = determineWinners(implementer);
    state.winnerPlayerIds = winners;
    state.winnerPlayerId = winners.length === 1 ? winners[0] : null;
    state.phase = "finished";
    saveAndRender();
  }

  function livingLoyalCrewCount(playerId) {
    return state.crew.filter(function (c) { return c.awake && c.ownerPlayerId === playerId; }).length;
  }

  function healthyLoyalCrewCount(playerId) {
    return state.crew.filter(function (c) { return c.awake && c.ownerPlayerId === playerId && !c.wounded; }).length;
  }

  function finalGateContributionCount(playerId) {
    return state.finalGateContributions[playerId] || 0;
  }

  function determineWinners(implementer) {
    var candidates = state.players.map(function (p) { return p.id; });
    candidates = filterBest(candidates, livingLoyalCrewCount);
    candidates = filterBest(candidates, healthyLoyalCrewCount);
    candidates = filterBest(candidates, finalGateContributionCount);
    if (candidates.length > 1 && implementer && candidates.indexOf(implementer) >= 0) candidates = [implementer];
    return candidates;
  }

  function filterBest(ids, scoreFn) {
    var best = -Infinity;
    ids.forEach(function (id) { best = Math.max(best, scoreFn(id)); });
    return ids.filter(function (id) { return scoreFn(id) === best; });
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) {}
  }

  function exposeState() {
    if (typeof window !== "undefined") window.STARPATH = { state: state, D: D };
  }

  function saveAndRender() {
    saveState();
    exposeState();
    render();
  }

  // ============================================================
  // RENDERING
  // ============================================================

  function render() {
    ensureBoardState();
    renderTopbar();
    renderMessage();
    renderCrewRow();
    renderMain();
    renderScout();
    renderWake();
    renderGateDraft();
    renderResult();
  }

  function renderMessage() {
    var el = document.getElementById("message");
    if (el && state.message) el.textContent = state.message;
  }

  function renderTopbar() {
    var el = document.getElementById("phaseSummary");
    if (!el) return;
    el.textContent = topbarLabel();
  }

  function topbarLabel() {
    var p = activePlayer();
    var prefix = p ? p.name + " turn - " : "";
    if (state.phase === "play") {
      if (!state.sectorRevealed) return prefix + "draw the next sector card";
      return prefix + "Star " + (state.starsThisSector + 1) + " of 3";
    }
    if (state.phase === "gate") return prefix + "Sector " + (state.sectorIndex + 1) + (isFinalSector() ? " Final Gate" : " Gate");
    if (state.phase === "gateDraft") return "Gate Draft";
    if (state.phase === "finished") return "Ship survived";
    if (state.phase === "loss") return "Ship failed";
    return "";
  }

  function renderCrewRow() {
    var el = document.getElementById("crewRow");
    if (!el) return;
    var commitable = state.phase === "play" || state.phase === "gate";
    var activeCrew = state.crew.filter(function (c) { return c.awake && !c.tired && !boardItemFor("crew", c.id); });
    var tiredCrew = state.crew.filter(function (c) { return c.awake && c.tired; });
    var html = '<div class="crew-row-title">Ready crew - click to add to the common board</div><div class="crew-row-body"><div class="crew-ready-row">';
    activeCrew.forEach(function (c) {
      var owner = getPlayer(c.ownerPlayerId);
      var cls = "crew-tile";
      if (c.tired) cls += " state-tired";
      else cls += " state-ready";
      if (c.wounded) cls += " state-wounded";
      var canSelect = commitable && !c.tired;
      var iconRowHtml = c.icons.map(function (icon, idx) {
        var muted = c.wounded && idx > 0;
        return iconBadge(icon, muted ? "icon-badge muted" : "icon-badge");
      }).join("");
      var subState = c.tired ? "Tired" : c.wounded ? "Wounded" : "Ready";
      html += '<button type="button" class="' + cls + '" ' +
        (canSelect ? 'data-action="addCrewToBoard" data-crew-id="' + escapeAttr(c.id) + '"' : "disabled") +
        '>' +
        '<span class="crew-card-glyph" aria-hidden="true">' + D.icons.person.glyph + '</span>' +
        '<span class="crew-name">' + escapeHtml(c.name) + '</span>' +
        '<span class="crew-owner">' + escapeHtml(owner ? owner.name : "Unowned") + '</span>' +
        '<span class="crew-icons">' + iconRowHtml + '</span>' +
        '<span class="crew-state">' + subState + ' - add to board</span>' +
        '</button>';
    });
    if (activeCrew.length === 0) html += '<p class="crew-row-empty">All Ready crew are on the board or already tired.</p>';
    html += '</div>';
    if (tiredCrew.length > 0) {
      html += '<div class="crew-tired-pile" aria-label="Tired crew pile">' +
        '<span class="crew-pile-label">Tired</span>' +
        tiredCrew.map(renderTiredCrewPileCard).join("") +
      '</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function renderTiredCrewPileCard(c, idx) {
    var cls = "crew-tile state-tired";
    if (c.wounded) cls += " state-wounded";
    var iconRowHtml = c.icons.map(function (icon, iconIdx) {
      var muted = c.wounded && iconIdx > 0;
      return iconBadge(icon, muted ? "icon-badge muted" : "icon-badge");
    }).join("");
    return '<article class="' + cls + ' pile-card" style="--pile-index:' + idx + '">' +
      '<span class="crew-card-glyph" aria-hidden="true">' + D.icons.person.glyph + '</span>' +
      '<span class="crew-name">' + escapeHtml(c.name) + '</span>' +
      '<span class="crew-icons">' + iconRowHtml + '</span>' +
      '<span class="crew-state">Tired</span>' +
    '</article>';
  }

  function renderMain() {
    var el = document.getElementById("mainArea");
    if (!el) return;
    if (state.phase === "play" || state.phase === "gate") return el.innerHTML = renderPlay();
    if (state.phase === "gateDraft") return el.innerHTML = renderGateDraftMain();
    if (state.phase === "finished" || state.phase === "loss") return el.innerHTML = "";
  }

  function renderPlay() {
    var deckLeft = currentDeck().length;
    var rerouteHtml = "";
    if (state.horizon && !horizonAffordableExists() && !state.proposal) {
      var canReroute = motherUnusedCount() > 0;
      rerouteHtml = '<div class="reroute-row"><p class="reroute-text">No Horizon Star is reachable on current Fuel.</p>' +
        '<button class="' + (canReroute ? 'primary' : 'secondary') + '" data-action="reroute" ' + (canReroute ? '' : 'disabled') + '>' +
        (canReroute ? 'Reroute (use 1 MOTHER card, redraw)' : 'Reroute - no MOTHER cards left') + '</button></div>';
    }

    return [
      '<section class="board-panel free-board">',
      rerouteHtml,
      '<div id="boardPlayArea" class="board-play-area">',
        '<aside class="board-side-rail" aria-label="Decks and damaged Chambers">',
          '<div class="board-rail-decks">' + renderSectorDeck() + renderMotherDeck() + renderCryoDeck() + renderChamberDeck() + (state.sectorRevealed ? renderHorizonDeck(deckLeft) : '<div class="sector-empty">Sector not drawn</div>') + '</div>',
          '<h2 class="board-rail-title">Damaged Chambers</h2>',
        '</aside>',
        '<div id="boardSurface" class="board-surface" aria-label="Common card board"></div>',
        renderBoardCards(),
      '</div>',
      '</section>'
    ].join("");
  }

  function renderBoardCards() {
    ensureBoardState();
    return state.board.cards.slice().sort(function (a, b) { return a.z - b.z; }).map(renderBoardItem).join("");
  }

  function renderBoardItem(item) {
    var content = renderBoardItemContent(item);
    if (!content) return "";
    var cls = "board-card-shell board-type-" + item.type;
    if (item.stackOn) cls += " is-stacked";
    if (boardActionKind(item)) cls += " is-action-target";
    var left = typeof item.x === "number" ? item.x : 0;
    var top = typeof item.y === "number" ? item.y : 0;
    return '<div class="' + cls + '" data-board-uid="' + escapeAttr(item.uid) + '" style="left:' + left + 'px;top:' + top + 'px;z-index:' + item.z + '">' +
      content +
      renderBoardActionPanel(item) +
      '</div>';
  }

  function renderBoardItemContent(item) {
    if (item.type === "ship") return renderShipResourceCard(item);
    if (item.type === "star") return renderStarCard(item.ref, "board");
    if (item.type === "gate") return renderGateCard(item.ref, "board");
    if (item.type === "chamber") return renderChamberCard(item.ref, state.chamberInstalled.indexOf(item.ref) >= 0 ? "installed" : "board");
    if (item.type === "crew") return renderBoardCrewCard(item);
    if (item.type === "mother") return renderBoardMotherCard(item);
    if (item.type === "token" && item.ref === "freeStar") return renderFreeStarTokenCard();
    return "";
  }

  function renderBoardActionPanel(item) {
    if (item.type === "chamber" && state.chamberInstalled.indexOf(item.ref) >= 0) return renderInstalledChamberControls(item.ref);
    var info = boardActionInfo(item);
    if (!info) return "";
    var stack = boardCommitment(item.uid);
    var dismiss = info.kind === "chamber" && stack.items.length > 0
      ? '<button class="secondary" data-action="dismissBoardStack" data-board-uid="' + escapeAttr(item.uid) + '">Dismiss</button>'
      : "";
    if (info.eligibility.ok) {
      return '<div class="board-action-panel ready"><button class="primary" data-action="takeBoardAction" data-board-uid="' + escapeAttr(item.uid) + '">' + escapeHtml(info.label) + '</button>' + dismiss + '</div>';
    }
    if (dismiss) return '<div class="board-action-panel pending">' + dismiss + '</div>';
    return "";
  }

  function renderInstalledChamberControls(id) {
    var controls = '<strong>Installed</strong>';
    if (state.phase === "play" && id === "ch-drive-cathedral" && !state.chamberFlags.driveCathedralUsedThisSector && !state.proposal) {
      controls += '<button class="secondary" data-action="useDriveCathedral">' + (state.driveCathedralActive ? 'Drive Armed' : 'Arm Drive') + '</button>';
    }
    if (state.phase === "play" && id === "ch-archive-node" && !state.chamberFlags.archiveNodeUsedThisSector && !state.proposal) {
      controls += '<button class="secondary" data-action="useArchiveNode">Use Archive</button>';
    }
    return '<div class="board-action-panel installed">' + controls + '</div>';
  }

  function renderShipResourceCard(item) {
    var resource = shipResource(item);
    var label = resource === "mother" ? "MOTHER Used" : resource.charAt(0).toUpperCase() + resource.slice(1);
    var iconId = resource === "mother" ? "mother" : resource;
    return '<article class="card resource-card resource-' + escapeAttr(resource) + '">' +
      '<span class="card-eyebrow">Ship</span>' +
      '<h3 class="card-title">' + escapeHtml(label) + '</h3>' +
      '<div class="resource-symbol">' + iconBadge(iconId) + '</div>' +
      '</article>';
  }

  function renderBoardCrewCard(item) {
    var c = getCrew(item.ref);
    if (!c) return "";
    var owner = getPlayer(c.ownerPlayerId);
    var cls = "crew-tile board-crew-card state-ready";
    if (c.wounded) cls += " state-wounded";
    var iconRowHtml = c.icons.map(function (icon, idx) {
      var muted = c.wounded && idx > 0;
      return iconBadge(icon, muted ? "icon-badge muted" : "icon-badge");
    }).join("");
    return '<article class="' + cls + '">' +
      '<span class="crew-card-glyph" aria-hidden="true">' + D.icons.person.glyph + '</span>' +
      '<span class="crew-name">' + escapeHtml(c.name) + '</span>' +
      '<span class="crew-owner">' + escapeHtml(owner ? owner.name : "Unowned") + '</span>' +
      '<span class="crew-icons">' + iconRowHtml + '</span>' +
      '<span class="crew-state">' + (c.wounded ? 'Wounded' : 'Ready') + '</span>' +
      '<button class="board-mini-button" data-action="returnBoardCard" data-board-uid="' + escapeAttr(item.uid) + '">Return</button>' +
      '</article>';
  }

  function renderBoardMotherCard(item) {
    return '<article class="crew-tile board-crew-card mother-hand-card">' +
      '<span class="crew-name">MOTHER</span>' +
      '<span class="crew-icons"><span class="mother-wild-icon">' + D.icons.mother.glyph + '</span></span>' +
      '<span class="crew-state">Wild</span>' +
      '<button class="board-mini-button" data-action="returnBoardCard" data-board-uid="' + escapeAttr(item.uid) + '">Return</button>' +
      '</article>';
  }

  function renderFreeStarTokenCard() {
    return '<article class="card resource-card token-card">' +
      '<span class="card-eyebrow">Active Token</span>' +
      '<h3 class="card-title">Free Star</h3>' +
      '<div class="resource-pips">' + iconBadge("free") + '</div>' +
      '<small>Next Star costs 0 Fuel while this card is on the board.</small>' +
      '</article>';
  }

  function renderSectorDeck() {
    var remaining = Math.max(0, 3 - state.sectorIndex - (state.sectorRevealed ? 1 : 0));
    if (state.sectorRevealed || state.proposal) {
      return '<div class="deck-card sector-deck drawn" aria-label="Sector card">' +
        '<span class="deck-count">' + remaining + '</span>' +
        '<span class="deck-label">SECTOR</span>' +
      '</div>';
    }
    return '<button type="button" class="deck-card sector-deck" data-action="drawSector">' +
      '<span class="deck-count">' + remaining + '</span>' +
      '<span class="deck-label">SECTOR</span>' +
    '</button>';
  }

  function renderMotherDeck() {
    var commitable = state.phase === "play" || state.phase === "gate";
    var count = motherDeckCount();
    var disabled = !commitable || count < 1;
    var attrs = disabled ? ' disabled' : ' data-action="drawMother"';
    return '<button type="button" class="deck-card mother-deck"' + attrs + '>' +
      '<span class="deck-count">' + count + '</span>' +
      '<span class="deck-glyph mother">' + D.icons.mother.glyph + '</span>' +
      '<span class="deck-label">MOTHER</span>' +
    '</button>';
  }

  function renderCryoDeck() {
    return '<div class="deck-card cryo-deck" aria-label="Cryo deck">' +
      '<span class="deck-count">' + state.cryoDeck.length + '</span>' +
      '<span class="deck-glyph cryo">' + D.icons.person.glyph + '</span>' +
      '<span class="deck-label">CRYO</span>' +
    '</div>';
  }

  function renderChamberDeck() {
    var count = state.chamberDeck ? state.chamberDeck.length : 0;
    return '<div class="deck-card chamber-deck" aria-label="Chamber deck" title="Damaged Chambers waiting to surface">' +
      '<span class="deck-count">' + count + '</span>' +
      '<span class="deck-glyph chamber">⌂</span>' +
      '<span class="deck-label">CHAMBER</span>' +
    '</div>';
  }

  function renderHorizonDeck(deckLeft) {
    var disabled = !state.sectorRevealed || state.horizon || deckLeft < 1 || state.proposal;
    var attrs = disabled ? ' disabled' : ' data-action="drawHorizon"';
    return '<button type="button" class="deck-card horizon-deck"' + attrs + '>' +
      '<span class="deck-count">' + deckLeft + '</span>' +
      '<span class="deck-label">HORIZON</span>' +
    '</button>';
  }

  function renderGateDraftMain() {
    return '<section class="panel"><h2 class="panel-title">Gate Draft</h2><p class="panel-text">Choose a Cryo crew from the draft overlay to continue to the next sector.</p></section>';
  }

  // ----------- Card renderers ----------

  function renderStarCard(id, mode) {
    var s = getStar(id);
    if (!s) return "";
    var modeClass = "card star-card mode-" + (mode || "default");

    var need = effectiveStarNeed(id);
    var t3 = s.mother3;
    var t5 = s.mother5;
    var t3Active = thresholdActive(s, 3);
    var t5Active = thresholdActive(s, 5);
    var rewardEffects = effectiveStarReward(id);
    var thresholdLines = "";
    if (t3) thresholdLines += '<div class="card-mother-line ' + (t3Active ? "active" : "dim") + '">' +
      thresholdHeader(3) + thresholdLineLabel(t3) + '</div>';
    if (t5) thresholdLines += '<div class="card-mother-line ' + (t5Active ? "active" : "dim") + '">' +
      thresholdHeader(5) + thresholdLineLabel(t5) + '</div>';

    return [
      '<article class="' + modeClass + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">Star - ' + escapeHtml(D.distanceLabel(s.travel)) + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(s.name) + '</h3>',
      '<div class="star-card-main">',
        '<div class="card-need"><span class="card-section">Need</span>' + needRow(starFuelNeed(id, mode), need) + '</div>',
        '<div class="card-reward"><span class="card-section">Reward</span>' + effectsLabel(rewardEffects) + '</div>',
      '</div>',
      '<div class="star-card-effects">' + thresholdLines + '</div>',
      '</article>'
    ].join("");
  }

  function thresholdLineLabel(t) {
    var parts = [];
    if (t.extraCrew) parts.push("Also commit +" + t.extraCrew + " crew (humans only).");
    if (t.travelDelta) parts.push("Travel +" + t.travelDelta + " Fuel.");
    if (t.scoutDelta) parts.push((t.scoutDelta > 0 ? "Scout +" : "Scout ") + t.scoutDelta + " Stars.");
    if (t.addNeed && t.addNeed.length) {
      parts.push("Need adds " + t.addNeed.map(function (i) { return D.icons[i] ? D.icons[i].label : i; }).join(" + ") + ".");
    }
    if (t.rewardOverride) parts.push("Reward becomes: " + t.rewardOverride.map(effectInline).join(", ") + ".");
    return '<span class="threshold-text">' + parts.map(escapeHtml).join(" ") + '</span>';
  }

  function thresholdHeader(n) {
    return '<span class="card-section threshold-icon-label">' + n + '+ ' + iconBadge("mother") + '</span>';
  }

  function effectInline(e) {
    if (e.type === "hull") return "Hull " + signed(e.amount);
    if (e.type === "fuel") return "Fuel " + signed(e.amount);
    if (e.type === "parts") return "Parts " + signed(e.amount);
    if (e.type === "wake") return "Wake " + e.amount;
    if (e.type === "heal") return "Heal " + e.amount;
    if (e.type === "wound") return "Wound " + e.amount;
    if (e.type === "scout") return "Scout " + (e.amount || 3);
    if (e.type === "freeStar") return "Next Star Free";
    return "?";
  }

  function renderGateCard(id, mode) {
    var g = getGate(id);
    if (!g) return "";
    var modeClass = "card gate-card mode-" + (mode || "default");
    var hostile = motherUsedCount() >= 5;
    var hostileNote = hostile && g.need[0]
      ? '<div class="card-hostile">5+ ' + D.icons.mother.glyph + ' - Need +1 ' + (D.icons[g.need[0]] ? D.icons[g.need[0]].label : "icon") + '</div>'
      : "";
    var fullNeed = g.need.concat(hostile && g.need[0] ? [g.need[0]] : []);
    var label = isFinalSector() ? "Final Gate" : "Gate";
    return [
      '<article class="' + modeClass + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">' + label + ' - Sector ' + (state.sectorIndex + 1) + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(g.name) + '</h3>',
      '<div class="card-need"><span class="card-section">Need</span>' + iconRow(fullNeed) + '</div>',
      hostileNote,
      '</article>'
    ].join("");
  }

  function renderChamberCard(id, mode) {
    var c = getChamber(id);
    if (!c) return "";
    var modeClass = "card chamber-card mode-" + (mode || "default");
    var thresholdLines = "";
    if (c.mother3) thresholdLines += '<div class="card-mother-line ' + (motherUsedCount() >= 3 ? "active" : "dim") + '">' +
      thresholdHeader(3) + '<span class="threshold-text">' + escapeHtml(c.mother3) + '</span></div>';
    if (c.mother5) thresholdLines += '<div class="card-mother-line ' + (motherUsedCount() >= 5 ? "active" : "dim") + '">' +
      thresholdHeader(5) + '<span class="threshold-text">' + escapeHtml(c.mother5) + '</span></div>';
    return [
      '<article class="' + modeClass + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">Chamber</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(c.name) + '</h3>',
      '<div class="card-need"><span class="card-section">Build</span>' + chamberBuildRow(c.parts, c.build) + '</div>',
      '<div class="card-reward"><span class="card-section">Effect</span><span class="threshold-text">' + escapeHtml(c.effect) + '</span></div>',
      thresholdLines,
      '</article>'
    ].join("");
  }

  // ----------- Icon / effect helpers ----------

  function iconBadge(iconId, klass) {
    var icon = D.icons[iconId];
    if (!icon) return "";
    return '<span class="' + (klass || "icon-badge") +
      '" style="--icon-color:' + icon.color + '" title="' + icon.label + '">' +
      icon.glyph + '</span>';
  }

  function iconRow(arr) {
    return '<div class="icon-row">' + arr.map(function (id) { return iconBadge(id); }).join("") + '</div>';
  }

  function starFuelNeed(starId, mode) {
    var s = getStar(starId);
    return s ? s.travel : 0;
  }

  function fuelIcons(cost) {
    var html = "";
    for (var i = 0; i < cost; i += 1) html += iconBadge("fuel");
    return html;
  }

  function needRow(fuelCost, needIcons) {
    var html = '<div class="icon-row">';
    html += fuelIcons(fuelCost || 0);
    (needIcons || []).forEach(function (id) { html += iconBadge(id); });
    html += '</div>';
    return html;
  }

  function chamberBuildRow(partsCost, buildIcons) {
    var html = '<div class="icon-row">';
    for (var i = 0; i < (partsCost || 0); i += 1) html += iconBadge("parts");
    (buildIcons || []).forEach(function (id) { html += iconBadge(id); });
    html += '</div>';
    return html;
  }

  function effectsLabel(effects) {
    if (!effects || effects.length === 0) return '<span class="effect-none">-</span>';
    return '<div class="effect-row">' + effects.map(effectLabel).join("") + '</div>';
  }

  function effectIconCluster(iconId, amount, label) {
    var n = Math.abs(amount || 0);
    var sign = amount < 0 ? '<span class="eff-sign">-</span>' : '';
    var icons = "";
    for (var i = 0; i < n; i += 1) icons += iconBadge(iconId);
    if (n === 0) icons = iconBadge(iconId);
    return '<span class="eff eff-' + iconId + '" title="' + escapeAttr(label) + '">' + sign + icons + '</span>';
  }

  function effectLabel(e) {
    if (e.type === "hull")  return effectIconCluster("hull",  e.amount, "Hull " + signed(e.amount));
    if (e.type === "fuel")  return effectIconCluster("fuel",  e.amount, "Fuel " + signed(e.amount));
    if (e.type === "parts") return effectIconCluster("parts", e.amount, "Parts " + signed(e.amount));
    if (e.type === "wake")  return effectIconCluster("person", e.amount, "Wake " + e.amount);
    if (e.type === "heal")  return effectIconCluster("heal",  e.amount, "Heal " + e.amount);
    if (e.type === "wound") return effectIconCluster("wound", e.amount, "Wound " + e.amount);
    if (e.type === "scout") return effectIconCluster("scout", e.amount || 3, "Scout " + (e.amount || 3));
    if (e.type === "freeStar") return '<span class="eff eff-free" title="Next Star is Free">' + iconBadge("free") + '</span>';
    return '<span class="eff">?</span>';
  }

  function signed(n) { return (n > 0 ? "+" : "") + n; }

  // ----------- Modals ----------

  function renderScout() {
    var panel = document.getElementById("scoutPanel");
    if (!panel) return;
    if (!state.pendingScout) { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    var source = state.pendingScout.source;
    var heading = source === "archiveNode" ? "Archive Node - reorder the deck" : "Scout the next Stars";
    var subline = source === "archiveNode"
      ? "Choose which Star sits on top. The others go to the bottom of the deck."
      : "Keep one on top of the deck. The others are discarded.";
    panel.innerHTML =
      '<div class="overlay-card">' +
      '<header class="overlay-head"><h2>' + heading + '</h2><p>' + subline + '</p></header>' +
      '<div class="scout-row">' +
      state.pendingScout.ids.map(function (id) {
        return '<div class="scout-pick">' +
          renderStarCard(id, "horizon") +
          '<button class="primary" data-action="chooseScout" data-star-id="' + escapeAttr(id) + '">Keep this on top</button>' +
          '</div>';
      }).join("") +
      '</div></div>';
  }

  function renderWake() {
    var panel = document.getElementById("wakePanel");
    if (!panel) return;
    if (!state.pendingWake) { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    var player = getPlayer(state.pendingWake.implementerPlayerId);
    panel.innerHTML =
      '<div class="overlay-card choice-card">' +
      '<header class="overlay-head"><div><p class="eyebrow">Wake reward</p><h2>Recruit loyal crew</h2></div></header>' +
      '<p class="panel-text">' + escapeHtml(player ? player.name : "The Implementer") + ' chooses 1 revealed Cryo crew. The recruit enters Tired.</p>' +
      '<div class="choice-row">' + state.pendingWake.choices.map(function (id) {
        return '<div class="choice-pick">' + renderCrewCardLarge(id, "Cryo") +
          '<button class="primary" data-action="chooseWake" data-crew-id="' + escapeAttr(id) + '">Recruit</button></div>';
      }).join("") + '</div>' +
      '</div>';
  }

  function renderGateDraft() {
    var panel = document.getElementById("gateDraftPanel");
    if (!panel) return;
    if (state.phase !== "gateDraft" || !state.gateDraft) { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    var playerId = state.gateDraft.playerOrder[state.gateDraft.pickIndex] || activePlayerId();
    var player = getPlayer(playerId);
    panel.innerHTML =
      '<div class="overlay-card choice-card">' +
      '<header class="overlay-head"><div><p class="eyebrow">Gate Draft</p><h2>' + escapeHtml(player ? player.name : "Player") + ' drafts from Cryo</h2></div></header>' +
      '<p class="panel-text">Drafted crew enter Ready for the next sector.' + (state.gateDraft.extraIds.length ? ' Seed Vault extra picks enter Wounded.' : '') + '</p>' +
      '<div class="choice-row">' + state.gateDraft.ids.map(function (id) {
        var extra = state.gateDraft.extraIds.indexOf(id) >= 0;
        return '<div class="choice-pick">' + renderCrewCardLarge(id, extra ? "Seed Vault - Wounded" : "Cryo") +
          '<button class="primary" data-action="chooseGateDraft" data-crew-id="' + escapeAttr(id) + '">Draft</button></div>';
      }).join("") + '</div>' +
      '</div>';
  }

  function renderCrewCardLarge(id, tag) {
    var c = getCrew(id);
    if (!c) return "";
    return '<article class="crew-large-card">' +
      '<span class="card-eyebrow">' + escapeHtml(tag || "Crew") + '</span>' +
      '<h3 class="card-title">' + escapeHtml(c.name) + '</h3>' +
      '<div class="crew-icons">' + c.icons.map(function (icon) { return iconBadge(icon); }).join("") + '</div>' +
    '</article>';
  }

  function renderResult() {
    var panel = document.getElementById("resultPanel");
    if (!panel) return;
    if (state.phase !== "finished" && state.phase !== "loss") { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;

    var title;
    var body;
    if (state.phase === "loss") {
      title = "The Ship Failed";
      body = failureText(state.lossReason);
    } else {
      title = "Ship Survived";
      body = winnerText();
    }

    panel.innerHTML =
      '<div class="overlay-card result-card">' +
      '<header class="overlay-head"><h2>' + escapeHtml(title) + '</h2></header>' +
      '<p class="result-body">' + escapeHtml(body) + '</p>' +
      '<div class="result-meta">' +
        '<div class="result-meta-row"><span>MOTHER cards used</span><strong>' + motherUsedCount() + ' / ' + state.motherCards.length + '</strong></div>' +
        '<div class="result-meta-row"><span>Hull at end</span><strong>' + state.hull + '</strong></div>' +
        '<div class="result-meta-row"><span>Fuel at end</span><strong>' + state.fuel + '</strong></div>' +
        '<div class="result-meta-row"><span>Parts at end</span><strong>' + state.parts + '</strong></div>' +
        '<div class="result-meta-row"><span>Chambers fixed</span><strong>' + state.chamberInstalled.length + '</strong></div>' +
      '</div>' +
      renderFinalStandings() +
      '<div class="actions"><button class="primary" data-action="newGame">Begin a new voyage</button></div>' +
      '</div>';
  }

  function failureText(reason) {
    if (reason === "MOTHER Takes the Wheel") return "A seventh MOTHER card would be needed. The ship continues, but no human player can claim the voyage.";
    if (reason === "Stranded in the Reach") return "No reachable Stars and no MOTHER card remains for a reroute.";
    if (reason === "Gate Failed") return "The active Gate cannot be covered with the crew and MOTHER cards still available.";
    if (reason === "Hull reached 0") return "Hull reached 0. The ship cannot survive the route.";
    return reason || "The ship cannot continue.";
  }

  function winnerText() {
    if (!state.winnerPlayerIds || state.winnerPlayerIds.length < 1) return "The ship survived. No winner could be determined.";
    if (state.winnerPlayerIds.length === 1) {
      var player = getPlayer(state.winnerPlayerIds[0]);
      return (player ? player.name : "The winner") + " wins with the most living loyal crew.";
    }
    return "Shared victory: " + state.winnerPlayerIds.map(function (id) {
      var p = getPlayer(id);
      return p ? p.name : id;
    }).join(", ") + ".";
  }

  function renderFinalStandings() {
    if (state.phase !== "finished") return "";
    return '<div class="standings">' + state.players.map(function (p) {
      var winner = state.winnerPlayerIds.indexOf(p.id) >= 0;
      var implemented = state.lastGateImplementerPlayerId === p.id;
      return '<div class="standing-row' + (winner ? ' winner' : '') + '" style="--player-color:' + escapeAttr(p.color || "#2c4259") + '">' +
        '<strong>' + escapeHtml(p.name) + (winner ? ' - Winner' : '') + '</strong>' +
        '<span>Living loyal crew: ' + livingLoyalCrewCount(p.id) + '</span>' +
        '<span>Healthy loyal crew: ' + healthyLoyalCrewCount(p.id) + '</span>' +
        '<span>Final Gate crew: ' + finalGateContributionCount(p.id) + '</span>' +
        '<span>' + (implemented ? 'Implemented Final Gate' : 'Did not implement Final Gate') + '</span>' +
      '</div>';
    }).join("") + '</div>';
  }

  function toggleManual() {
    var p = document.getElementById("manualPanel");
    if (!p) return;
    p.hidden = !p.hidden;
  }

  function closeOverlays() {
    var manual = document.getElementById("manualPanel");
    if (manual && !manual.hidden) { manual.hidden = true; return; }
  }

  // ============================================================
  // MESSAGE
  // ============================================================

  var messageTimer = null;
  function showMessage(text) {
    state.message = text;
    var el = document.getElementById("message");
    if (!el) return;
    el.textContent = text;
    window.clearTimeout(messageTimer);
    messageTimer = window.setTimeout(function () {
      state.message = "";
      el.textContent = "";
    }, 4500);
  }

  // ============================================================
  // ESCAPING
  // ============================================================

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeAttr(value) { return escapeHtml(value); }
}());
