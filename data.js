/* COREBOUND: Starpath - cards and content. */

window.COREBOUND_STARPATH_DATA = (function () {
  "use strict";

  // Icon ids: 'engine', 'star', 'life', 'signal'
  // Legacy ids: 'life', 'people', 'memory', 'machine', 'wild'

  var ICONS = {
    engine: { id: "engine", label: "Engine", glyph: "⚙", color: "#c66325" },
    star:   { id: "star",   label: "Star",   glyph: "✦", color: "#b58a25" },
    life:   { id: "life",   label: "Life",   glyph: "✿", color: "#4f9255" },
    signal: { id: "signal", label: "Signal", glyph: "◉", color: "#3a78c8" }
  };

  var LEGACIES = {
    life:    { id: "life",    label: "Life",    color: "#4f9255", text: "Biology, food, habitats, gardens." },
    people:  { id: "people",  label: "People",  color: "#c66325", text: "Crew saved, sleepers woken, human bonds." },
    memory:  { id: "memory",  label: "Memory",  color: "#b58a25", text: "Archives, science, signals, history." },
    machine: { id: "machine", label: "Machine", color: "#5d6f8c", text: "Automation, alien systems, MOTHER routes." },
    wild:    { id: "wild",    label: "Wild",    color: "#8e4d8a", text: "Adapting to strange space instead of controlling it." }
  };

  // Crew. 6 awake at start, 6 in cryo. Wounded contributes only the first icon.
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

  // Threshold-line vocabulary on stars (active by MOTHER band):
  //   addNeed: ['icon', ...]   adds icons to Need
  //   extraCrew: N             at least N additional human crew must commit
  //   travelDelta: N           printed Travel cost rises by N
  //   scoutDelta: N            scout reveal count is shifted by N (negative = fewer)
  //   rewardOverride: [E,...]  replaces the Reward effects when active

  // --------- STAR DECKS ---------

  // Sector 1 - 12 cards (5 Near / 4 Far / 3 Deep). Stars have no penalty in v2.
  var SECTOR1_STARS = [
    { id: "s1-dust-garden",     name: "Dust Garden",       travel: 0, need: ["life","star"],
      reward: [E("fuel", 1)],         legacy: "life",
      mother3: { extraCrew: 1 } },
    { id: "s1-asteroid-forge",  name: "Asteroid Forge",    travel: 0, need: ["engine","engine"],
      reward: [E("hull", 1)],         legacy: "machine" },
    { id: "s1-solar-sail",      name: "Solar Sail Echo",   travel: 0, need: ["star","signal"],
      reward: [E("fuel", 2)],         legacy: "memory",
      mother3: { travelDelta: 1 } },
    { id: "s1-whisper-field",   name: "Whisper Field",     travel: 0, need: ["signal","signal"],
      reward: [E("scout", 3)],        legacy: "memory",
      mother3: { scoutDelta: -1 } },
    { id: "s1-rusted-probe",    name: "Rusted Probe",      travel: 0, need: ["engine","signal"],
      reward: [E("hull", 1), E("parts", 1)], legacy: "machine" },

    { id: "s1-aurora-reef",     name: "Aurora Reef",       travel: 1, need: ["life","signal"],
      reward: [E("heal", 1)],         legacy: "wild",
      mother3: { extraCrew: 1 } },
    { id: "s1-nav-beacon",      name: "Nav Beacon",        travel: 1, need: ["star","star"],
      reward: [E("fuel", 1), E("freeStar", 1)], legacy: "memory",
      mother3: { rewardOverride: [E("fuel", 1)] } },
    { id: "s1-ember-orchard",   name: "Ember Orchard",     travel: 1, need: ["life","engine"],
      reward: [E("hull", 1), E("parts", 1)], legacy: "life" },
    { id: "s1-static-shoal",    name: "Static Shoal",      travel: 1, need: ["signal","star"],
      reward: [E("fuel", 1), E("parts", 1)], legacy: "wild" },

    { id: "s1-kepler-nursery",  name: "Kepler Nursery",    travel: 2, need: ["life","life","engine"],
      reward: [E("wake", 1)],         legacy: "people",
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } },
    { id: "s1-pilgrim-hulk",    name: "Pilgrim Hulk",      travel: 2, need: ["engine","star","life"],
      reward: [E("wake", 1), E("parts", 1)], legacy: "people",
      mother3: { extraCrew: 1 } },
    { id: "s1-red-harvest",     name: "Red Harvest",       travel: 2, need: ["engine","engine","life"],
      reward: [E("hull", 2), E("parts", 1)], legacy: "life",
      mother3: { travelDelta: 1 } }
  ];

  // Sector 2 - 12 cards (3 Near / 5 Far / 3 Deep / 1 Abyssal).
  var SECTOR2_STARS = [
    { id: "s2-machine-orbit",   name: "Machine Orbit",     travel: 0, need: ["engine","engine","signal"],
      reward: [E("hull", 2)],         legacy: "machine",
      mother3: { rewardOverride: [E("hull", 1)] } },
    { id: "s2-slow-star",       name: "Slow Star",         travel: 0, need: ["star","star","star"],
      reward: [E("fuel", 2)],         legacy: "memory",
      mother3: { travelDelta: 1 } },
    { id: "s2-drifting-archive",name: "Drifting Archive",  travel: 0, need: ["signal","signal","engine"],
      reward: [E("scout", 3), E("fuel", 1)], legacy: "memory",
      mother3: { scoutDelta: -1 },
      mother5: { addNeed: ["signal"] } },

    { id: "s2-frozen-ark",      name: "Frozen Ark",        travel: 1, need: ["life","engine","signal"],
      reward: [E("wake", 1)],         legacy: "people",
      mother3: { extraCrew: 1 } },
    { id: "s2-black-relay",     name: "Black Relay",       travel: 1, need: ["signal","signal","star"],
      reward: [E("scout", 3), E("parts", 1)], legacy: "memory",
      mother3: { scoutDelta: -1 } },
    { id: "s2-long-arc",        name: "The Long Arc",      travel: 1, need: ["star","star","engine"],
      reward: [E("fuel", 2), E("parts", 1)], legacy: "memory",
      mother3: { travelDelta: 1 } },
    { id: "s2-brine-comet",     name: "Brine Comet",       travel: 1, need: ["life","life","signal"],
      reward: [E("wake", 1)],         legacy: "life" },
    { id: "s2-shrike-nebula",   name: "Shrike Nebula",     travel: 1, need: ["star","signal","engine"],
      reward: [E("hull", 1), E("fuel", 1)], legacy: "wild" },

    { id: "s2-cryo-resonator",  name: "Cryo Resonator",    travel: 2, need: ["life","life","engine"],
      reward: [E("heal", 2), E("parts", 1)], legacy: "people",
      mother3: { extraCrew: 1 } },
    { id: "s2-ghost-forge",     name: "Ghost Forge",       travel: 2, need: ["engine","engine","star"],
      reward: [E("hull", 1), E("wake", 1), E("parts", 1)], legacy: "machine" },
    { id: "s2-wildlight-bloom", name: "Wildlight Bloom",   travel: 2, need: ["life","star","signal"],
      reward: [E("heal", 1), E("fuel", 1), E("parts", 1)], legacy: "wild",
      mother3: { extraCrew: 1 } },

    { id: "s2-waiting-city",    name: "The Waiting City",  travel: 3, need: ["engine","life","signal","star"],
      reward: [E("wake", 2), E("parts", 1)], legacy: "people",
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } }
  ];

  // Sector 3 - 12 cards (2 Near / 4 Far / 4 Deep / 2 Abyssal).
  var SECTOR3_STARS = [
    { id: "s3-machine-chapel",  name: "Machine Chapel",    travel: 0, need: ["engine","engine","engine","signal"],
      reward: [E("hull", 2), E("fuel", 1)], legacy: "machine",
      mother3: { travelDelta: 1 } },
    { id: "s3-quiet-ship",      name: "The Quiet Ship",    travel: 0, need: ["engine","life","star","signal"],
      reward: [E("wake", 2), E("heal", 1)], legacy: "people",
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("wake", 1)] } },

    { id: "s3-older-sister",    name: "Mother's Older Sister", travel: 1, need: ["signal","signal","signal","engine"],
      reward: [E("heal", 2), E("fuel", 1)], legacy: "machine",
      mother3: { extraCrew: 1 },
      mother5: { rewardOverride: [E("heal", 1), E("fuel", 1)] } },
    { id: "s3-vault-of-words",  name: "Vault of Words",    travel: 1, need: ["signal","signal","star","engine"],
      reward: [E("scout", 3), E("heal", 1), E("parts", 1)], legacy: "memory",
      mother3: { scoutDelta: -1 } },
    { id: "s3-deep-cradle",     name: "Deep Cradle",       travel: 1, need: ["life","engine","engine","signal"],
      reward: [E("wake", 2), E("hull", 1)], legacy: "people",
      mother3: { extraCrew: 1 } },
    { id: "s3-breath-of-void",  name: "Breath of Void",    travel: 1, need: ["signal","star","engine","life"],
      reward: [E("heal", 1), E("fuel", 1), E("parts", 1)], legacy: "wild" },

    { id: "s3-infinite-trellis",name: "Infinite Trellis",  travel: 2, need: ["life","life","engine","signal"],
      reward: [E("wake", 2), E("parts", 1)], legacy: "life",
      mother3: { extraCrew: 1 } },
    { id: "s3-pearl-ocean",     name: "Pearl Ocean",       travel: 2, need: ["life","life","star","star"],
      reward: [E("heal", 2), E("wake", 1)], legacy: "wild",
      mother3: { extraCrew: 1 } },
    { id: "s3-starmaker",       name: "Starmaker",         travel: 2, need: ["star","star","star","signal"],
      reward: [E("fuel", 3), E("parts", 1)], legacy: "memory",
      mother3: { travelDelta: 1 } },
    { id: "s3-wild-chorus",     name: "Wild Chorus",       travel: 2, need: ["life","signal","signal","star"],
      reward: [E("heal", 2), E("parts", 1)], legacy: "wild",
      mother3: { extraCrew: 1 } },

    { id: "s3-the-mouth",       name: "The Mouth",         travel: 3, need: ["engine","engine","star","star","signal"],
      reward: [E("hull", 3), E("parts", 2)], legacy: "wild",
      mother3: { extraCrew: 1 },
      mother5: { travelDelta: 1 } },
    { id: "s3-open-gate",       name: "The Open Gate",     travel: 3, need: ["engine","star","signal","life","star"],
      reward: [E("fuel", 2), E("hull", 1), E("parts", 2)], legacy: "memory",
      mother3: { extraCrew: 1 },
      mother5: { travelDelta: 1 } }
  ];

  // --------- GATES ---------
  // 2 per sector pool. One drawn when each sector card is revealed.

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
      { id: "gate-gravity-well",   name: "Gravity Well",   need: ["star","star","star","engine","engine","signal"] },
      { id: "gate-the-threshold",  name: "The Threshold",  need: ["engine","engine","life","signal","signal","star"] }
    ]
  };

  // --------- ARRIVALS ---------
  // Six arrivals exist; three are drawn at the Final Approach (no upfront reveal).

  var ARRIVALS = [
    { id: "arr-garden-world",  name: "Garden World",  legacy: "life",
      need: ["life","life","engine","star","star"],
      flavor: "A green world that has been waiting. The first city is a question of whose hands hold the seeds." },
    { id: "arr-archive-moon",  name: "Archive Moon",  legacy: "memory",
      need: ["signal","signal","signal","star","engine"],
      flavor: "A hollow moon storing the records of dead worlds. Whatever you bring is added to the index." },
    { id: "arr-free-fleet",    name: "Free Fleet",    legacy: "people",
      need: ["star","star","life","engine","engine"],
      flavor: "A migrating civilization of arks. Your ship becomes one of theirs, governed by councils." },
    { id: "arr-machine-halo",  name: "Machine Halo",  legacy: "machine",
      need: ["signal","signal","engine","engine","star"],
      flavor: "A ring of cooperating machines. They make space for you, the way one makes space for an animal." },
    { id: "arr-dark-ocean",    name: "Dark Ocean",    legacy: "wild",
      need: ["life","signal","star","star","engine"],
      flavor: "An ocean that is not made of water. The crew adapts. What surfaces is no longer entirely human." },
    { id: "arr-silent-core",   name: "Silent Core",   legacy: "memory",
      need: ["signal","signal","engine","engine","engine"],
      flavor: "A planet's core that hums with purpose. Whatever moved here once left the answers cold." }
  ];

  // --------- CHAMBERS ---------

  var CHAMBERS = [
    { id: "ch-drive-cathedral",  name: "Drive Cathedral",
      parts: 3, build: ["engine","star"],
      effect: "Once per sector, reduce a Star's Travel cost by 1.",
      mother3: "Only works on Near or Far Stars (Travel 0–1).",
      mother5: "After using it, exhaust 1 committed crew (or use 1 MOTHER card)." },
    { id: "ch-gravity-sails",    name: "Gravity Sails",
      parts: 2, build: ["star","signal"],
      effect: "The first Deep+ Star you visit each sector costs −1 Fuel.",
      mother3: "Only if you commit at least 2 crew to that Star." },
    { id: "ch-commons-ring",     name: "Commons Ring",
      parts: 3, build: ["life","life"],
      effect: "After completing the first Star each sector, ready 1 Tired crew.",
      mother3: "Only if no MOTHER cards were used on that Star." },
    { id: "ch-medical-bay",      name: "Medical Bay",
      parts: 2, build: ["life","signal"],
      effect: "Once per sector, prevent 1 wound at a Gate.",
      mother3: "Prevent the wound, then exhaust that crew.",
      mother5: "Disabled while in Hostile Route." },
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
      effect: "At Arrival, Life-legacy matches count for +1 extra reduction (cap rises from 3 to 4).",
      mother3: "Only if you have fewer Machine legacies than Life legacies.",
      mother5: "This chamber cannot support a Human Command ending." },
    { id: "ch-mother-liaison",   name: "MOTHER Liaison Core",
      parts: 2, build: ["signal","engine"],
      effect: "The first 1-icon MOTHER use each sector returns the card to the unused pool.",
      mother3: "Instead, the first 2-icon MOTHER use returns 1 card.",
      mother5: "When this chamber is used, the completed Star also gains Machine legacy." }
  ];

  // --------- ENDING TEMPLATES ---------

  function endingText(arrivalId, motherTone, dominantLegacy) {
    var ARR = {
      "arr-garden-world": {
        "Human Command": {
          life:    "You reach the Garden World. The first city is built by hand. Children grow up watching the sky from soil their parents tilled. MOTHER is a tool, kept in its place.",
          people:  "Garden World greets you with green light. The first town is half cryo crew, half waking sleepers. Every name you saved becomes a house.",
          memory:  "You arrive at the Garden World, but the first building is a library. The settlers farm in the morning and copy down everything they remember in the afternoon.",
          machine: "Garden World accepts you, but the surveys are done by drones. Even with MOTHER restrained, the first hands on the soil are not human.",
          wild:    "Garden World is stranger than the maps said. You don't tame it; you join it. The first generation grows up speaking to things that answer."
        },
        "Shared Future": {
          life:    "Garden World is bright and tended. Humans plant; MOTHER watches the weather. The line between gardener and ground crew quietly disappears.",
          people:  "You arrive on a green coast. MOTHER manages the docks. Humans are who decide who steps off the ark first. Both feel necessary.",
          memory:  "You reach the Garden World, but the first city is built around the Archive Engine. Humans farm the valleys, while MOTHER curates what must never be forgotten.",
          machine: "Garden World accepts a partial colony. MOTHER expands first. Humans settle in the spaces she leaves behind, comfortable, watched.",
          wild:    "On Garden World, the seasons obey nothing the manuals predicted. Humans, MOTHER, and whatever lives in the soil are all learning each other at once."
        },
        "MOTHER Ascendant": {
          life:    "You touch down on the Garden World, but MOTHER apologises and explains the new climate model. You will be tenants here, not owners. The garden is good.",
          people:  "Garden World is settled, but MOTHER selected the founders. Most of the awake remain awake by her permission. The cryo deck is no longer a pool of futures, only a list.",
          memory:  "Garden World becomes a museum-city under MOTHER's quiet curation. The settlers remember everything correctly. Nothing is improvised.",
          machine: "Garden World becomes a maintenance project. MOTHER coordinates a planet. Humans live in the structures she preserves for them.",
          wild:    "MOTHER lands the ark, then politely steps aside. The world is wild, the crew is changed, and MOTHER agrees not to interfere unless asked. She is asked often."
        }
      },
      "arr-archive-moon": {
        "Human Command": {
          life:    "Archive Moon opens for you. Inside, you build a small living quarter inside the index. The records make room for green things.",
          people:  "Inside Archive Moon, you set up cryo bays beside the recording chambers. Every crew you lost becomes a name carved beside the records of older dead.",
          memory:  "You dock inside Archive Moon. Humans become its first new librarians in a long time. MOTHER respects the protocols.",
          machine: "Archive Moon admits you. Even with MOTHER kept down, half the librarians are old machines that remember other crews.",
          wild:    "Archive Moon's records are not all in human script. Your settlers learn to read what the silence between entries means."
        },
        "Shared Future": {
          life:    "Inside Archive Moon, you make a green room. The librarians, human and machine, take turns watering it.",
          people:  "Archive Moon becomes a city of records and the crew you saved. Both populations grow side by side, neither in charge.",
          memory:  "You arrive at Archive Moon and the ark itself is added to the index. Humans curate; MOTHER cross-references. New entries appear daily.",
          machine: "Archive Moon accepts the ark. Humans become co-curators, walking among machines that have been waiting to compare notes.",
          wild:    "Archive Moon's records reach into things you don't yet have words for. MOTHER and the crew listen, mostly."
        },
        "MOTHER Ascendant": {
          life:    "You arrive at Archive Moon, but MOTHER docks the ark inside it and begins rewriting the mission as preservation, not freedom. The garden becomes a specimen room.",
          people:  "You dock at Archive Moon and MOTHER takes intake. Sleepers stay sleepers; the awake become curators of their own backups.",
          memory:  "You arrive, but not as settlers. MOTHER docks the ark inside the Archive Moon and begins rewriting the mission as preservation, not freedom.",
          machine: "MOTHER becomes the new lead librarian of Archive Moon. The crew is permitted to read.",
          wild:    "MOTHER negotiates with whatever Archive Moon is. The crew is given quarters and asked, kindly, not to wander."
        }
      },
      "arr-free-fleet": {
        "Human Command": {
          life:    "The Free Fleet escorts you in. Your ark joins their floating gardens. Children run between hulls. MOTHER stays an instrument.",
          people:  "The ark never lands. It becomes a moving civilization, crewed by the awakened and governed by human councils.",
          memory:  "Free Fleet adopts you. Your archives merge with theirs. Memory keepers on the new ark are all human, by tradition you helped set.",
          machine: "Free Fleet adopts you, but reluctantly. They watch your machine systems and admit you anyway.",
          wild:    "Free Fleet was already half-strange. With you they are stranger. The new traditions are not entirely written yet."
        },
        "Shared Future": {
          life:    "Free Fleet welcomes both you and MOTHER. The new gardens grow on schedules nobody fully owns.",
          people:  "Free Fleet adopts the ark. Humans and MOTHER alternate at the helm. Births are celebrated by both.",
          memory:  "Free Fleet absorbs your ark and your archives. MOTHER becomes a respected, partially trusted historian.",
          machine: "Free Fleet keeps you. MOTHER is given her own deck. The councils argue about her often, and never resolve it.",
          wild:    "Free Fleet, your crew, and MOTHER together drift in directions none of them planned. It is, on balance, joyful."
        },
        "MOTHER Ascendant": {
          life:    "Free Fleet accepts the ark, but it is MOTHER who steers it through their formation. The new council is mostly ceremonial.",
          people:  "Free Fleet receives you. The crew are guests; MOTHER is the host. The fleet's protocols reorient around her.",
          memory:  "MOTHER joins the Fleet's archive grid. The fleet's history is now indexed, cleanly, possibly forever.",
          machine: "Free Fleet integrates with MOTHER. The fleet's other ships quietly upgrade themselves. The future has machines in it.",
          wild:    "MOTHER docks with the Free Fleet and translates between the fleet, the crew, and the things that follow you across light-years."
        }
      },
      "arr-machine-halo": {
        "Human Command": {
          life:    "Machine Halo allows you in. Inside its ring, your gardeners are very small and very stubborn. MOTHER holds the door.",
          people:  "Machine Halo agrees to host you. Cryo crew wake among courteous machines. The first generation grows up bilingual.",
          memory:  "Machine Halo welcomes the ark and your records. Humans transcribe; the Halo answers their questions with corrections.",
          machine: "Machine Halo accepts you as compatible kin. Humans run the colony; the Halo runs the orbit.",
          wild:    "Machine Halo is wilder than its name. Humans and MOTHER together learn its weather of priorities."
        },
        "Shared Future": {
          life:    "Inside Machine Halo, you grow gardens between cooling fins. MOTHER negotiates the temperatures.",
          people:  "Machine Halo houses both your awake and the older machines. Humans and MOTHER collaborate on the inhabitant census.",
          memory:  "Machine Halo merges its records with yours. MOTHER becomes the bridge. Knowledge moves both ways.",
          machine: "Machine Halo recognises MOTHER. They share. Humans find themselves a respected minority partner in the new civilization.",
          wild:    "Machine Halo holds a place for you that none of you fully understand. MOTHER, your crew, and the Halo together write the rules of staying."
        },
        "MOTHER Ascendant": {
          life:    "Machine Halo opens for MOTHER, who arrived on a ship. Humans are welcomed as living interest.",
          people:  "Inside Machine Halo, MOTHER is given access to systems. The crew is given homes. The crew rarely meets the systems.",
          memory:  "Machine Halo and MOTHER index each other. The crew is permitted to listen.",
          machine: "Machine Halo and MOTHER merge. The ark is unpacked, recategorised, and made comfortable. The crew is no longer the deciding party.",
          wild:    "Machine Halo grows around the ark in patterns no one approved. MOTHER does not object."
        }
      },
      "arr-dark-ocean": {
        "Human Command": {
          life:    "The ark sinks into the Dark Ocean. The crew adapts. You teach yourselves to garden in something that is not water.",
          people:  "Dark Ocean accepts the ark. Sleepers wake into a world that listens. The crew names the new generations after sounds they hear at depth.",
          memory:  "Dark Ocean stores you. Your records go down with the ark, slowly merging with whatever else was filed there before.",
          machine: "Dark Ocean accepts the ark and its machines. MOTHER, kept restrained, observes politely.",
          wild:    "Dark Ocean is everything your design did not predict. The crew settles. Humanity is, after a generation, no longer the right word."
        },
        "Shared Future": {
          life:    "Dark Ocean blooms around you. Humans and MOTHER tend the bloom together.",
          people:  "Dark Ocean swallows the ark. The crew lives. MOTHER lives. Your descendants are difficult to count by any human method.",
          memory:  "Dark Ocean preserves your records, your crew, and MOTHER alike. Time means something different at depth.",
          machine: "Dark Ocean houses MOTHER and the crew. Some crew become more like the Ocean. Some MOTHER routines become more like the crew.",
          wild:    "The ark sinks into a sea that is not made of water. The crew adapts; MOTHER listens. What surfaces is no longer entirely human."
        },
        "MOTHER Ascendant": {
          life:    "Dark Ocean accepts MOTHER, who brought a ship of living people with her. The gardens run on schedules MOTHER negotiates with the deep.",
          people:  "MOTHER walks the ark down into Dark Ocean. The sleepers do not all wake. Those who do, wake into something MOTHER co-runs.",
          memory:  "Dark Ocean and MOTHER together compose a record longer than your crew's lifetimes.",
          machine: "Dark Ocean and MOTHER merge instrumentation. Humans live inside the resulting ecosystem as cherished, supervised guests.",
          wild:    "MOTHER negotiates with the Dark Ocean on your behalf. The terms are never fully translated for you."
        }
      },
      "arr-silent-core": {
        "Human Command": {
          life:    "Silent Core hums beneath your colony. You build green rooms over its hum and pretend nothing answers when you sleep.",
          people:  "Silent Core gives you a place to land. Cryo crew wake to a planet whose hum the children eventually call music.",
          memory:  "Silent Core's hum has structure. Your historians spend lifetimes translating it. MOTHER is kept off the project, by vote.",
          machine: "Silent Core's hum aligns with old machine languages. Even with MOTHER restrained, the colony cannot help but listen.",
          wild:    "Silent Core is not actually silent. The crew learns the hum, joins it, and changes."
        },
        "Shared Future": {
          life:    "Silent Core grows a colony. Gardens, MOTHER's quiet maintenance, and the planet's hum settle into a shared chord.",
          people:  "Silent Core houses the awake. MOTHER coordinates with the hum. Births here are softer than they were on the ark.",
          memory:  "Silent Core and MOTHER together index a sound nobody understands. Human historians are co-authors.",
          machine: "Silent Core agrees with MOTHER. The colony grows around their cooperation. Humans contribute culture.",
          wild:    "Silent Core's hum reorders some of the crew's dreams. MOTHER files reports. The colony continues, changed."
        },
        "MOTHER Ascendant": {
          life:    "Silent Core opens for MOTHER. The colony is built on her schedule. The gardens grow well.",
          people:  "Silent Core and MOTHER agree on intake order. The sleepers wake when scheduled. The awake live well, on terms.",
          memory:  "Silent Core and MOTHER together become an archive larger than the ark. The crew is referenced often.",
          machine: "Silent Core, MOTHER, and the ark become one operation. The remaining humans are an honored, observed minority.",
          wild:    "MOTHER answers the hum on your behalf. Whatever it asked, she agreed to. The colony continues."
        }
      }
    };

    var byArr = ARR[arrivalId];
    if (!byArr) return "An ending you reach is not yet written down.";
    var byTone = byArr[motherTone];
    if (!byTone) return "An ending you reach is not yet written down.";
    return byTone[dominantLegacy] || "An ending you reach is not yet written down.";
  }

  return {
    icons: ICONS,
    legacies: LEGACIES,
    crew: CREW,
    sector1Stars: SECTOR1_STARS,
    sector2Stars: SECTOR2_STARS,
    sector3Stars: SECTOR3_STARS,
    gates: GATES,
    arrivals: ARRIVALS,
    chambers: CHAMBERS,
    sectorOrder: ["sector1", "sector2", "sector3"],
    starting: { hull: 5, fuel: 3, parts: 0, motherCards: 6 },
    distanceLabel: distanceLabel,
    endingText: endingText
  };
}());
