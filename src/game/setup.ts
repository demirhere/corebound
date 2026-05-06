import type {
  BoardState,
  Card,
  CardBlueprint,
  GamePlayer,
} from './types'
import { crewArt, discoveryArt, driftArt, gateArt, motherArt, resourceArt, sectorDeckArt } from './blueprints/art'
import { createMotherDeck, createResourceDeck } from './blueprints/factories'
import { cryoCrewDeck, startingCrewCards } from './blueprints/crewDecks'
import { damageDeck } from './blueprints/damageDeck'
import { discoveryDeck } from './blueprints/discoveryDeck'
import { driftDeck } from './blueprints/driftDeck'
import { horizonDeck } from './blueprints/horizonDeck'
import { sectorGates } from './blueprints/sectorGates'
import {
  CRYO_DECK_ID,
  DAMAGE_DECK_ID,
  DISCOVERY_DECK_ID,
  DRIFT_DECK_ID,
  FUEL_DECK_ID,
  GATE_DECK_ID,
  HORIZON_DECK_ID,
  MOTHER_DECK_ID,
  automaticRewardDeckDraw,
  manualDeckDraw,
} from './decks'
import { cardContent, cardRulesText } from './logEvents'
import type { PlaytestLogEvent } from './playtestLog'

const RESOURCE_DECK_SIZE = 12
const MOTHER_DECK_SIZE = 6
export const TOTAL_SECTORS = 2
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
export const TRAVELED_STOP_POSITIONS = [
  { x: 56, y: 39 },
  { x: 61, y: 47 },
  { x: 66, y: 55 },
] as const
export const FUEL_SUPPLY_STACK_ID = 'stack-fuel-supply'
export const FUEL_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 40,
}
export const MOTHER_SUPPLY_STACK_ID = 'stack-mother-supply'
export const MOTHER_SUPPLY_STACK_POSITION = {
  x: 15,
  y: 40,
}
export const SECTOR_GATE_STACK_POSITION = {
  x: 85,
  y: 40,
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

export function createSectorHorizonDeckCards() {
  return shuffleCards(horizonDeck)
}

export function createDriftDeckCards() {
  return shuffleCards(driftDeck)
}

export function createGateDeckCards() {
  return shuffleCards(sectorGates)
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
  if (players.length <= 1) {
    return {
      startingCrewBlueprints: startingCrewCards,
      cryoDeckCards: [...shuffledCryoCrewDeck],
    }
  }

  const cardsPerPlayer = Math.ceil(startingCrewCards.length / players.length)
  const totalStartingCrewCount = cardsPerPlayer * players.length
  const extraCrewCount = Math.max(0, totalStartingCrewCount - startingCrewCards.length)

  return {
    startingCrewBlueprints: [
      ...startingCrewCards,
      ...shuffledCryoCrewDeck.slice(0, extraCrewCount),
    ],
    cryoDeckCards: shuffledCryoCrewDeck.slice(extraCrewCount),
  }
}

export function createInitialBoardSetup(players?: readonly GamePlayer[]): InitialBoardSetup {
  const setupPlayers = normalizeSetupPlayers(players)
  const fuelDeck = shuffleCards(createResourceDeck('fuel', RESOURCE_DECK_SIZE))
  const motherDeckCards = createMotherDeck(MOTHER_DECK_SIZE)
  const shuffledCryoCrewDeck = shuffleCards(cryoCrewDeck)
  const startingCrewDeal = createStartingCrewDeal(setupPlayers, shuffledCryoCrewDeck)
  const discoveryDeckCards = shuffleCards(discoveryDeck)
  const driftDeckCards = createDriftDeckCards()
  const gateDeckCards = createGateDeckCards()
  const damageDeckCards = createDamageDeckCards()
  // const hullDeck = shuffleCards(createResourceDeck('hull', RESOURCE_DECK_SIZE))
  const initialFuelCards = createBoardCards('fuel-start', fuelDeck.slice(0, 2))
  // const initialHullCards = createBoardCards('hull-start', hullDeck.slice(0, 4))
  const handCards = createBoardCards('crew-hand', startingCrewDeal.startingCrewBlueprints)
  const crewOwnerEntries = handCards.map((card, index) => {
    const owner = setupPlayers[index % setupPlayers.length] ?? setupPlayers[0]

    return [card.id, owner?.id ?? SOLO_PLAYER_ID] as const
  })
  const [gateCard] = createBoardCards('gate-1', gateDeckCards.slice(0, 1))
  const remainingGateDeckCards = gateDeckCards.slice(gateCard ? 1 : 0)
  const fuelDeckCards = fuelDeck.slice(2)
  // const hullDeckCards = hullDeck.slice(4)
  const horizonDeckCards = createSectorHorizonDeckCards()

  const initialCards = [
    ...initialFuelCards,
    ...handCards,
    ...(gateCard ? [gateCard] : []),
  ]
  const cryoDeckCards = startingCrewDeal.cryoDeckCards
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
        x: 3,
        y: 40,
        z: 1012,
        draw: automaticRewardDeckDraw,
        cards: fuelDeckCards,
      },
      {
        id: HORIZON_DECK_ID,
        title: gateCard ? `${gateCard.title} Missions` : getSectorDeckTitle(1),
        icon: initialSectorDeckArt.icon,
        hue: initialSectorDeckArt.hue,
        accent: initialSectorDeckArt.accent,
        x: 85,
        y: 8,
        z: 1014,
        draw: {
          ...manualDeckDraw,
          count: MAP_SLOT_COUNT,
          placement: 'nearby',
        },
        cards: horizonDeckCards,
      },
      {
        id: MOTHER_DECK_ID,
        title: 'MOTHER Deck',
        icon: motherArt.icon,
        hue: motherArt.hue,
        accent: motherArt.accent,
        x: 3,
        y: 8,
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
        x: 39,
        y: 8,
        z: 1016,
        draw: automaticRewardDeckDraw,
        cards: cryoDeckCards,
      },
      {
        id: DISCOVERY_DECK_ID,
        title: 'Discovery Deck',
        icon: discoveryArt.icon,
        hue: discoveryArt.hue,
        accent: discoveryArt.accent,
        x: 15,
        y: 8,
        z: 1015,
        draw: automaticRewardDeckDraw,
        cards: discoveryDeckCards,
      },
      {
        id: DRIFT_DECK_ID,
        title: 'Drift Deck',
        icon: driftArt.icon,
        hue: driftArt.hue,
        accent: driftArt.accent,
        x: 27,
        y: 8,
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
        x: 51,
        y: 8,
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
        x: 63,
        y: 8,
        z: 1020,
        draw: automaticRewardDeckDraw,
        cards: damageDeckCards,
      },
    ],
    mapSlots: Array.from({ length: MAP_SLOT_COUNT }, () => null),
    routeSlots: Array.from({ length: ROUTE_SLOT_COUNT }, () => null),
    shipPartSlots: [],
    archivedRouteCardIds: [],
    handCardIds: handCards.map((card) => card.id),
    tiredCardIds: [],
    roundStartTiredCardIds: [],
    completedStarSummaries: [],
    pendingWakeChoice: null,
    pendingScoutChoice: null,
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
    currentSector: 1,
    totalSectors: TOTAL_SECTORS,
    hasArrived: false,
    lossReason: null,
    topZ: 1020,
    nextCardId: 1,
    dropTargetStackId: null,
    dropTargetDeckId: null,
    players: setupPlayers,
    crewOwnerIds: Object.fromEntries(crewOwnerEntries),
    discoveryOwnerIds: {},
  }
  const predealBoard: BoardState = {
    ...board,
    cards: {},
    stacks: [],
    decks: board.decks.map((deck) => {
      if (deck.id === FUEL_DECK_ID) {
        return { ...deck, cards: fuelDeck }
      }

      if (deck.id === HORIZON_DECK_ID) {
        return {
          ...deck,
          cards: horizonDeckCards,
        }
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
      setupDeckCreatedEvent(MOTHER_DECK_ID, 'MOTHER Deck', motherDeckCards),
      // setupDeckCreatedEvent('hull-deck', 'Hull Deck', hullDeckCards),
      setupDeckCreatedEvent(HORIZON_DECK_ID, gateCard ? `${gateCard.title} Missions` : getSectorDeckTitle(1), horizonDeckCards),
      setupDeckCreatedEvent(CRYO_DECK_ID, 'Cryo Deck', cryoDeckCards),
      setupDeckCreatedEvent(DISCOVERY_DECK_ID, 'Discovery Deck', discoveryDeckCards),
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
    ],
  }
}

export function createInitialBoard(): BoardState {
  return createInitialBoardSetup().board
}
