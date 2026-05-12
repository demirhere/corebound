import type {
  BoardState,
  Card,
  CardBlueprint,
  GamePlayer,
} from './types'
import { crewArt, driftArt, gateArt, motherArt, resourceArt, sectorDeckArt } from './blueprints/art'
import { createMotherDeck, createResourceDeck } from './blueprints/factories'
import { cryoCrewDeck, startingCrewCards } from './blueprints/crewDecks'
import { damageDeck } from './blueprints/damageDeck'
import { driftDeck } from './blueprints/driftDeck'
import { missionDeck } from './blueprints/missionDeck'
import { sectorGates } from './blueprints/sectorGates'
import {
  CRYO_DECK_ID,
  DAMAGE_DECK_ID,
  DRIFT_DECK_ID,
  FUEL_DISCARD_DECK_ID,
  FUEL_DECK_ID,
  GATE_DECK_ID,
  MISSION_DECK_ID,
  MOTHER_DECK_ID,
  SCRAP_DECK_ID,
  SCRAP_DISCARD_DECK_ID,
  SHIP_PART_DECK_ID,
  automaticRewardDeckDraw,
  manualDeckDraw,
} from './decks'
import {
  cardContent,
  cardRulesText,
  turnStartCrewDrawnEvent,
} from './logEvents'
import type { PlaytestLogEvent } from './playtestLog'
import { STARTING_FUEL_SUPPLY } from './economyTuning'
import { shipPartDeck } from './shipParts'
import { shipPartCatalog } from './shipPartCatalog'

const FUEL_DECK_SIZE = 50
const RESOURCE_DECK_SIZE = STARTING_FUEL_SUPPLY + FUEL_DECK_SIZE
const SCRAP_DECK_SIZE = 80
// MOTHER, damage, stress and drift are temporarily disabled while the open-
// mission economy is being tuned. Set deck sizes to 0 to keep the wiring
// intact but invisible to players.
const MOTHER_DECK_SIZE = 0
const STARTING_CREW_CARD_COUNT = 5
export const TOTAL_SECTORS = 10
export const SOLO_PLAYER_ID = 'solo'
export const SOLO_PLAYER: GamePlayer = {
  id: SOLO_PLAYER_ID,
  name: 'Solo',
}
export const MAP_SLOT_COUNT = 3
export const ROUTE_SLOT_COUNT = 3
export const MAP_SLOT_POSITIONS = [
  { x: 45, y: 8 },
  { x: 58, y: 8 },
  { x: 71, y: 8 },
] as const
export const MISSION_DECK_POSITION = {
  x: 32,
  y: 8,
}
export const TRAVELED_STOP_POSITIONS = [
  { x: 56, y: 39 },
  { x: 61, y: 47 },
  { x: 66, y: 55 },
] as const
export const FUEL_SUPPLY_STACK_ID = 'stack-fuel-supply'
export const FUEL_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 24,
}
export const SCRAP_SUPPLY_STACK_ID = 'stack-scrap-supply'
export const SCRAP_SUPPLY_STACK_POSITION = {
  x: 27,
  y: 24,
}
// Joker Ship Parts shelf — column on the right edge of the board, one
// stack per active slot (max 5 simultaneous).
export const SHIP_PART_SHELF_POSITIONS = [
  { x: 88, y: 22 },
  { x: 88, y: 32 },
  { x: 88, y: 42 },
  { x: 88, y: 52 },
  { x: 88, y: 62 },
] as const
export function getShipPartShelfPosition(index: number) {
  return SHIP_PART_SHELF_POSITIONS[index] ?? SHIP_PART_SHELF_POSITIONS[SHIP_PART_SHELF_POSITIONS.length - 1]!
}
export const MOTHER_SUPPLY_STACK_ID = 'stack-mother-supply'
export const MOTHER_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 40,
}
export const SECTOR_GATE_STACK_POSITION = {
  x: 40,
  y: 24,
}
const OFFSCREEN_DECK_POSITION = {
  x: -30,
  y: -30,
}

function shuffleCards<T>(cards: readonly T[]) {
  const shuffled = [...cards]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    const swap = shuffled[swapIndex]

    if (current !== undefined && swap !== undefined) {
      shuffled[index] = swap
      shuffled[swapIndex] = current
    }
  }

  return shuffled
}

function createBoardCards(prefix: string, blueprints: readonly CardBlueprint[], faceUp = true) {
  return blueprints.map<Card>((blueprint, index) => ({
    ...blueprint,
    id: `${prefix}-${index + 1}`,
    faceUp,
  }))
}

function setupDeckCreatedEvent(deckId: string, deckTitle: string, cards: readonly CardBlueprint[]): PlaytestLogEvent {
  const cardSummaries = cards.map((card) => `${card.title}${cardRulesText(card) ? ` [${cardRulesText(card)}]` : ''}`)

  return {
    type: 'setup.deck.created',
    message: `${deckTitle} setup with ${cards.length} cards: ${cardSummaries.join('; ')}.`,
    details: {
      deckId,
      deckTitle,
      cardCount: cards.length,
      cardSummaries,
      cardContents: cards.map(cardContent),
    },
  }
}

function setupResourceDrawnEvent(card: Card, deckTitle: string, drawIndex: number): PlaytestLogEvent {
  return {
    type: 'setup.resource.drawn_first_pass',
    message: `${card.title} (${card.id}) drawn from ${deckTitle} during setup first pass.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardContent: cardContent(card),
      deckTitle,
      drawIndex,
    },
  }
}

function setupCrewDealtEvent(card: Card, handIndex: number, owner: GamePlayer | null): PlaytestLogEvent {
  const rulesText = cardRulesText(card)
  const ownerText = owner ? ` to ${owner.name}` : ''

  return {
    type: 'setup.crew.dealt',
    message: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''} dealt${ownerText} as starting crew.`,
    details: {
      cardId: card.id,
      cardTitle: card.title,
      cardSummary: `${card.title} (${card.id})${rulesText ? ` [${rulesText}]` : ''}`,
      cardContent: cardContent(card),
      handIndex,
      ownerId: owner?.id ?? null,
      ownerName: owner?.name ?? null,
    },
  }
}

function setupGatePlacedEvent(card: Card, stackId: string): PlaytestLogEvent {
  const gateTitle = `${card.title} Final Gate`

  return {
    type: 'setup.gate.placed_face_up',
    message: `${gateTitle} (${card.id}) placed face up and attemptable anytime.`,
    details: {
      cardId: card.id,
      cardTitle: gateTitle,
      cardSummary: `${gateTitle} (${card.id}) face up`,
      stackId,
      faceUp: card.faceUp,
    },
  }
}

export function createSectorMissionDeckCards() {
  return shuffleCards(missionDeck).slice(0, MAP_SLOT_COUNT)
}

export function createShipPartDeckCards() {
  return shuffleCards(shipPartDeck)
}

export function createDriftDeckCards() {
  return shuffleCards(driftDeck)
}

export function createGateDeckCards() {
  // Pick TOTAL_SECTORS gates from the master pool, then order them easiest
  // → hardest by Fuel cost so the run ramps in difficulty across sectors.
  // The unselected gates stay out of play for this run.
  const picked = shuffleCards(sectorGates).slice(0, TOTAL_SECTORS)
  return [...picked].sort(
    (a, b) => (a.gate?.need.fuel ?? 0) - (b.gate?.need.fuel ?? 0),
  )
}

export function createDamageDeckCards() {
  return shuffleCards(damageDeck)
}

export function getSectorName(sector: number) {
  return `Sector ${sector}`
}

export function getSectorDeckTitle(sector: number) {
  return `${getSectorName(sector)} Missions`
}

export function getSectorDeckArt(sector: number) {
  return sectorDeckArt[sector] ?? sectorDeckArt[1]
}

export type InitialBoardSetup = {
  board: BoardState
  predealBoard: BoardState
  events: PlaytestLogEvent[]
}

function normalizeSetupPlayers(players: readonly GamePlayer[] | undefined) {
  const uniquePlayers: GamePlayer[] = []
  const seenPlayerIds = new Set<string>()

  for (const player of players ?? []) {
    const id = player.id.trim()

    if (!id || seenPlayerIds.has(id)) {
      continue
    }

    seenPlayerIds.add(id)
    uniquePlayers.push({
      id,
      name: player.name.trim() || `Player ${uniquePlayers.length + 1}`,
    })
  }

  return uniquePlayers.length > 0 ? uniquePlayers : [SOLO_PLAYER]
}

function createStartingCrewDeal(players: readonly GamePlayer[], shuffledCryoCrewDeck: readonly CardBlueprint[]) {
  const startingCrewBlueprints = startingCrewCards.slice(0, STARTING_CREW_CARD_COUNT)

  if (players.length <= 1) {
    return {
      startingCrewBlueprints,
      cryoDeckCards: [...shuffledCryoCrewDeck],
    }
  }

  const cardsPerPlayer = Math.ceil(startingCrewBlueprints.length / players.length)
  const totalStartingCrewCount = cardsPerPlayer * players.length
  const extraCrewCount = Math.max(0, totalStartingCrewCount - startingCrewBlueprints.length)

  return {
    startingCrewBlueprints: [
      ...startingCrewBlueprints,
      ...shuffledCryoCrewDeck.slice(0, extraCrewCount),
    ],
    cryoDeckCards: shuffledCryoCrewDeck.slice(extraCrewCount),
  }
}

export function createInitialBoardSetup(players?: readonly GamePlayer[]): InitialBoardSetup {
  const setupPlayers = normalizeSetupPlayers(players)
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const scrapDeckCards = shuffleCards(createResourceDeck('scrap', SCRAP_DECK_SIZE))
  const motherDeckCards = createMotherDeck(MOTHER_DECK_SIZE)
  const shuffledCryoCrewDeck = shuffleCards([
    ...startingCrewCards.slice(STARTING_CREW_CARD_COUNT),
    ...cryoCrewDeck,
  ])
  const startingCrewDeal = createStartingCrewDeal(setupPlayers, shuffledCryoCrewDeck)
  const driftDeckCards = createDriftDeckCards()
  const gateDeckCards = createGateDeckCards()
  const damageDeckCards = createDamageDeckCards()
  // const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, STARTING_FUEL_SUPPLY))
  // const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewDeal.startingCrewBlueprints)
  const cryoDeckCards = startingCrewDeal.cryoDeckCards
  // Hand starts at the size cap (5 starters). The continuous Balatro-style
  // cycle refills from Cryo after each action — no separate first-turn draw.
  const firstTurnCrewCards: Card[] = []
  const remainingCryoDeckCards = cryoDeckCards
  const readyCrewCards = [...handCards, ...firstTurnCrewCards]
  const crewOwnerEntries = readyCrewCards.map((card, index) => {
    const owner = setupPlayers[index % setupPlayers.length] ?? setupPlayers[0]

    return [card.id, owner?.id ?? SOLO_PLAYER_ID] as const
  })
  const [gateCard] = createBoardCards('gate-1', gateDeckCards.slice(0, 1))
  const remainingGateDeckCards = gateDeckCards.slice(gateCard ? 1 : 0)
  const fuelDeckCards = fuelDeck.slice(STARTING_FUEL_SUPPLY)
  // const hullDeckCards = hullDeck.slice(4)
  const missionDeckCards = createSectorMissionDeckCards()
  const shipPartDeckCards = createShipPartDeckCards()

  const initialCards = [
    ...initialFuelCards,
    ...readyCrewCards,
    ...(gateCard ? [gateCard] : []),
  ]
  const initialSectorDeckArt = getSectorDeckArt(1)

  const board: BoardState = {
    cards: Object.fromEntries(initialCards.map((card) => [card.id, card])),
    stacks: [
      {
        id: FUEL_SUPPLY_STACK_ID,
        cardIds: initialFuelCards.map((card) => card.id),
        x: FUEL_SUPPLY_STACK_POSITION.x,
        y: FUEL_SUPPLY_STACK_POSITION.y,
        z: 1011,
      },
      {
        id: SCRAP_SUPPLY_STACK_ID,
        cardIds: [],
        x: SCRAP_SUPPLY_STACK_POSITION.x,
        y: SCRAP_SUPPLY_STACK_POSITION.y,
        z: 1010,
      },
      ...(gateCard
        ? [
            {
              id: 'stack-sector-gate',
              cardIds: [gateCard.id],
              x: SECTOR_GATE_STACK_POSITION.x,
              y: SECTOR_GATE_STACK_POSITION.y,
              z: 1020,
            },
          ]
        : []),
    ],
    decks: [
      {
        id: FUEL_DECK_ID,
        title: 'Fuel Deck',
        icon: resourceArt.fuel.icon,
        hue: resourceArt.fuel.hue,
        accent: resourceArt.fuel.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1012,
        draw: automaticRewardDeckDraw,
        cards: fuelDeckCards,
      },
      {
        id: FUEL_DISCARD_DECK_ID,
        title: 'Fuel Discard',
        icon: resourceArt.fuel.icon,
        hue: resourceArt.fuel.hue,
        accent: resourceArt.fuel.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1011,
        draw: automaticRewardDeckDraw,
        cards: [],
      },
      {
        id: SCRAP_DECK_ID,
        title: 'Scrap Deck',
        icon: resourceArt.scrap.icon,
        hue: resourceArt.scrap.hue,
        accent: resourceArt.scrap.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1010,
        draw: automaticRewardDeckDraw,
        cards: scrapDeckCards,
      },
      {
        id: SCRAP_DISCARD_DECK_ID,
        title: 'Scrap Discard',
        icon: resourceArt.scrap.icon,
        hue: resourceArt.scrap.hue,
        accent: resourceArt.scrap.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1009,
        draw: automaticRewardDeckDraw,
        cards: [],
      },
      {
        id: MISSION_DECK_ID,
        title: getSectorDeckTitle(1),
        icon: initialSectorDeckArt.icon,
        hue: initialSectorDeckArt.hue,
        accent: initialSectorDeckArt.accent,
        x: MISSION_DECK_POSITION.x,
        y: MISSION_DECK_POSITION.y,
        z: 1014,
        draw: manualDeckDraw,
        cards: missionDeckCards,
      },
      {
        id: SHIP_PART_DECK_ID,
        title: 'Ship Parts',
        icon: 'hex',
        hue: 128,
        accent: '#70c58c',
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1015,
        draw: automaticRewardDeckDraw,
        cards: shipPartDeckCards,
      },
      {
        id: MOTHER_DECK_ID,
        title: 'MOTHER Deck',
        icon: motherArt.icon,
        hue: motherArt.hue,
        accent: motherArt.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1013,
        draw: manualDeckDraw,
        cards: motherDeckCards,
      },
      {
        id: CRYO_DECK_ID,
        title: 'Cryo Deck',
        icon: crewArt.icon,
        hue: crewArt.hue,
        accent: crewArt.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1016,
        draw: automaticRewardDeckDraw,
        cards: remainingCryoDeckCards,
      },
      {
        id: DRIFT_DECK_ID,
        title: 'Drift Deck',
        icon: driftArt.icon,
        hue: driftArt.hue,
        accent: driftArt.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1018,
        draw: automaticRewardDeckDraw,
        cards: driftDeckCards,
      },
      {
        id: GATE_DECK_ID,
        title: 'Gate Deck',
        icon: gateArt.icon,
        hue: gateArt.hue,
        accent: gateArt.accent,
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1019,
        draw: automaticRewardDeckDraw,
        cards: remainingGateDeckCards,
      },
      {
        id: DAMAGE_DECK_ID,
        title: 'Damage Deck',
        icon: 'crosshair',
        hue: 356,
        accent: '#ff6f7d',
        x: OFFSCREEN_DECK_POSITION.x,
        y: OFFSCREEN_DECK_POSITION.y,
        z: 1020,
        draw: automaticRewardDeckDraw,
        cards: damageDeckCards,
      },
    ],
    mapSlots: Array.from(
      { length: MAP_SLOT_COUNT },
      () => null,
    ),
    routeSlots: Array.from({ length: ROUTE_SLOT_COUNT }, () => null),
    shipPartSlots: [],
    activeShipParts: [],
    shipPartShopPool: [...shipPartCatalog],
    archivedRouteCardIds: [],
    handCardIds: readyCrewCards.map((card) => card.id),
    tiredCardIds: [],
    roundStartTiredCardIds: [],
    completedStarSummaries: [],
    pendingWakeChoice: null,
    pendingScoutChoice: null,
    pendingShipPartChoice: null,
    pendingResearchChoice: null,
    pendingDrift: null,
    forcedDestinationCardId: null,
    pendingEffects: [],
    turnNumber: 1,
    turnPlayerIndex: 0,
    currentPlayerId: setupPlayers[0]?.id ?? null,
    sectorDrawnThisTurn: false,
    traveledThisTurn: false,
    gateStartedSector: null,
    heldDriftCount: 0,
    stressCount: 0,
    scraps: 0,
    currentSector: 1,
    totalSectors: TOTAL_SECTORS,
    isRunEnding: false,
    hasArrived: false,
    lossReason: null,
    topZ: 1020,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    players: setupPlayers,
    crewOwnerIds: Object.fromEntries(crewOwnerEntries),
    discoveryOwnerIds: {},
    patternUsageCounts: {},
    missionsCompletedCount: 0,
    lastPatternPlayed: null,
    patternStreakCount: 0,
  }
  const predealBoard: BoardState = {
    ...board,
    cards: {},
    stacks: [],
    decks: board.decks.map((deck) => {
      if (deck.id === FUEL_DECK_ID) {
        return { ...deck, cards: fuelDeck }
      }

      if (deck.id === MISSION_DECK_ID) {
        return {
          ...deck,
          cards: missionDeckCards,
        }
      }

      if (deck.id === SHIP_PART_DECK_ID) {
        return { ...deck, cards: shipPartDeckCards }
      }

      if (deck.id === CRYO_DECK_ID) {
        return { ...deck, cards: [...startingCrewDeal.startingCrewBlueprints, ...cryoDeckCards] }
      }

      if (deck.id === GATE_DECK_ID) {
        return { ...deck, cards: gateDeckCards }
      }

      if (deck.id === DAMAGE_DECK_ID) {
        return { ...deck, cards: damageDeckCards }
      }

      return deck
    }),
    mapSlots: Array.from({ length: MAP_SLOT_COUNT }, () => null),
    handCardIds: [],
    tiredCardIds: [],
    roundStartTiredCardIds: [],
    forcedDestinationCardId: null,
    heldDriftCount: 0,
    topZ: board.decks.reduce((topZ, deck) => Math.max(topZ, deck.z), 0),
  }

  return {
    board,
    predealBoard,
    events: [
      setupDeckCreatedEvent(FUEL_DECK_ID, 'Fuel Deck', fuelDeckCards),
      setupDeckCreatedEvent(SCRAP_DECK_ID, 'Scrap Deck', scrapDeckCards),
      setupDeckCreatedEvent(MOTHER_DECK_ID, 'MOTHER Deck', motherDeckCards),
      // setupDeckCreatedEvent('hull-deck', 'Hull Deck', hullDeckCards),
      setupDeckCreatedEvent(MISSION_DECK_ID, 'Missions', missionDeckCards),
      setupDeckCreatedEvent(SHIP_PART_DECK_ID, 'Ship Parts', shipPartDeckCards),
      setupDeckCreatedEvent(CRYO_DECK_ID, 'Cryo Deck', remainingCryoDeckCards),
      setupDeckCreatedEvent(DRIFT_DECK_ID, 'Drift Deck', driftDeckCards),
      setupDeckCreatedEvent(GATE_DECK_ID, 'Gate Deck', remainingGateDeckCards),
      setupDeckCreatedEvent(DAMAGE_DECK_ID, 'Damage Deck', damageDeckCards),
      ...(gateCard ? [setupGatePlacedEvent(gateCard, 'stack-sector-gate')] : []),
      ...initialFuelCards.map((card, index) => setupResourceDrawnEvent(card, 'Fuel Deck', index + 1)),
      // ...initialHullCards.map((card, index) => setupResourceDrawnEvent(card, 'Hull Deck', index + 1)),
      ...handCards.map((card, index) => (
        setupCrewDealtEvent(
          card,
          index + 1,
          setupPlayers.find((player) => player.id === crewOwnerEntries[index]?.[1]) ?? null,
        )
      )),
      ...firstTurnCrewCards.map((card) => {
        const cryoDeck = board.decks.find((deck) => deck.id === CRYO_DECK_ID)

        return cryoDeck
          ? turnStartCrewDrawnEvent(card, { ...cryoDeck, cards: cryoDeckCards }, setupPlayers[0]?.name ?? null)
          : setupCrewDealtEvent(card, handCards.length + 1, setupPlayers[0] ?? null)
      }),
    ],
  }
}

export function createInitialBoard(): BoardState {
  return createInitialBoardSetup().board
}
