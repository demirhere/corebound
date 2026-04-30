/* COREBOUND: Starpath - rules engine and renderer (v2 click-to-act). */

(function () {
  "use strict";

  var D = window.COREBOUND_STARPATH_DATA;
  var STORAGE_KEY = "corebound.starpath.v3";

  if (!D) return;

  var state;
  var scoutContinuation = null; // not persisted; cleared on reload

  document.addEventListener("DOMContentLoaded", init);

  // ============================================================
  // INIT / WIRING
  // ============================================================

  function init() {
    state = loadState() || newGameState();
    if (state.pendingScout) state.pendingScout = null;
    if (!state.highlightedCrew) state.highlightedCrew = [];
    if (!state.highlightedMother) state.highlightedMother = [];
    if (state.phase === "setup") state.phase = "play";
    if (state.sectorRevealed == null) state.sectorRevealed = false;

    document.body.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);

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

  function newGameState() {
    var chamberDeck = shuffle(D.chambers.map(function (c) { return c.id; }));
    var market = chamberDeck.splice(0, 3);

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
      crew: D.crew.map(function (c) {
        return {
          id: c.id,
          name: c.name,
          icons: c.icons.slice(),
          awake: c.startsAwake,
          tired: false,
          wounded: false
        };
      }),
      decks: {
        sector1: shuffle(D.sector1Stars.map(function (s) { return s.id; })),
        sector2: shuffle(D.sector2Stars.map(function (s) { return s.id; })),
        sector3: shuffle(D.sector3Stars.map(function (s) { return s.id; }))
      },
      discards: { sector1: [], sector2: [], sector3: [] },
      sectorGates: {},
      arrivalDeck: shuffle(D.arrivals.map(function (a) { return a.id; })),
      arrivalDraw: null,
      arrivalChosen: null,
      sectorIndex: 0,
      starsThisSector: 0,
      sectorRevealed: false,
      horizon: null,
      highlightedCrew: [],
      highlightedMother: [],
      freeStarNext: false,
      driveCathedralActive: false,
      log: [],
      pendingScout: null,
      chamberMarket: market,
      chamberDeck: chamberDeck,
      chamberInstalled: [],
      chamberFlags: {},
      message: "",
      endingTitle: null,
      endingBody: null,
      lossReason: null
    };
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

  function getArrival(id) {
    return D.arrivals.find(function (a) { return a.id === id; });
  }

  function getChamber(id) {
    return D.chambers.find(function (c) { return c.id === id; });
  }

  function getCrew(id) {
    return state.crew.find(function (c) { return c.id === id; });
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

  // ============================================================
  // MOTHER BANDS
  // ============================================================

  function motherBand() {
    var n = motherUsedCount();
    if (n <= 2) return "clear";
    if (n <= 4) return "bent";
    if (n <= 6) return "hostile";
    return "wheel";
  }

  function motherBandLabel() {
    var b = motherBand();
    if (b === "clear") return "Clear Route";
    if (b === "bent") return "Bent Route";
    if (b === "hostile") return "Hostile Route";
    return "MOTHER Takes the Wheel";
  }

  function motherToneFromUsed(n) {
    if (n <= 2) return "Human Command";
    if (n <= 4) return "Shared Future";
    return "MOTHER Ascendant";
  }

  function thresholdActive(card, level) {
    if (!card) return null;
    var n = motherUsedCount();
    if (level === 3 && card.mother3 && n >= 3) return card.mother3;
    if (level === 5 && card.mother5 && n >= 5) return card.mother5;
    return null;
  }

  // ============================================================
  // EFFECTIVE STAR PROPERTIES
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

  // ============================================================
  // ICON COVERAGE (highlighted crew + MOTHER wilds)
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

  // Returns { missingIcons: [...], wildsLeft: N } when wildsLeft >= 0 success.
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

  // True iff highlighted crew + MOTHER cards cover the need exactly (no slack required).
  function isCovered(need) {
    var r = coverageReport(need);
    return r.wildsLeft >= 0;
  }

  function humanCount() {
    return state.highlightedCrew.length;
  }

  // ============================================================
  // ACTIONS (wired through data-action)
  // ============================================================

  var actions = {
    drawSector: function () { doDrawSector(); },
    drawHorizon: function () { doDrawHorizon(); },
    toggleCrew: function (el) { doToggleCrew(el.dataset.crewId); },
    toggleMother: function (el) { doToggleMother(el.dataset.motherId); },
    drawMother: function () { doDrawMother(); },
    travel: function (el) { doTravel(el.dataset.starId); },
    install: function (el) { doInstall(el.dataset.chamberId); },
    reroute: function () { doReroute(); },
    attemptGate: function () { doAttemptGate(); },
    revealArrivals: function () { doRevealArrivals(); },
    arrive: function (el) { doArrive(el.dataset.arrivalId); },
    chooseScout: function (el) { doChooseScout(el.dataset.starId); },
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
    saveAndRender();
  }

  // ============================================================
  // HORIZON
  // ============================================================

  function doDrawSector() {
    if (state.phase !== "play") return;
    if (state.sectorRevealed) return;
    var key = currentSectorKey();
    state.sectorGates[key] = pickRandom(D.gates[key]).id;
    state.sectorRevealed = true;
    state.horizon = null;
    saveAndRender();
  }

  function revealHorizon() {
    var deck = currentDeck();
    var slots = 3;
    var domeBonus = hasChamber("ch-observation-dome");
    if (domeBonus) slots = 4;

    var picks = [];
    while (picks.length < slots && deck.length > 0) picks.push(deck.shift());

    if (domeBonus && picks.length === 4) {
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
      // Observation Dome 5+ MOTHER cost: use 1 MOTHER card per sector to enable.
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
    if (state.phase !== "play") return;
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
      var travel = effectiveStarTravel(id);
      var cost = state.freeStarNext ? 0 : travel;
      cost = applyGravitySailsDiscount(id, cost);
      return state.fuel >= cost;
    });
  }

  function applyGravitySailsDiscount(starId, cost) {
    if (!hasChamber("ch-gravity-sails")) return cost;
    if (state.chamberFlags.gravitySailsUsedThisSector) return cost;
    var s = getStar(starId);
    if (!s) return cost;
    if (s.travel < 2) return cost;
    return Math.max(0, cost - 1);
  }

  function doReroute() {
    if (state.phase !== "play") return;
    if (!state.horizon) return;
    if (horizonAffordableExists()) {
      showMessage("At least one of these stars is reachable. Choose one or install a chamber first.");
      return;
    }
    if (motherUnusedCount() < 1) {
      enterLoss("Stranded in the Reach");
      return;
    }
    state.horizon.forEach(function (id) { state.discards[currentSectorKey()].push(id); });
    state.horizon = null;
    spendMotherCards(1);
    if (motherUsedCount() > state.motherCards.length) {
      enterLoss("MOTHER Takes the Wheel");
      return;
    }
    revealHorizon();
    saveAndRender();
  }

  // ============================================================
  // TRAVEL
  // ============================================================

  function travelCostFor(starId) {
    var travel = effectiveStarTravel(starId);
    var cost = state.freeStarNext ? 0 : travel;
    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector) {
      var s = getStar(starId);
      if (s && s.travel >= 2) cost = Math.max(0, cost - 1);
    }
    return cost;
  }

  function travelEligibility(starId) {
    var s = getStar(starId);
    if (!s) return { ok: false, reason: "unknown star" };
    var cost = travelCostFor(starId);
    if (state.fuel < cost) return { ok: false, reason: "Need " + cost + " Fuel (have " + state.fuel + ")." };

    var need = effectiveStarNeed(starId);
    var rep = coverageReport(need);
    if (rep.wildsLeft < 0) {
      return { ok: false, reason: "Highlighted icons + MOTHER cards do not cover the Need." };
    }
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is highlighted." };
    }
    var extraCrew = effectiveStarExtraCrew(starId);
    if (extraCrew > 0) {
      var iconsRequired = need.length;
      var baseline = Math.max(2, Math.ceil(iconsRequired / 2));
      var needHumans = baseline + extraCrew;
      if (humanCount() < needHumans) {
        return { ok: false, reason: "3+ MOTHER: also commit +" + extraCrew + " crew (need ≥" + needHumans + " humans)." };
      }
    }
    if (hasChamber("ch-gravity-sails") && !state.chamberFlags.gravitySailsUsedThisSector
        && s.travel >= 2 && motherUsedCount() >= 3 && humanCount() < 2) {
      return { ok: false, reason: "Gravity Sails (3+ MOTHER) needs ≥2 humans on the discounted Star." };
    }
    return { ok: true, cost: cost, motherSpent: rep.missing.length };
  }

  function doTravel(starId) {
    if (state.phase !== "play") return;
    if (!state.horizon || state.horizon.indexOf(starId) < 0) return;
    var elig = travelEligibility(starId);
    if (!elig.ok) { showMessage(elig.reason); return; }

    state.fuel -= elig.cost;
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

    var motherSpent = elig.motherSpent;
    spendHighlightedCrewAsTired();
    spendMotherFromHighlight();

    // MOTHER Liaison Core: refund 1 card per sector when first MOTHER use is small.
    refundLiaisonIfApplicable(motherSpent);

    var sectorKey = currentSectorKey();
    state.horizon.forEach(function (id) {
      if (id !== starId) state.discards[sectorKey].push(id);
    });
    state.horizon = null;

    var card = getStar(starId);
    var legacy = card.legacy;
    state.log.push({ starId: starId, legacy: legacy, motherCards: motherSpent, name: card.name });

    if (hasChamber("ch-mother-liaison") && motherUsedCount() >= 5 && motherSpent > 0 && legacy !== "machine") {
      state.log.push({ starId: starId + "-machine-echo", legacy: "machine", motherCards: 0, name: card.name + " (Machine echo)" });
    }

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
    if (!c) return { ok: false, reason: "unknown chamber" };
    if (!state.sectorRevealed) return { ok: false, reason: "Draw the sector card first." };
    if (state.chamberInstalled.length >= 3) return { ok: false, reason: "Three chambers already installed." };
    if (state.parts < c.parts) return { ok: false, reason: "Need " + c.parts + " Parts (have " + state.parts + ")." };
    var rep = coverageReport(c.build);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Highlighted icons + MOTHER cards do not cover the Build." };
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is highlighted." };
    }
    return { ok: true, cost: c.parts, motherSpent: rep.missing.length };
  }

  function doInstall(chamberId) {
    if (state.phase !== "play") return;
    if (state.chamberMarket.indexOf(chamberId) < 0) return;
    var elig = installEligibility(chamberId);
    if (!elig.ok) { showMessage(elig.reason); return; }

    var chamber = getChamber(chamberId);
    state.parts -= chamber.parts;

    spendHighlightedCrewAsTired();
    spendMotherFromHighlight();
    refundLiaisonIfApplicable(elig.motherSpent);

    state.chamberInstalled.push(chamber.id);
    var marketIdx = state.chamberMarket.indexOf(chamber.id);
    if (marketIdx >= 0) state.chamberMarket.splice(marketIdx, 1);
    if (state.chamberDeck.length > 0) state.chamberMarket.push(state.chamberDeck.shift());

    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }
    saveAndRender();
  }

  // ============================================================
  // GATE
  // ============================================================

  function gateNeed() {
    var g = getGate(currentGateId());
    if (!g) return [];
    return g.need.concat(gateExtraIcons(g));
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
      return { attemptOk: false, willPass: false, reason: "MOTHER may only help if at least one human is highlighted." };
    }
    return { attemptOk: attemptOk, willPass: attemptOk, missing: rep.missing.length, motherSpent: attemptOk ? rep.missing.length : 0 };
  }

  function doAttemptGate() {
    if (state.phase !== "gate") return;
    var elig = gateEligibility();
    if (!elig.attemptOk) {
      if (elig.reason) { showMessage(elig.reason); return; }
      showMessage("The Gate must be fully covered to pass.");
      return;
    }

    var motherSpent = elig.motherSpent;
    spendHighlightedCrewAsTired();
    spendMotherFromHighlight();
    refundLiaisonIfApplicable(motherSpent);

    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }
    advancePastGate();
  }

  function advancePastGate() {
    state.crew.forEach(function (c) { c.tired = false; });
    state.chamberFlags = {};
    state.driveCathedralActive = false;
    state.starsThisSector = 0;
    state.sectorIndex += 1;
    state.sectorRevealed = false;
    state.horizon = null;
    if (state.sectorIndex > 2) {
      state.phase = "arrival";
      state.arrivalDraw = state.arrivalDeck.splice(0, 3);
    } else {
      state.phase = "play";
    }
    saveAndRender();
  }

  // ============================================================
  // ARRIVAL
  // ============================================================

  function doRevealArrivals() {
    // Reserved for future re-roll. Currently arrivals are drawn at gate-pass.
    saveAndRender();
  }

  function arrivalReductionCount(arrivalId) {
    var arrival = getArrival(arrivalId);
    if (!arrival) return 0;
    var matchingStamps = state.log.filter(function (e) { return e.legacy === arrival.legacy; }).length;
    var cap = (arrival.legacy === "life" && hasChamber("ch-seed-vault")) ? 4 : 3;
    return Math.min(cap, matchingStamps);
  }

  function arrivalNeed(arrivalId) {
    var arrival = getArrival(arrivalId);
    var reduction = arrivalReductionCount(arrivalId);
    var need = arrival.need.slice();
    need.splice(need.length - reduction, reduction);
    return need;
  }

  function arriveEligibility(arrivalId) {
    var need = arrivalNeed(arrivalId);
    var rep = coverageReport(need);
    if (rep.wildsLeft < 0) return { ok: false, reason: "Highlighted icons + MOTHER cards do not cover the Need." };
    if (highlightedMotherCount() > 0 && humanCount() === 0) {
      return { ok: false, reason: "MOTHER may only help if at least one human is highlighted." };
    }
    return { ok: true, motherSpent: rep.missing.length };
  }

  function doArrive(arrivalId) {
    if (state.phase !== "arrival") return;
    if (!state.arrivalDraw || state.arrivalDraw.indexOf(arrivalId) < 0) return;
    var elig = arriveEligibility(arrivalId);
    state.arrivalChosen = arrivalId;
    if (!elig.ok) {
      // Without enough icons → Drift Ending.
      enterEndingDrift();
      return;
    }
    spendHighlightedCrewAsTired();
    spendMotherFromHighlight();
    if (motherUsedCount() > state.motherCards.length) { enterLoss("MOTHER Takes the Wheel"); return; }
    enterEndingWin();
  }

  // ============================================================
  // HIGHLIGHTING
  // ============================================================

  function doToggleCrew(id) {
    var crew = getCrew(id);
    if (!crew || !crew.awake) {
      showMessage(crew ? crew.name + " is in cryo." : "");
      return;
    }
    if (crew.tired && state.phase !== "arrival") {
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
    if (card.used) { showMessage("That MOTHER card has already been spent."); return; }
    var idx = state.highlightedMother.indexOf(id);
    if (idx >= 0) state.highlightedMother.splice(idx, 1);
    else state.highlightedMother.push(id);
    saveAndRender();
  }

  function doDrawMother() {
    var commitable = state.phase === "play" || state.phase === "gate" || state.phase === "arrival";
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
    var sectorPhase = state.phase === "play" || state.phase === "gate";
    state.highlightedCrew.forEach(function (id) {
      var c = getCrew(id);
      if (!c) return;
      if (sectorPhase) c.tired = true;
    });
    state.highlightedCrew = [];
  }

  function spendMotherFromHighlight() {
    state.highlightedMother.forEach(function (id) {
      var card = state.motherCards.find(function (m) { return m.id === id; });
      if (card) card.used = true;
    });
    state.highlightedMother = [];
  }

  function spendMotherCards(n) {
    var spent = 0;
    for (var i = 0; i < state.motherCards.length && spent < n; i += 1) {
      if (!state.motherCards[i].used) {
        state.motherCards[i].used = true;
        var hi = state.highlightedMother.indexOf(state.motherCards[i].id);
        if (hi >= 0) state.highlightedMother.splice(hi, 1);
        spent += 1;
      }
    }
    return spent;
  }

  function refundMotherCards(n) {
    var refunded = 0;
    // Refund in reverse so the most recently used card returns first.
    for (var i = state.motherCards.length - 1; i >= 0 && refunded < n; i -= 1) {
      if (state.motherCards[i].used) {
        state.motherCards[i].used = false;
        refunded += 1;
      }
    }
    return refunded;
  }

  function refundLiaisonIfApplicable(motherSpent) {
    if (!hasChamber("ch-mother-liaison")) return;
    if (state.chamberFlags.liaisonUsedThisSector) return;
    if (motherSpent <= 0) return;
    if (motherUsedCount() >= 3) {
      if (motherSpent === 2) {
        refundMotherCards(1);
        state.chamberFlags.liaisonUsedThisSector = true;
      }
    } else {
      if (motherSpent === 1) {
        refundMotherCards(1);
        state.chamberFlags.liaisonUsedThisSector = true;
      }
    }
  }

  // ============================================================
  // CHAMBER ACTIONS
  // ============================================================

  function doUseDriveCathedral() {
    if (state.phase !== "play") return;
    if (!hasChamber("ch-drive-cathedral")) return;
    if (state.chamberFlags.driveCathedralUsedThisSector) {
      showMessage("Drive Cathedral has already shaved a route this sector.");
      return;
    }
    state.driveCathedralActive = !state.driveCathedralActive;
    saveAndRender();
  }

  function doUseArchiveNode() {
    if (state.phase !== "play") return;
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
      for (var i = 0; i < n; i += 1) {
        var sleeper = state.crew.find(function (c) { return !c.awake; });
        if (!sleeper) break;
        sleeper.awake = true;
        sleeper.tired = true;
      }
      cb();
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
          var allowed = !(motherUsedCount() >= 5);
          if (allowed) preventThis = true;
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
  // ENDINGS
  // ============================================================

  function enterLoss(reason) {
    state.phase = "loss";
    state.lossReason = reason;
    saveAndRender();
  }

  function enterEndingWin() {
    var arrId = state.arrivalChosen;
    var motherTone = motherToneFromUsed(motherUsedCount());
    var dom = dominantLegacy(state.log) || "memory";
    var arrival = getArrival(arrId);
    var legacy = D.legacies[dom] ? D.legacies[dom].label : "Mixed";
    state.endingTitle = arrival.name + " · " + motherTone + " · " + legacy;
    state.endingBody = D.endingText(arrId, motherTone, dom);
    state.phase = "ending";
    saveAndRender();
  }

  function enterEndingDrift() {
    var motherTone = motherToneFromUsed(motherUsedCount());
    state.endingTitle = "Drift Ending · " + motherTone;
    state.endingBody = "The Arrival was beyond your reach. The ark drifts forever, kept warm by whatever combination of humans and machine remains.";
    state.phase = "ending";
    saveAndRender();
  }

  function dominantLegacy(log) {
    if (!log || log.length === 0) return null;
    var counts = {};
    log.forEach(function (e) { counts[e.legacy] = (counts[e.legacy] || 0) + 1; });
    var best = null, bestN = 0;
    Object.keys(counts).forEach(function (k) {
      if (counts[k] > bestN) { best = k; bestN = counts[k]; }
    });
    return best;
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

  function saveAndRender() {
    saveState();
    if (typeof window !== "undefined") window.STARPATH = { state: state, D: D };
    render();
  }

  // ============================================================
  // RENDERING
  // ============================================================

  function render() {
    renderTopbar();
    renderShipBoard();
    renderChamberArea();
    renderCrewRow();
    renderMain();
    renderScout();
    renderEnding();
  }

  function renderTopbar() {
    var el = document.getElementById("phaseSummary");
    if (!el) return;
    el.textContent = topbarLabel();
  }

  function topbarLabel() {
    if (state.phase === "play") {
      if (!state.sectorRevealed) return "Draw the next sector card";
      return "Star " + (state.starsThisSector + 1) + " of 3";
    }
    if (state.phase === "gate") return "Sector " + (state.sectorIndex + 1) + " · Gate — only Ready crew remain";
    if (state.phase === "arrival") return "Final Approach — choose your Arrival";
    if (state.phase === "ending") return "Voyage complete";
    if (state.phase === "loss") return "Voyage lost";
    return "";
  }

  function renderShipBoard() {
    var el = document.getElementById("shipBoard");
    if (!el) return;
    var motherUsed = motherUsedCount();
    el.innerHTML =
      '<h2 class="rail-title">Ship Board</h2>' +
      renderTrack("Hull", state.hull, D.starting.hull, "hull") +
      renderTrack("Fuel", state.fuel, Math.max(6, state.fuel), "fuel") +
      renderTrack("Parts", state.parts, Math.max(6, state.parts), "parts") +
      renderTrack("MOTHER", motherUsed, state.motherCards.length, "mother");
  }

  function renderTrack(label, value, max, type) {
    var pips = "";
    for (var i = 0; i < max; i += 1) {
      pips += '<span class="track-pip ' + type + (i < value ? ' on' : ' off') + '"></span>';
    }
    return '<div class="track"><span class="track-name">' + label + '</span><div class="track-pips">' + pips + '</div></div>';
  }

  function renderChamberArea() {
    var el = document.getElementById("chamberArea");
    if (!el) return;
    var installedHtml = state.chamberInstalled.length === 0
      ? '<p class="chamber-empty">No chambers installed yet. Install one from the market.</p>'
      : state.chamberInstalled.map(function (id) { return renderChamberCard(id, "installed"); }).join("");

    var marketHtml = state.chamberMarket.length === 0
      ? '<p class="chamber-empty">Chamber market is empty.</p>'
      : state.chamberMarket.map(function (id) {
          var c = getChamber(id);
          var elig = state.phase === "play" && state.sectorRevealed ? installEligibility(id) : { ok: false, reason: "Available during the sector." };
          var note = elig.ok
            ? 'Install (Parts ' + c.parts + (elig.motherSpent ? ' + ' + elig.motherSpent + ' MOTHER' : '') + ')'
            : 'Install (Parts ' + c.parts + ' + crew)';
          var btn = elig.ok
            ? '<button class="primary" data-action="install" data-chamber-id="' + escapeAttr(id) + '">' + note + '</button>'
            : '<button class="secondary" disabled title="' + escapeAttr(elig.reason || "") + '">' + note + '</button>';
          return '<div class="chamber-pick">' + renderChamberCard(id, "market") + btn + '</div>';
        }).join("");

    var actionsHtml = "";
    if (state.phase === "play" && hasChamber("ch-drive-cathedral") && !state.chamberFlags.driveCathedralUsedThisSector) {
      var btnLabel = state.driveCathedralActive ? "Drive Cathedral: armed (-1 Travel)" : "Use Drive Cathedral (-1 Travel)";
      actionsHtml += '<button class="secondary" data-action="useDriveCathedral">' + btnLabel + '</button>';
    }
    if (state.phase === "play" && hasChamber("ch-archive-node") && !state.chamberFlags.archiveNodeUsedThisSector) {
      actionsHtml += '<button class="secondary" data-action="useArchiveNode">Use Archive Node</button>';
    }

    el.innerHTML =
      '<h2 class="rail-title">Chambers</h2>' +
      '<div class="chamber-installed">' + installedHtml + '</div>' +
      (actionsHtml ? '<div class="chamber-actions">' + actionsHtml + '</div>' : "") +
      '<h3 class="chamber-market-title">Market (' + state.chamberInstalled.length + '/3 installed)</h3>' +
      '<div class="chamber-market">' + marketHtml + '</div>';
  }

  function renderCrewRow() {
    var el = document.getElementById("crewRow");
    if (!el) return;
    var commitable = state.phase === "play" || state.phase === "gate" || state.phase === "arrival";
    var awakeCrew = state.crew.filter(function (c) { return c.awake; });
    var html = '<div class="crew-row-title">Crew hand (click to highlight / unhighlight)</div><div class="crew-row-body">';
    awakeCrew.forEach(function (c) {
      var cls = "crew-tile";
      if (!c.awake) cls += " state-cryo";
      else if (c.tired && state.phase !== "arrival") cls += " state-tired";
      else cls += " state-ready";
      if (c.wounded) cls += " state-wounded";
      if (state.highlightedCrew.indexOf(c.id) >= 0) cls += " state-committed";
      var canSelect = commitable && c.awake && (state.phase === "arrival" || !c.tired);
      var iconRow = c.icons.map(function (icon, idx) {
        var muted = c.wounded && idx > 0;
        return iconBadge(icon, muted ? "icon-badge muted" : "icon-badge");
      }).join("");
      var subState =
        !c.awake ? "Cryo" :
        c.tired && state.phase !== "arrival" ? "Tired" :
        c.wounded ? "Wounded" : "Ready";
      html += '<button type="button" class="' + cls + '" ' +
        (canSelect ? 'data-action="toggleCrew" data-crew-id="' + escapeAttr(c.id) + '"' : "disabled") +
        '>' +
        '<span class="crew-name">' + escapeHtml(c.name) + '</span>' +
        '<span class="crew-icons">' + iconRow + '</span>' +
        '<span class="crew-state">' + subState + '</span>' +
        "</button>";
    });
    state.highlightedMother.forEach(function (id) {
      html += '<button type="button" class="crew-tile mother-hand-card state-committed" data-action="toggleMother" data-mother-id="' + escapeAttr(id) + '">' +
        '<span class="crew-name">MOTHER</span>' +
        '<span class="crew-icons"><span class="mother-wild-icon">★</span></span>' +
        '<span class="crew-state">Wild · click to return</span>' +
        '</button>';
    });
    html += "</div>";
    el.innerHTML = html;
  }

  function renderMain() {
    var el = document.getElementById("mainArea");
    if (!el) return;
    if (state.phase === "play") return el.innerHTML = renderPlay();
    if (state.phase === "gate") return el.innerHTML = renderGatePhase();
    if (state.phase === "arrival") return el.innerHTML = renderArrivalPhase();
    if (state.phase === "ending" || state.phase === "loss") return el.innerHTML = "";
  }

  function renderPlay() {
    var deckLeft = currentDeck().length;
    var gateId = currentGateId();
    var rerouteHtml = "";
    if (state.horizon && !horizonAffordableExists()) {
      var canReroute = motherUnusedCount() > 0;
      rerouteHtml = '<div class="reroute-row"><p class="reroute-text">No Horizon Star is reachable on current Fuel.</p>' +
        '<button class="' + (canReroute ? 'primary' : 'secondary') + '" data-action="reroute" ' + (canReroute ? '' : 'disabled') + '>' +
        (canReroute ? 'Reroute (use 1 MOTHER card, redraw)' : 'Reroute — no MOTHER cards left') + '</button></div>';
    }

    var horizonHtml = "";
    if (state.horizon) {
      horizonHtml = state.horizon.map(function (id) {
        return renderHorizonStarSlot(id);
      }).join("");
    } else {
      horizonHtml = renderEmptyHorizon();
    }

    return [
      '<section class="board-panel">',
      '<div class="sector-table">',
        '<div class="deck-zone">' + renderSectorDeck() + renderMotherDeck() + renderCryoDeck() + '</div>',
        (state.sectorRevealed
          ? '<div class="sector-focus">' + renderHorizonDeck(deckLeft) + '<div class="gate-banner">' + renderGateCard(gateId, "small") + '</div></div>'
          : '<div class="sector-empty">Draw a sector card to begin.</div>'),
      '</div>',
      '<div class="horizon-row">' + horizonHtml + '</div>',
      rerouteHtml,
      '</section>'
    ].join("");
  }

  function renderSectorDeck() {
    var remaining = Math.max(0, 3 - state.sectorIndex);
    if (state.sectorRevealed) {
      return '<div class="deck-card sector-deck drawn" aria-label="Sector card"><span class="deck-label">Sector Card</span><strong>' + (state.sectorIndex + 1) + '</strong><span class="deck-foot">Drawn</span></div>';
    }
    return '<button type="button" class="deck-card sector-deck" data-action="drawSector"><span class="deck-label">Sector Deck</span><strong>' + remaining + '</strong><span class="deck-foot">Draw sector</span></button>';
  }

  function renderMotherDeck() {
    var commitable = state.phase === "play" || state.phase === "gate" || state.phase === "arrival";
    var count = motherDeckCount();
    var disabled = !commitable || count < 1;
    var attrs = disabled ? ' disabled' : ' data-action="drawMother"';
    return '<button type="button" class="deck-card mother-deck"' + attrs + '><span class="deck-label">MOTHER Deck</span><strong>' + count + '</strong><span class="deck-foot">Draw wild</span></button>';
  }

  function renderCryoDeck() {
    var cryoCount = state.crew.filter(function (c) { return !c.awake; }).length;
    return '<div class="deck-card cryo-deck" aria-label="Cryo deck">' +
      '<span class="deck-label">Cryo Deck</span>' +
      '<strong>' + cryoCount + '</strong>' +
      '<span class="deck-foot">Wake rewards draw here</span>' +
      '</div>';
  }

  function renderHorizonDeck(deckLeft) {
    var disabled = !state.sectorRevealed || state.horizon || deckLeft < 1;
    var attrs = disabled ? ' disabled' : ' data-action="drawHorizon"';
    var foot = state.horizon ? 'Horizon drawn' : 'Click to draw 3';
    return '<button type="button" class="deck-card horizon-deck"' + attrs + '>' +
      '<span class="deck-label">Horizon Deck</span>' +
      '<strong>' + deckLeft + '</strong>' +
      '<span class="deck-foot">' + foot + '</span>' +
      '</button>';
  }

  function renderEmptyHorizon() {
    return "";
  }

  function renderHorizonStarSlot(starId) {
    var elig = travelEligibility(starId);
    var btn = elig.ok
      ? '<button class="primary" data-action="travel" data-star-id="' + escapeAttr(starId) + '">Travel here' +
        (elig.motherSpent ? ' (use ' + elig.motherSpent + ' MOTHER)' : '') + '</button>'
      : '<button class="secondary" disabled title="' + escapeAttr(elig.reason || "") + '">Travel here</button>';

    return '<div class="horizon-slot">' +
      renderStarCard(starId, "horizon") +
      btn +
      '</div>';
  }

  function renderGatePhase() {
    var gateId = currentGateId();
    var g = getGate(gateId);
    var need = gateNeed();
    var elig = gateEligibility();
    var status = renderCoverageStatus(need);
    var passBtn = elig.attemptOk
      ? '<button class="primary" data-action="attemptGate">Attempt Gate' + (elig.motherSpent ? ' (use ' + elig.motherSpent + ' MOTHER)' : '') + '</button>'
      : '<button class="secondary" disabled>Attempt Gate (insufficient)</button>';

    return [
      '<section class="panel">',
      '<h2 class="panel-title">Gate · ' + escapeHtml(g.name) + '</h2>',
      '<p class="panel-text">Highlight crew and MOTHER cards to cover the Gate. If the available crew and MOTHER cards cannot cover it, the voyage fails.</p>',
      '<div class="active-row">',
        renderGateCard(gateId, "active"),
        '<div class="commit-panel">',
          '<div class="gate-decks">' + renderMotherDeck() + '</div>',
          status,
          '<div class="actions">' + passBtn + '</div>',
        '</div>',
      '</div>',
      '</section>'
    ].join("");
  }

  function renderArrivalPhase() {
    if (!state.arrivalDraw) state.arrivalDraw = state.arrivalDeck.splice(0, 3);
    var slots = state.arrivalDraw.map(function (id) {
      var elig = arriveEligibility(id);
      var status = renderCoverageStatus(arrivalNeed(id));
      var arrival = getArrival(id);
      var btn = elig.ok
        ? '<button class="primary" data-action="arrive" data-arrival-id="' + escapeAttr(id) + '">Arrive at ' + escapeHtml(arrival.name) +
          (elig.motherSpent ? ' (use ' + elig.motherSpent + ' MOTHER)' : '') + '</button>'
        : '<button class="secondary" data-action="arrive" data-arrival-id="' + escapeAttr(id) + '" title="' + escapeAttr(elig.reason || "") + '">Drift toward ' + escapeHtml(arrival.name) + '</button>';
      return '<div class="arrival-pick">' +
        renderArrivalCardLarge(id, true) +
        status +
        btn +
        '</div>';
    }).join("");
    return [
      '<section class="panel">',
      '<h2 class="panel-title">Final Approach — three Arrivals drawn</h2>',
      '<p class="panel-text">Each matching Legacy from visited Stars removes one icon from an Arrival\'s Need (up to 3' +
        (hasChamber("ch-seed-vault") ? ", or 4 for Life arrivals with Seed Vault" : "") + '). Highlight crew + MOTHER cards, then click an Arrival.</p>',
      '<div class="gate-decks">' + renderMotherDeck() + '</div>',
      '<div class="arrival-choice-row">' + slots + '</div>',
      '</section>'
    ].join("");
  }

  function renderCoverageStatus(need) {
    var providedAll = highlightedCrewIcons();
    var html = '<div class="icon-check"><span class="card-section">Need</span><div class="icon-check-row">';
    var p = providedAll.slice();
    var matchedSlots = [];
    need.forEach(function (icon) {
      var idx = p.indexOf(icon);
      if (idx >= 0) { p.splice(idx, 1); matchedSlots.push("ok"); }
      else matchedSlots.push("miss");
    });
    var wildsToFill = highlightedMotherCount();
    var wildsAssignedDisplay = 0;
    matchedSlots.forEach(function (slot, i) {
      var icon = need[i];
      var cls;
      if (slot === "ok") cls = "ok";
      else if (wildsAssignedDisplay < wildsToFill) { cls = "wild"; wildsAssignedDisplay += 1; }
      else cls = "miss";
      var marker = cls === "ok" ? '<span class="check">✓</span>'
        : cls === "wild" ? '<span class="check">★</span>'
        : '<span class="cross">·</span>';
      html += '<span class="icon-check-cell ' + cls + '">' + iconBadge(icon) + marker + '</span>';
    });
    html += '</div></div>';
    return html;
  }

  // ----------- Card renderers ----------

  function renderStarCard(id, mode) {
    var s = getStar(id);
    if (!s) return "";
    var legacy = D.legacies[s.legacy];
    var modeClass = "card star-card mode-" + (mode || "default");

    var need = s.need.slice();
    var t3 = s.mother3;
    var t5 = s.mother5;
    var t3Active = thresholdActive(s, 3);
    var t5Active = thresholdActive(s, 5);
    if (t3Active && t3Active.addNeed) need = need.concat(t3Active.addNeed);
    if (t5Active && t5Active.addNeed) need = need.concat(t5Active.addNeed);

    var rewardEffects = effectiveStarReward(id);

    var thresholdLines = "";
    if (t3) thresholdLines += '<div class="card-mother-line ' + (t3Active ? "active" : "dim") + '">' +
      '<span class="card-section">3+ MOTHER</span>' + thresholdLineLabel(t3) + '</div>';
    if (t5) thresholdLines += '<div class="card-mother-line ' + (t5Active ? "active" : "dim") + '">' +
      '<span class="card-section">5+ MOTHER</span>' + thresholdLineLabel(t5) + '</div>';

    return [
      '<article class="' + modeClass + '" style="--legacy:' + legacy.color + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow"></span>',
        '<span class="card-legacy" style="background:' + legacy.color + '">' + legacy.label + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(s.name) + '</h3>',
      '<div class="star-card-main">',
        '<div class="card-need"><span class="card-section">Need</span><div class="need-row">' + fuelBadge(starFuelNeed(id, mode)) + iconRow(need) + '</div></div>',
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
    if (t.scoutDelta) parts.push((t.scoutDelta > 0 ? "Scout +" : "Scout ") + t.scoutDelta + " stars.");
    if (t.addNeed && t.addNeed.length) {
      parts.push("Need adds " + t.addNeed.map(function (i) { return D.icons[i] ? D.icons[i].label : i; }).join(" + ") + ".");
    }
    if (t.rewardOverride) parts.push("Reward becomes: " + t.rewardOverride.map(effectInline).join(", ") + ".");
    return '<span class="threshold-text">' + parts.map(escapeHtml).join(" ") + '</span>';
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
      ? '<div class="card-hostile">5+ MOTHER · Need +1 ' + (D.icons[g.need[0]] ? D.icons[g.need[0]].label : "icon") + '</div>'
      : "";
    var fullNeed = g.need.concat(hostile && g.need[0] ? [g.need[0]] : []);
    return [
      '<article class="' + modeClass + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">Gate · Sector ' + (state.sectorIndex + 1) + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(g.name) + '</h3>',
      '<div class="card-need"><span class="card-section">Need</span>' + iconRow(fullNeed) + '</div>',
      hostileNote,
      '</article>'
    ].join("");
  }

  function renderArrivalCardLarge(id, active) {
    var a = getArrival(id);
    if (!a) return "";
    var legacy = D.legacies[a.legacy];
    var stamps = state.log.filter(function (e) { return e.legacy === a.legacy; }).length;
    var cap = (a.legacy === "life" && hasChamber("ch-seed-vault")) ? 4 : 3;
    var reduction = Math.min(cap, stamps);
    var displayedNeed = a.need.slice();
    if (active) {
      displayedNeed.splice(displayedNeed.length - reduction, reduction);
    }
    var modeClass = "card arrival-card";
    if (active) modeClass += " mode-active";
    return [
      '<article class="' + modeClass + '" style="--legacy:' + legacy.color + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">Arrival</span>',
        '<span class="card-legacy" style="background:' + legacy.color + '">' + legacy.label + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(a.name) + '</h3>',
      '<div class="card-need"><span class="card-section">Need' +
        (reduction && active ? ' (−' + reduction + ' from Legacy)' : "") +
        '</span>' + iconRow(displayedNeed) + '</div>',
      '<p class="card-flavor">' + escapeHtml(a.flavor) + '</p>',
      '</article>'
    ].join("");
  }

  function renderChamberCard(id, mode) {
    var c = getChamber(id);
    if (!c) return "";
    var modeClass = "card chamber-card mode-" + (mode || "default");
    var thresholdLines = "";
    if (c.mother3) thresholdLines += '<div class="card-mother-line ' + (motherUsedCount() >= 3 ? "active" : "dim") + '">' +
      '<span class="card-section">3+ MOTHER</span><span class="threshold-text">' + escapeHtml(c.mother3) + '</span></div>';
    if (c.mother5) thresholdLines += '<div class="card-mother-line ' + (motherUsedCount() >= 5 ? "active" : "dim") + '">' +
      '<span class="card-section">5+ MOTHER</span><span class="threshold-text">' + escapeHtml(c.mother5) + '</span></div>';
    return [
      '<article class="' + modeClass + '">',
      '<header class="card-head">',
        '<span class="card-eyebrow">Chamber · Parts ' + c.parts + '</span>',
      '</header>',
      '<h3 class="card-title">' + escapeHtml(c.name) + '</h3>',
      '<div class="card-need"><span class="card-section">Build</span>' + iconRow(c.build) + '</div>',
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
    if (mode === "horizon" && state.horizon && state.horizon.indexOf(starId) >= 0) return travelCostFor(starId);
    return effectiveStarTravel(starId);
  }

  function fuelBadge(cost) {
    var text = cost === 0 && state.freeStarNext ? "Fuel Free" : "Fuel " + cost;
    return '<span class="fuel-badge" title="Fuel needed">' + text + '</span>';
  }

  function effectsLabel(effects) {
    if (!effects || effects.length === 0) return '<span class="effect-none">—</span>';
    return '<div class="effect-row">' + effects.map(effectLabel).join("") + '</div>';
  }

  function effectLabel(e) {
    if (e.type === "hull")
      return '<span class="eff eff-hull">Hull ' + signed(e.amount) + '</span>';
    if (e.type === "fuel")
      return '<span class="eff eff-fuel">Fuel ' + signed(e.amount) + '</span>';
    if (e.type === "parts")
      return '<span class="eff eff-parts">Parts ' + signed(e.amount) + '</span>';
    if (e.type === "wake")
      return '<span class="eff eff-wake">Wake ' + e.amount + '</span>';
    if (e.type === "heal")
      return '<span class="eff eff-heal">Heal ' + e.amount + '</span>';
    if (e.type === "wound")
      return '<span class="eff eff-wound">Wound ' + e.amount + '</span>';
    if (e.type === "scout")
      return '<span class="eff eff-scout">Scout ' + (e.amount || 3) + '</span>';
    if (e.type === "freeStar")
      return '<span class="eff eff-free">Next Star is Free</span>';
    return '<span class="eff">?</span>';
  }

  function signed(n) { return (n > 0 ? "+" : "") + n; }
  function repeat(s, n) { var out = ""; for (var i = 0; i < n; i += 1) out += s; return out; }

  // ----------- Modals ----------

  function renderScout() {
    var panel = document.getElementById("scoutPanel");
    if (!panel) return;
    if (!state.pendingScout) { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    var source = state.pendingScout.source;
    var heading = source === "archiveNode" ? "Archive Node — reorder the deck" : "Scout the next stars";
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

  function renderEnding() {
    var panel = document.getElementById("endingPanel");
    if (!panel) return;
    if (state.phase !== "ending" && state.phase !== "loss") { panel.hidden = true; panel.innerHTML = ""; return; }
    panel.hidden = false;
    var title, body;
    if (state.phase === "loss") {
      title = "Voyage lost — " + state.lossReason;
      if (state.lossReason === "MOTHER Takes the Wheel") {
        body = "MOTHER's seventh card slides into the area, but no card remains to give. The ark continues, but the destination is no longer yours to choose.";
      } else if (state.lossReason === "Stranded in the Reach") {
        body = "No reachable Stars, no MOTHER cards left to bend the route. The ark drifts where it stopped.";
      } else if (state.lossReason === "Gate Failed") {
        body = "The sector Gate cannot be covered with the crew and MOTHER cards still available. The ark fails at the threshold.";
      } else {
        body = "The ark cannot continue. The cards you collected are still on the table. Read them like an unfinished obituary.";
      }
    } else {
      title = state.endingTitle || "Voyage complete";
      body = state.endingBody || "";
    }
    var motherTone = motherToneFromUsed(motherUsedCount());
    var legacyEntries = Object.keys(D.legacies).map(function (id) {
      var legacy = D.legacies[id];
      var n = state.log.filter(function (e) { return e.legacy === id; }).length;
      return '<div class="ending-legacy"><span class="ending-legacy-name" style="background:' + legacy.color + '">' +
        legacy.label + '</span><span class="ending-legacy-count">' + n + '</span></div>';
    }).join("");
    panel.innerHTML =
      '<div class="overlay-card ending-card">' +
      '<header class="overlay-head"><h2>' + escapeHtml(title) + '</h2></header>' +
      '<p class="ending-body">' + escapeHtml(body) + '</p>' +
      '<div class="ending-meta">' +
        '<div class="ending-meta-row"><span>MOTHER cards used</span><strong>' + motherUsedCount() + ' / ' + state.motherCards.length +
          ' — ' + motherTone + '</strong></div>' +
        '<div class="ending-meta-row"><span>Hull at end</span><strong>' + state.hull + '</strong></div>' +
        '<div class="ending-meta-row"><span>Fuel at end</span><strong>' + state.fuel + '</strong></div>' +
        '<div class="ending-meta-row"><span>Parts at end</span><strong>' + state.parts + '</strong></div>' +
        '<div class="ending-meta-row"><span>Chambers installed</span><strong>' + state.chamberInstalled.length + '</strong></div>' +
      '</div>' +
      '<div class="ending-legacies">' + legacyEntries + '</div>' +
      '<div class="actions"><button class="primary" data-action="newGame">Begin a new voyage</button></div>' +
      '</div>';
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
