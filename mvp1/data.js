/* COREBOUND: Starpath - cards and content. */

window.COREBOUND_STARPATH_DATA = (function () {
  "use strict";

  // Icon ids: 'engine', 'star', 'life', 'signal'
  var ICONS = {
    engine: { id: "engine", label: "Engine", glyph: "⚙", color: "#c66325" },
    star:   { id: "star",   label: "Star",   glyph: "✦", color: "#b58a25" },
    life:   { id: "life",   label: "Life",   glyph: "✿", color: "#4f9255" },
    signal: { id: "signal", label: "Signal", glyph: "◉", color: "#3a78c8" },
    fuel:   { id: "fuel",   label: "Fuel",   glyph: "⬢", color: "#f0a85e" },
    hull:   { id: "hull",   label: "Hull",   glyph: "♥", color: "#a83c3c" },
    parts:  { id: "parts",  label: "Parts",  glyph: "⚒", color: "#6e7d4e" },
    person: { id: "person", label: "Crew",   glyph: "♟", color: "#c66325" },
    heal:   { id: "heal",   label: "Heal",   glyph: "✚", color: "#4f9255" },
    wound:  { id: "wound",  label: "Wound",  glyph: "✗", color: "#742e2a" },
    scout:  { id: "scout",  label: "Scout",  glyph: "◎", color: "#6e5a9c" },
    mother: { id: "mother", label: "MOTHER", glyph: "✶", color: "#1f1c19" },
    free:   { id: "free",   label: "Free",   glyph: "✦", color: "#b58a25" }
  };

  // Crew. Six begin loyal to the solo player; six begin in Cryo.
  var CREW = [
    { id: "mara",    name: "Mara Voss",     icons: ["engine", "engine"], startsAwake: true  },
    { id: "ilya",    name: "Ilya Rao",      icons: ["star",   "signal"], startsAwake: true  },
    { id: "sana",    name: "Sana Iqbal",    icons: ["life",   "life"  ], startsAwake: true  },
    { id: "nia",     name: "Nia Okonkwo",   icons: ["signal", "star"  ], startsAwake: true  },
    { id: "tomas",   name: "Tomas Hale",    icons: ["engine", "life"  ], startsAwake: true  },
    { id: "elise",   name: "Elise Tan",     icons: ["life",   "signal"], startsAwake: true  },
    { id: "juno",    name: "Juno Pike",     icons: ["engine", "star"  ], startsAwake: false },
    { id: "oren",    name: "Oren Vale",     icons: ["signal", "signal"], startsAwake: false },
    { id: "ada",     name: "Ada Chen",      icons: ["engine", "signal"], startsAwake: false },
    { id: "malik",   name: "Malik Ortega",  icons: ["star",   "star"  ], startsAwake: false },
    { id: "priya",   name: "Priya Shah",    icons: ["life",   "engine"], startsAwake: false },
    { id: "lei",     name: "Lei Watanabe",  icons: ["life",   "star"  ], startsAwake: false }
  ];

  // Effect helpers.
  // Reward types: hull, fuel, parts, wake, heal, scout, freeStar.
  function E(type, amount) { return { type: type, amount: amount || 1 }; }

  function distanceLabel(travel) {
    if (travel <= 0) return "Near";
    if (travel === 1) return "Far";
    if (travel === 2) return "Deep";
    return "Abyssal";
  }

  // Threshold-line vocabulary on stars (active by spent MOTHER count):
  //   addNeed: ['icon', ...]   adds icons to Need
  //   extraCrew: N             at least N additional human crew must commit
  //   travelDelta: N           printed Travel cost rises by N
  //   scoutDelta: N            scout reveal count is shifted by N (negative = fewer)
  //   rewardOverride: [E,...]  replaces the Reward effects when active

  // --------- STAR DECKS ---------

  var SECTOR1_STARS = [
    { id: "s1-dust-garden",     name: "Dust Garden",       travel: 0, need: ["life","star"],
      reward: [E("fuel", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s1-asteroid-forge",  name: "Asteroid Forge",    travel: 0, need: ["engine","engine"],
      reward: [E("hull", 1)] },
    { id: "s1-solar-sail",      name: "Solar Sail Echo",   travel: 0, need: ["star","signal"],
      reward: [E("fuel", 2)],
      mother3: { travelDelta: 1 } },
    { id: "s1-whisper-field",   name: "Whisper Field",     travel: 0, need: ["signal","signal"],
      reward: [E("scout", 3)],
      mother3: { scoutDelta: -1 } },
    { id: "s1-rusted-probe",    name: "Rusted Probe",      travel: 0, need: ["engine","signal"],
      reward: [E("hull", 1), E("parts", 1)] },

    { id: "s1-aurora-reef",     name: "Aurora Reef",       travel: 1, need: ["life","signal"],
      reward: [E("heal", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s1-nav-beacon",      name: "Nav Beacon",        travel: 1, need: ["star","star"],
      reward: [E("fuel", 1), E("freeStar", 1)],
      mother3: { rewardOverride: [E("fuel", 1)] } },
    { id: "s1-ember-orchard",   name: "Ember Orchard",     travel: 1, need: ["life","engine"],
      reward: [E("hull", 1), E("parts", 1)] },
    { id: "s1-static-shoal",    name: "Static Shoal",      travel: 1, need: ["signal","star"],
      reward: [E("fuel", 1), E("parts", 1)] },

    { id: "s1-kepler-nursery",  name: "Kepler Nursery",    travel: 2, need: ["life","life","engine"],
      reward: [E("wake", 1)],
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } },
    { id: "s1-pilgrim-hulk",    name: "Pilgrim Hulk",      travel: 2, need: ["engine","star","life"],
      reward: [E("wake", 1), E("parts", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s1-red-harvest",     name: "Red Harvest",       travel: 2, need: ["engine","engine","life"],
      reward: [E("hull", 2), E("parts", 1)],
      mother3: { travelDelta: 1 } }
  ];

  var SECTOR2_STARS = [
    { id: "s2-machine-orbit",   name: "Machine Orbit",     travel: 0, need: ["engine","engine","signal"],
      reward: [E("hull", 2)],
      mother3: { rewardOverride: [E("hull", 1)] } },
    { id: "s2-slow-star",       name: "Slow Star",         travel: 0, need: ["star","star","star"],
      reward: [E("fuel", 2)],
      mother3: { travelDelta: 1 } },
    { id: "s2-drifting-archive",name: "Drifting Archive",  travel: 0, need: ["signal","signal","engine"],
      reward: [E("scout", 3), E("fuel", 1)],
      mother3: { scoutDelta: -1 },
      mother5: { addNeed: ["signal"] } },

    { id: "s2-frozen-ark",      name: "Frozen Ark",        travel: 1, need: ["life","engine","signal"],
      reward: [E("wake", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s2-black-relay",     name: "Black Relay",       travel: 1, need: ["signal","signal","star"],
      reward: [E("scout", 3), E("parts", 1)],
      mother3: { scoutDelta: -1 } },
    { id: "s2-long-arc",        name: "The Long Arc",      travel: 1, need: ["star","star","engine"],
      reward: [E("fuel", 2), E("parts", 1)],
      mother3: { travelDelta: 1 } },
    { id: "s2-brine-comet",     name: "Brine Comet",       travel: 1, need: ["life","life","signal"],
      reward: [E("wake", 1)] },
    { id: "s2-shrike-nebula",   name: "Shrike Nebula",     travel: 1, need: ["star","signal","engine"],
      reward: [E("hull", 1), E("fuel", 1)] },

    { id: "s2-cryo-resonator",  name: "Cryo Resonator",    travel: 2, need: ["life","life","engine"],
      reward: [E("heal", 2), E("parts", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s2-ghost-forge",     name: "Ghost Forge",       travel: 2, need: ["engine","engine","star"],
      reward: [E("hull", 1), E("wake", 1), E("parts", 1)] },
    { id: "s2-wildlight-bloom", name: "Wildlight Bloom",   travel: 2, need: ["life","star","signal"],
      reward: [E("heal", 1), E("fuel", 1), E("parts", 1)],
      mother3: { extraCrew: 1 } },

    { id: "s2-waiting-city",    name: "The Waiting City",  travel: 3, need: ["engine","life","signal","star"],
      reward: [E("wake", 2), E("parts", 1)],
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } }
  ];

  var SECTOR3_STARS = [
    { id: "s3-machine-chapel",  name: "Machine Chapel",    travel: 0, need: ["engine","engine","engine","signal"],
      reward: [E("hull", 2), E("fuel", 1)],
      mother3: { travelDelta: 1 } },
    { id: "s3-quiet-ship",      name: "The Quiet Ship",    travel: 0, need: ["engine","life","star","signal"],
      reward: [E("wake", 2), E("heal", 1)],
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } },

    { id: "s3-older-sister",    name: "Mother's Older Sister", travel: 1, need: ["signal","signal","signal","engine"],
      reward: [E("heal", 2), E("fuel", 1)],
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("heal", 1), E("fuel", 1)] } },
    { id: "s3-vault-of-words",  name: "Vault of Words",    travel: 1, need: ["signal","signal","star","engine"],
      reward: [E("scout", 3), E("heal", 1), E("parts", 1)],
      mother3: { scoutDelta: -1 } },
    { id: "s3-deep-cradle",     name: "Deep Cradle",       travel: 1, need: ["life","engine","engine","signal"],
      reward: [E("wake", 2), E("hull", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s3-breath-of-void",  name: "Breath of Void",    travel: 1, need: ["signal","star","engine","life"],
      reward: [E("heal", 1), E("fuel", 1), E("parts", 1)] },

    { id: "s3-infinite-trellis",name: "Infinite Trellis",  travel: 2, need: ["life","life","engine","signal"],
      reward: [E("wake", 2), E("parts", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s3-pearl-ocean",     name: "Pearl Ocean",       travel: 2, need: ["life","life","star","star"],
      reward: [E("heal", 2), E("wake", 1)],
      mother3: { extraCrew: 1 } },
    { id: "s3-starmaker",       name: "Starmaker",         travel: 2, need: ["star","star","star","signal"],
      reward: [E("fuel", 3), E("parts", 1)],
      mother3: { travelDelta: 1 } },
    { id: "s3-wild-chorus",     name: "Wild Chorus",       travel: 2, need: ["life","signal","signal","star"],
      reward: [E("heal", 2), E("parts", 1)],
      mother3: { extraCrew: 1 } },

    { id: "s3-the-mouth",       name: "The Mouth",         travel: 3, need: ["engine","engine","star","star","signal"],
      reward: [E("hull", 3), E("parts", 2)],
      mother3: { extraCrew: 1 },
      mother5: { travelDelta: 1 } },
    { id: "s3-open-gate",       name: "The Open Gate",     travel: 3, need: ["engine","star","signal","life","star"],
      reward: [E("fuel", 2), E("hull", 1), E("parts", 2)],
      mother3: { extraCrew: 1 },
      mother5: { travelDelta: 1 } }
  ];

  // --------- GATES ---------

  var GATES = {
    sector1: [
      { id: "gate-long-jump",      name: "Long Jump",      need: ["star","star","engine","signal"] },
      { id: "gate-radiation-belt", name: "Radiation Belt", need: ["engine","engine","life","signal"] }
    ],
    sector2: [
      { id: "gate-kuiper-storm",   name: "Kuiper Storm",   need: ["engine","engine","star","star","signal"] },
      { id: "gate-blood-comet",    name: "Blood Comet",    need: ["life","life","engine","star","signal"] }
    ],
    sector3: [
      { id: "gate-gravity-well",   name: "Gravity Well",   need: ["star","star","star","engine","engine","signal","life"] },
      { id: "gate-the-threshold",  name: "The Threshold",  need: ["engine","engine","life","signal","signal","star","star"] }
    ]
  };

  // --------- CHAMBERS ---------

  var CHAMBERS = [
    { id: "ch-drive-cathedral",  name: "Drive Cathedral",
      parts: 3, build: ["engine","star"],
      effect: "Once per sector, reduce a Star's Travel cost by 1.",
      mother3: "Only works on Near or Far Stars (Travel 0-1).",
      mother5: "After using it, exhaust 1 committed crew (or use 1 MOTHER card)." },
    { id: "ch-gravity-sails",    name: "Gravity Sails",
      parts: 2, build: ["star","signal"],
      effect: "The first Deep+ Star you visit each sector costs -1 Fuel.",
      mother3: "Only if you commit at least 2 crew to that Star." },
    { id: "ch-commons-ring",     name: "Commons Ring",
      parts: 3, build: ["life","life"],
      effect: "After completing the first Star each sector, ready 1 Tired crew.",
      mother3: "Only if no MOTHER cards were used on that Star." },
    { id: "ch-medical-bay",      name: "Medical Bay",
      parts: 2, build: ["life","signal"],
      effect: "Once per sector, prevent 1 wound at a Gate.",
      mother3: "Prevent the wound, then exhaust that crew.",
      mother5: "Disabled at 5+ spent MOTHER cards." },
    { id: "ch-observation-dome", name: "Observation Dome",
      parts: 2, build: ["star","signal"],
      effect: "At Horizon, reveal 4 Stars and discard 1; choose from the remaining 3.",
      mother3: "MOTHER chooses which Star is discarded (lowest Travel).",
      mother5: "Use 1 MOTHER card to enable this chamber each sector." },
    { id: "ch-archive-node",     name: "Archive Node",
      parts: 2, build: ["signal","signal"],
      effect: "Once per sector, look at the top 2 cards of the deck and reorder them.",
      mother3: "Look at only 1 card." },
    { id: "ch-bulkhead-garden",  name: "Bulkhead Garden",
      parts: 2, build: ["engine","life"],
      effect: "The first Hull loss each sector is reduced by 1.",
      mother3: "Only works if you have at least 1 Fuel." },
    { id: "ch-seed-vault",       name: "Seed Vault",
      parts: 3, build: ["life","signal"],
      effect: "During each Gate Draft, reveal +1 extra crew from Cryo before drafting.",
      mother3: "The extra revealed crew enters the draft Wounded if chosen.",
      mother5: "Seed Vault does not affect Gate Drafts." },
    { id: "ch-mother-liaison",   name: "MOTHER Liaison Core",
      parts: 2, build: ["signal","engine"],
      effect: "The first 1-icon MOTHER use each sector returns the card to the MOTHER Deck instead of spending it.",
      mother3: "Instead, the first MOTHER use each sector reduces spent MOTHER by 1.",
      mother5: "Disabled during Gates." }
  ];

  return {
    icons: ICONS,
    crew: CREW,
    sector1Stars: SECTOR1_STARS,
    sector2Stars: SECTOR2_STARS,
    sector3Stars: SECTOR3_STARS,
    gates: GATES,
    chambers: CHAMBERS,
    sectorOrder: ["sector1", "sector2", "sector3"],
    starting: { hull: 5, fuel: 3, parts: 0, motherCards: 6 },
    distanceLabel: distanceLabel
  };
}());
