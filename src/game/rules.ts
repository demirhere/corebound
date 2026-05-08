import {
  getDestinationFuelSurcharge,
  getMotherFuelCost,
  isActiveHazardCard,
} from './damage'
import {
  gateBlocksCrewCard,
  gateBlocksDiscoveries,
  gateBlocksMotherIcons,
  getGateExtraCrewSlots,
  getGateMotherFuelCost,
  getGateRequiredIconOptions,
} from './blueprints/sectorGates'
import type { Card, CardBlueprint, Deck, DiscoveryEffectKind, GateDetails, MissionPatternKind, RequirementIconKind, Stack } from './types'

export type MissionStackCompletion = {
  missionCardId: string
  missionCardIndex: number
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  isReady: boolean
  // Set when the mission has pattern: 'open' and the crew satisfies some
  // pattern. The action label and granted Fuel use this dynamic value.
  dynamicFuelReward?: number
  dynamicPattern?: MissionPatternKind
}

export type GateStackCompletion = {
  gateCardId: string
  gateCardIndex: number
  isReady: boolean
  motherSpentTotal: number
  extraHumanCrewRequired: number
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  requiredFuelCount: number
  fuelSpentCount: number
  fuelGeneratedCount: number
}

export type MotherCoveredIcon = RequirementIconKind | 'any' | 'fuel'

type MissionNeedPayment = {
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  fuelMotherCount: number
}

type CrewMotherNeedPayment = {
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  minimumCrewCount: number
}

type GateNeedPayment = CrewMotherNeedPayment & {
  requiredFuelCount: number
  fuelSpentCount: number
  fuelGeneratedCount: number
}

const requirementIconKinds = ['life', 'star', 'engine', 'signal'] as const

// Wild slot (Tachyon Lens): one specific crew counts as if it had all 4
// icons AND counts as matched/mixed for pattern-matching purposes. The
// helpers below accept an optional `wildCardId` to opt into that behavior.

function isMatchedSpecialistCard(card: Card | undefined, wildCardId: string | null = null) {
  if (card?.kind !== 'crew') return false
  if (wildCardId && card.id === wildCardId) return true
  const specs = card.specializations ?? []
  return specs.length === 2 && specs[0] === specs[1]
}

function isMixedCrewCard(card: Card | undefined, wildCardId: string | null = null) {
  if (card?.kind !== 'crew') return false
  if (wildCardId && card.id === wildCardId) return true
  const specs = card.specializations ?? []
  return specs.length === 2 && specs[0] !== specs[1]
}

function crewSpecializations(card: Card | undefined): readonly RequirementIconKind[] {
  return card?.kind === 'crew' ? card.specializations ?? [] : []
}

function crewHasIcon(card: Card | undefined, icon: RequirementIconKind, wildCardId: string | null = null) {
  if (card?.kind !== 'crew') return false
  if (wildCardId && card.id === wildCardId) return true
  return crewSpecializations(card).includes(icon)
}

function crewSharesIconWith(a: Card | undefined, b: Card | undefined, wildCardId: string | null = null) {
  if (a?.kind !== 'crew' || b?.kind !== 'crew') return false
  if (wildCardId && (a.id === wildCardId || b.id === wildCardId)) return true
  const aSpecs = crewSpecializations(a)
  const bSpecs = crewSpecializations(b)
  return aSpecs.some((spec) => bSpecs.includes(spec))
}

function countCrewWithIcon(crewCards: readonly Card[], icon: RequirementIconKind, wildCardId: string | null = null) {
  let count = 0
  for (const card of crewCards) {
    if (crewHasIcon(card, icon, wildCardId)) count += 1
  }
  return count
}

function specialistDistinctIcons(crewCards: readonly Card[], wildCardId: string | null = null) {
  const realIcons = new Set<RequirementIconKind>()
  let hasWild = false
  for (const card of crewCards) {
    if (wildCardId && card.id === wildCardId) {
      hasWild = true
      continue
    }
    if (isMatchedSpecialistCard(card)) {
      const specs = crewSpecializations(card)
      const icon = specs[0]
      if (icon) realIcons.add(icon)
    }
  }
  if (!hasWild) return realIcons
  // The wild slot fills the first icon not already covered (so it
  // contributes a distinct entry whenever possible).
  const filler = requirementIconKinds.find((icon) => !realIcons.has(icon))
  const result = new Set(realIcons)
  if (filler) result.add(filler)
  return result
}

export function getMissionPatternLabel(pattern: MissionPatternKind): string {
  switch (pattern) {
    case 'open': return 'Open'
    case 'cross-trained': return 'Cross-Trained'
    case 'common-ground': return 'Common Ground'
    case 'specialist': return 'Specialist'
    case 'common-knowledge': return 'Common Knowledge'
    case 'department-heads': return 'Department Heads'
    case 'common-cause': return 'Common Cause'
    case 'bridge-crew': return 'Bridge Crew'
  }
}

// Patterns ranked by fuel reward. Joker-economy "tight" rewards: each
// pattern's fuel = sum(crew_ranks) × pattern_mult. With every crew at
// rank 1, the result simplifies to crew_count × mult:
//   Cross-Trained     1 × 1   = 1
//   Common Ground     2 × 1   = 2
//   Specialist        1 × 2   = 2
//   Common Knowledge  3 × 1   = 3
//   Department Heads  2 × 2   = 4
//   Common Cause      4 × 1   = 4
//   Bridge Crew       4 × 1.5 = 6
// On 2-fuel ties, Specialist (1 crew) is more efficient than Common
// Ground (2 crew); on 4-fuel ties, Department Heads (2 crew) beats
// Common Cause (4 crew). Order reflects that.
const PATTERN_FUEL_DESC: readonly { pattern: MissionPatternKind, fuel: number }[] = [
  { pattern: 'bridge-crew',      fuel: 6 },
  { pattern: 'department-heads', fuel: 4 },
  { pattern: 'common-cause',     fuel: 4 },
  { pattern: 'common-knowledge', fuel: 3 },
  { pattern: 'specialist',       fuel: 2 },
  { pattern: 'common-ground',    fuel: 2 },
  { pattern: 'cross-trained',    fuel: 1 },
]

// Largest crew count any pattern uses (Bridge Crew and Common Cause both
// take 4). A 5th crew on a mission pile cannot improve the pattern score,
// so we disallow stacks that exceed this cap to keep mission piles tidy
// and prevent wasted clicks.
export const MAX_CREW_PER_MISSION_PATTERN = 4

export function getMissionPatternFuel(pattern: MissionPatternKind): number {
  if (pattern === 'open') return 0
  return PATTERN_FUEL_DESC.find((entry) => entry.pattern === pattern)?.fuel ?? 0
}

export function findBestPatternForCrew(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  wildCardId: string | null = null,
): { pattern: MissionPatternKind, fuel: number } | null {
  for (const { pattern, fuel } of PATTERN_FUEL_DESC) {
    if (canCompleteHandPattern(crewCardIds, cards, pattern, wildCardId)) {
      return { pattern, fuel }
    }
  }
  return null
}

export function canCompleteHandPattern(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  pattern: MissionPatternKind,
  wildCardId: string | null = null,
): boolean {
  const crewCards = crewCardIds
    .map((id) => cards[id])
    .filter((card): card is Card => card?.kind === 'crew')

  switch (pattern) {
    case 'open':
      // Any crew that satisfies any concrete pattern works.
      return PATTERN_FUEL_DESC.some(({ pattern: p }) => canCompleteHandPattern(crewCardIds, cards, p, wildCardId))
    case 'cross-trained':
      return crewCards.some((card) => isMixedCrewCard(card, wildCardId))
    case 'common-ground':
      for (let i = 0; i < crewCards.length; i++) {
        for (let j = i + 1; j < crewCards.length; j++) {
          if (crewSharesIconWith(crewCards[i], crewCards[j], wildCardId)) return true
        }
      }
      return false
    case 'specialist':
      return crewCards.some((card) => isMatchedSpecialistCard(card, wildCardId))
    case 'common-knowledge':
      return requirementIconKinds.some((icon) => countCrewWithIcon(crewCards, icon, wildCardId) >= 3)
    case 'department-heads':
      return specialistDistinctIcons(crewCards, wildCardId).size >= 2
    case 'common-cause':
      return requirementIconKinds.some((icon) => countCrewWithIcon(crewCards, icon, wildCardId) >= 4)
    case 'bridge-crew':
      return specialistDistinctIcons(crewCards, wildCardId).size === 4
  }
}

type CompletionNeed = {
  icons: readonly RequirementIconKind[]
  any: number
  fuel: number
}

type WaterPairCrewRole = 'mechanic' | 'scientist'

const crewDiscoveryIconsByEffect: Partial<Record<DiscoveryEffectKind, RequirementIconKind>> = {
  crew_nav: 'star',
  crew_engine: 'engine',
  crew_life: 'life',
  crew_science: 'signal',
}

export function getServiceDroneBayCrewReduction(gate: GateDetails, serviceDroneBayCount: number) {
  return Math.min(gate.need.crew, Math.max(0, serviceDroneBayCount))
}

type GateHazardModifiers = {
  ignoredCrewCardIds: Set<string>
  ignoredSingleIconCrewCardIds: Set<string>
  ignoredCrewIconCount: number
  motherCostPerMissingIcon: number
  motherFuelCost: number
  usableMotherCapacity: number
  requiredFuelCount: number
}

export function isDiscoveryEffect(card: Card | undefined, effectKind: string) {
  return card?.kind === 'discovery' && card.discovery?.effectKind === effectKind
}

function isCrewDiscoveryCard(card: Card | undefined) {
  return card?.kind === 'discovery' && card.discovery?.tag === 'crew'
}

function isMissionDiscoveryCard(card: Card | undefined) {
  return card?.kind === 'discovery' && card.discovery?.tag === 'mission'
}

function isGateDiscoveryCard(card: Card | undefined) {
  return card?.kind === 'discovery' && card.discovery?.tag === 'gate'
}

function getCrewDiscoveryIcon(card: Card | undefined): RequirementIconKind | null {
  if (card?.kind !== 'discovery' || card.discovery?.tag !== 'crew') {
    return null
  }

  return crewDiscoveryIconsByEffect[card.discovery.effectKind] ?? null
}

function countDiscoveryEffect(
  cardIds: readonly string[],
  cards: Record<string, Card>,
  effectKind: string,
) {
  return cardIds.reduce((count, cardId) => (
    isDiscoveryEffect(cards[cardId], effectKind) ? count + 1 : count
  ), 0)
}

export function countMissionFuelDiscountDiscoveries(cardIds: readonly string[], cards: Record<string, Card>) {
  return countDiscoveryEffect(cardIds, cards, 'mission_fuel_discount')
}

export function countGateStressClearDiscoveries(cardIds: readonly string[], cards: Record<string, Card>) {
  return countDiscoveryEffect(cardIds, cards, 'gate_clear_stress')
}

export function countGateHazardSkipDiscoveries(cardIds: readonly string[], cards: Record<string, Card>) {
  return countDiscoveryEffect(cardIds, cards, 'gate_skip_hazard')
}

function getContiguousCrewDiscoveryIcons(
  stackCardIds: readonly string[],
  cards: Record<string, Card>,
  startIndex: number,
  direction: -1 | 1,
) {
  const icons: RequirementIconKind[] = []

  for (
    let index = startIndex + direction;
    index >= 0 && index < stackCardIds.length;
    index += direction
  ) {
    const cardId = stackCardIds[index]
    const icon = cardId ? getCrewDiscoveryIcon(cards[cardId]) : null

    if (!icon) {
      break
    }

    icons.push(icon)
  }

  return icons
}

function getPairedCrewDiscoveryIcons(
  crewCardId: string,
  cards: Record<string, Card>,
  stackCardIds: readonly string[] = [],
) {
  const crewIndex = stackCardIds.indexOf(crewCardId)

  if (crewIndex === -1) {
    return []
  }

  const discoveryIconsBelowCrew = getContiguousCrewDiscoveryIcons(stackCardIds, cards, crewIndex, -1)

  return discoveryIconsBelowCrew.length > 0
    ? discoveryIconsBelowCrew
    : getContiguousCrewDiscoveryIcons(stackCardIds, cards, crewIndex, 1)
}

function isPairedCrewDiscoveryIndex(
  index: number,
  stackCardIds: readonly string[],
  cards: Record<string, Card>,
) {
  const cardId = stackCardIds[index]

  if (!cardId || !isCrewDiscoveryCard(cards[cardId])) {
    return false
  }

  function reachesCrew(direction: -1 | 1) {
    for (
      let candidateIndex = index + direction;
      candidateIndex >= 0 && candidateIndex < stackCardIds.length;
      candidateIndex += direction
    ) {
      const candidateCardId = stackCardIds[candidateIndex]
      const candidateCard = candidateCardId ? cards[candidateCardId] : undefined

      if (candidateCard?.kind === 'crew') {
        return true
      }

      if (!isCrewDiscoveryCard(candidateCard)) {
        return false
      }
    }

    return false
  }

  return reachesCrew(1) || reachesCrew(-1)
}

function getCrewSpecializationsForNeed(
  cardId: string,
  cards: Record<string, Card>,
  stackCardIds: readonly string[] = [],
) {
  return [
    ...(cards[cardId]?.specializations ?? []),
    ...getPairedCrewDiscoveryIcons(cardId, cards, stackCardIds),
  ]
}

export function isFaceDownStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === false)
}

export function isFaceUpStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === true)
}

export function isSingleFaceDownCard(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length === 1 && cards[stack.cardIds[0]]?.faceUp === false
}

function iconCrewCardsAreUseful(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  stackCardIds: readonly string[] = [],
) {
  const missingWithAllCrew = getMissingNeedIcons(crewCardIds, cards, icons, any, stackCardIds).length

  return crewCardIds.every((cardId) => {
    const missingWithoutCard = getMissingNeedIcons(
      crewCardIds.filter((candidateId) => candidateId !== cardId),
      cards,
      icons,
      any,
      stackCardIds,
    ).length

    return missingWithoutCard > missingWithAllCrew
  })
}

function getWaterPairCrewRole(card: Card | undefined): WaterPairCrewRole | null {
  if (card?.kind !== 'crew') {
    return null
  }

  const specializations = card.specializations ?? []

  const specializationSet = new Set(specializations)

  if (specializationSet.has('engine') && specializationSet.has('life')) {
    return 'mechanic'
  }

  return specializationSet.has('engine') && specializationSet.has('signal') ? 'scientist' : null
}

function countWaterPairCrewRoles(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
) {
  let mechanicCount = 0
  let scientistCount = 0

  for (const cardId of crewCardIds) {
    const role = getWaterPairCrewRole(cards[cardId])

    if (role === 'mechanic') {
      mechanicCount += 1
    } else if (role === 'scientist') {
      scientistCount += 1
    } else {
      return null
    }
  }

  return { mechanicCount, scientistCount }
}

function canUseWaterSupport(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  fuelCardCount: number,
  requiredFuel: number,
  waterPairFuelAmount = 1,
) {
  const remainingFuel = requiredFuel - fuelCardCount

  if (remainingFuel < 0) {
    return false
  }

  if (remainingFuel === 0) {
    return crewCardIds.length === 0
  }

  const roleCounts = countWaterPairCrewRoles(crewCardIds, cards)

  return Boolean(
    roleCounts &&
      Math.min(roleCounts.mechanicCount, roleCounts.scientistCount) * waterPairFuelAmount >= remainingFuel,
  )
}

function canAssignUsefulSupport(
  crewCardIds: readonly string[],
  fuelCardCount: number,
  motherCount: number,
  cards: Record<string, Card>,
  need: CompletionNeed,
  motherFuelCost = 0,
  stackCardIds: readonly string[] = [],
  waterPairFuelAmount = 1,
) {
  if (fuelCardCount > need.fuel + motherCount * motherFuelCost) {
    return false
  }

  const iconCrewCardIds: string[] = []
  let canAssignSupport = false

  function searchCrewAssignments(index: number) {
    if (canAssignSupport) {
      return
    }

    if (index >= crewCardIds.length) {
      if (!iconCrewCardsAreUseful(iconCrewCardIds, cards, need.icons, need.any, stackCardIds)) {
        return
      }

      const missingIconCount = getMissingNeedIcons(
        iconCrewCardIds,
        cards,
        need.icons,
        need.any,
        stackCardIds,
      ).length
      const iconCrewCardIdSet = new Set(iconCrewCardIds)
      const fuelCrewCardIds = crewCardIds.filter((cardId) => !iconCrewCardIdSet.has(cardId))

      for (let iconMotherCount = 0; iconMotherCount <= Math.min(motherCount, missingIconCount); iconMotherCount += 1) {
        if (
          iconMotherCount === motherCount &&
          canUseWaterSupport(fuelCrewCardIds, cards, fuelCardCount, need.fuel, waterPairFuelAmount)
        ) {
          canAssignSupport = true
          return
        }
      }

      return
    }

    const cardId = crewCardIds[index]

    if (!cardId) {
      searchCrewAssignments(index + 1)
      return
    }

    iconCrewCardIds.push(cardId)
    searchCrewAssignments(index + 1)
    iconCrewCardIds.pop()
    searchCrewAssignments(index + 1)
  }

  searchCrewAssignments(0)

  return canAssignSupport
}

function canStackLegalGateSupport(
  crewCardIds: readonly string[],
  gate: GateDetails,
  fuelCount: number,
  motherCount: number,
  controlConsoleCount: number,
) {
  const maxMotherIconCoverage = Math.max(0, gate.need.icons.length - controlConsoleCount)

  return crewCardIds.length + fuelCount + motherCount > 0 && motherCount <= maxMotherIconCoverage
}

function canUseAllCardsInCompletionStack(
  cardIds: readonly string[],
  cards: Record<string, Card>,
  fuelDiscount: number,
  stressCountBefore: number,
  serviceDroneBayCount: number,
  controlConsoleCount: number,
  availableGateFuelCount: number,
  gateFuelDiscount: number,
  missionAnyIconSurcharge: number,
  waterPairFuelAmount: number,
) {
  let objectiveCard: Card | null = null
  const crewCardIds: string[] = []
  const discoveryCardIds: string[] = []
  let fuelCardCount = 0
  let motherCount = 0

  for (const [index, cardId] of cardIds.entries()) {
    const card = cards[cardId]

    if (!card?.faceUp) {
      return false
    }

    if ((card.kind === 'mission' && card.mission) || (card.kind === 'gate' && card.gate)) {
      if (objectiveCard) {
        return false
      }

      objectiveCard = card
      continue
    }

    if (card.kind === 'crew') {
      crewCardIds.push(card.id)
    } else if (card.kind === 'resource' && card.resource === 'fuel') {
      fuelCardCount += 1
    } else if (isUsableMotherCard(card)) {
      motherCount += 1
    } else if (card.kind === 'discovery') {
      if (card.discovery?.tag === 'crew' && !isPairedCrewDiscoveryIndex(index, cardIds, cards)) {
        return false
      }

      discoveryCardIds.push(card.id)
    } else if (isActiveHazardCard(card)) {
      continue
    } else {
      return false
    }
  }

  if (!objectiveCard || crewCardIds.length + fuelCardCount + motherCount + discoveryCardIds.length === 0) {
    return false
  }

  const discoveryCardsAreLegal = discoveryCardIds.every((cardId) => {
    const discovery = cards[cardId]?.discovery

    if (!discovery) {
      return false
    }

    if (objectiveCard?.kind === 'gate' && objectiveCard.gate && gateBlocksDiscoveries(objectiveCard.gate)) {
      return false
    }

    if (discovery.tag === 'crew') {
      return true
    }

    if (discovery.tag === 'mission') {
      return objectiveCard.kind === 'mission'
    }

    if (discovery.tag === 'gate') {
      return objectiveCard.kind === 'gate'
    }

    return false
  })

  if (!discoveryCardsAreLegal) {
    return false
  }

  if (objectiveCard.kind === 'mission' && objectiveCard.mission) {
    if (objectiveCard.mission.pattern) {
      // Pattern missions accept any crew composition the player builds,
      // but no current pattern uses more than MAX_CREW_PER_MISSION_PATTERN
      // crew, so reject piles that exceed the cap.
      return crewCardIds.length <= MAX_CREW_PER_MISSION_PATTERN
    }

    const missionFuelDiscount = countMissionFuelDiscountDiscoveries(cardIds, cards)
    const fuelSurcharge = getDestinationFuelSurcharge(cards, objectiveCard.mission)
    const canComplete = canAssignUsefulSupport(
      crewCardIds,
      fuelCardCount,
      motherCount,
        cards,
        {
          icons: objectiveCard.mission.need.icons,
          any: missionAnyIconSurcharge,
          fuel: Math.max(0, objectiveCard.mission.need.fuel + fuelSurcharge - fuelDiscount - missionFuelDiscount),
        },
      getMotherFuelCost(cards),
      cardIds,
      waterPairFuelAmount,
    )

    return canComplete || discoveryCardIds.length > 0
  }

  if (objectiveCard.kind === 'gate' && objectiveCard.gate) {
    const gate = objectiveCard.gate

    if (crewCardIds.some((cardId) => gateBlocksCrewCard(gate, cards[cardId]))) {
      return false
    }

    const stressCleared = countGateStressClearDiscoveries(cardIds, cards)
    const hazardSkipCount = countGateHazardSkipDiscoveries(cardIds, cards)
    const effectiveStressCount = Math.max(0, stressCountBefore - stressCleared)
    const allowsGateFuel = gate.need.fuel > 0 ||
      gate.clear.extraFuel > 0 ||
      getMotherFuelCost(cards) + getGateMotherFuelCost(gate) > 0

    if (fuelCardCount > 0 && !allowsGateFuel) {
      return false
    }

    const gatePayment = getGateNeedPayment(
      crewCardIds,
      cards,
      gate,
      effectiveStressCount,
      motherCount,
      fuelCardCount,
      availableGateFuelCount,
      gateFuelDiscount,
      serviceDroneBayCount,
      controlConsoleCount,
      hazardSkipCount,
      0,
      cardIds,
      waterPairFuelAmount,
    )

    return gatePayment !== null || discoveryCardIds.length > 0 || canStackLegalGateSupport(
      crewCardIds,
      gate,
      fuelCardCount,
      motherCount,
      controlConsoleCount,
    )
  }

  return false
}

function canStackAsLoosePile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])

  return (
    stackedCards.every((card) => card?.kind === 'resource' && card.resource === 'fuel') ||
    stackedCards.every((card) => card?.kind === 'resource' && card.resource === 'scrap') ||
    stackedCards.every((card) => card?.kind === 'crew') ||
    stackedCards.every((card) => card?.kind === 'discovery') ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother !== true) ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother === true) ||
    stackedCards.every(
      (card) =>
        card?.kind === 'crew' ||
        card?.kind === 'discovery' ||
        (card?.kind === 'resource' && card.resource === 'fuel') ||
        isUsableMotherCard(card),
    )
  )
}

function canStackAsShipPartPile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])

  return stackedCards.every((card) => card?.kind === 'active-ship-part')
}

function canStackAsGateHazardPile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])
  let gateCount = 0
  let activeHazardCount = 0

  for (const card of stackedCards) {
    if (card?.kind === 'gate' && card.gate) {
      gateCount += 1
    } else if (isActiveHazardCard(card)) {
      activeHazardCount += 1
    } else {
      return false
    }
  }

  return gateCount === 1 && activeHazardCount > 0
}

function isShipPartBlueprintCard(card: Card | undefined) {
  return card?.kind === 'mission' && card.mission?.find.kind === 'ship_part'
}

function isDestinationSupportCard(card: Card | undefined) {
  return (
    card?.kind === 'crew' ||
    card?.kind === 'discovery' ||
    (card?.kind === 'resource' && card.resource === 'fuel') ||
    isUsableMotherCard(card)
  )
}

function canStackAsBlueprintPrepPile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])
  let blueprintCount = 0
  let supportCount = 0

  for (const card of stackedCards) {
    if (isShipPartBlueprintCard(card)) {
      blueprintCount += 1
    } else if (isDestinationSupportCard(card)) {
      supportCount += 1
    } else {
      return false
    }
  }

  return blueprintCount === 1 && supportCount > 0
}

export function canStackCards(
  sourceStack: Stack,
  targetStack: Stack,
  cards: Record<string, Card>,
  fuelDiscount = 0,
  stressCountBefore = 0,
  serviceDroneBayCount = 0,
  controlConsoleCount = 0,
  availableGateFuelCount = 0,
  gateFuelDiscount = 0,
  missionAnyIconSurcharge = 0,
  waterPairFuelAmount = 1,
) {
  return (
    canStackAsGateHazardPile(sourceStack, targetStack, cards) ||
    (
      isFaceUpStack(sourceStack, cards) &&
      isFaceUpStack(targetStack, cards) &&
      (
      canStackAsShipPartPile(sourceStack, targetStack, cards) ||
      canStackAsLoosePile(sourceStack, targetStack, cards) ||
      canStackAsBlueprintPrepPile(sourceStack, targetStack, cards) ||
      canUseAllCardsInCompletionStack(
        [...targetStack.cardIds, ...sourceStack.cardIds],
        cards,
        fuelDiscount,
        stressCountBefore,
        serviceDroneBayCount,
        controlConsoleCount,
        availableGateFuelCount,
        gateFuelDiscount,
        missionAnyIconSurcharge,
        waterPairFuelAmount,
      )
      )
    )
  )
}

export function canCombineAsDeck(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  return isSingleFaceDownCard(sourceStack, cards) && isSingleFaceDownCard(targetStack, cards)
}

function getDeckCardFamily(card: CardBlueprint) {
  if (card.kind === 'resource') {
    return card.resource ? `resource:${card.resource}` : null
  }

  if (card.kind === 'mission' && card.mission?.find.kind === 'ship_part') {
    return 'ship-part'
  }

  return card.kind
}

function getDeckFamily(deck: Deck) {
  const firstCard = deck.cards[0]

  if (!firstCard) {
    return null
  }

  const family = getDeckCardFamily(firstCard)

  if (!family) {
    return null
  }

  return deck.cards.every((card) => getDeckCardFamily(card) === family) ? family : null
}

export function canMergeDecks(sourceDeck: Deck, targetDeck: Deck) {
  if (sourceDeck.id === targetDeck.id || sourceDeck.cards.length === 0 || targetDeck.cards.length === 0) {
    return false
  }

  const sourceFamily = getDeckFamily(sourceDeck)

  return sourceFamily !== null && sourceFamily === getDeckFamily(targetDeck)
}

export function cardsToDeckBlueprints(cardIds: string[], cards: Record<string, Card>) {
  return cardIds.flatMap<CardBlueprint>((cardId) => {
    const card = cards[cardId]

    if (!card) {
      return []
    }

    return [
      {
        title: card.title,
        icon: card.icon,
        hue: card.hue,
        accent: card.accent,
        kind: card.kind,
        resource: card.resource,
        specializations: card.specializations ? [...card.specializations] : undefined,
        mission: card.mission
          ? {
              kind: card.mission.kind,
              need: {
                fuel: card.mission.need.fuel,
                icons: [...card.mission.need.icons],
              },
              ...(card.mission.pattern ? { pattern: card.mission.pattern } : {}),
              find: card.mission.find.kind === 'ship_part'
                ? {
                    ...card.mission.find,
                    rewards: card.mission.find.rewards?.map((reward) => ({ ...reward })),
                  }
                : {
                    kind: 'visit_reward',
                    itemName: card.mission.find.itemName,
                    rewards: card.mission.find.rewards.map((reward) => ({ ...reward })),
                  },
            }
          : undefined,
        gate: card.gate
          ? {
              label: card.gate.label,
              need: {
                fuel: card.gate.need.fuel,
                icons: [...card.gate.need.icons],
                crew: card.gate.need.crew,
              },
              effectKind: card.gate.effectKind,
              effectText: card.gate.effectText,
              clear: {
                extraFuel: card.gate.clear.extraFuel,
                extraCrew: card.gate.clear.extraCrew,
              },
              clearText: card.gate.clearText,
              motherPenalty: { ...card.gate.motherPenalty },
            }
          : undefined,
        discovery: card.discovery
          ? {
              tag: card.discovery.tag,
              effectKind: card.discovery.effectKind,
              effectText: card.discovery.effectText,
              icon: card.discovery.icon,
              amount: card.discovery.amount,
            }
          : undefined,
        drift: card.drift
          ? {
              effectKind: card.drift.effectKind,
              effectText: card.drift.effectText,
            }
          : undefined,
        hazard: card.hazard
          ? {
              kind: card.hazard.kind,
              effectText: card.hazard.effectText,
              clearText: card.hazard.clearText,
              damageTitle: card.hazard.damageTitle,
              damageEffectText: card.hazard.damageEffectText,
              flavorText: card.hazard.flavorText,
              effectImplemented: card.hazard.effectImplemented,
            }
          : undefined,
        specimenIndex: card.specimenIndex,
      },
    ]
  })
}

export function getMotherCardIdsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return stacks.flatMap((stack) => stack.cardIds.filter((cardId) => cards[cardId]?.kind === 'mother'))
}

export function countMotherCardsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return getMotherCardIdsInPlay(stacks, cards).length
}

export function getSpentMotherCardIdsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return stacks.flatMap((stack) =>
    stack.cardIds.filter((cardId) => {
      const card = cards[cardId]

      return card?.kind === 'mother' && card.spentMother === true
    }),
  )
}

export function countSpentMotherCardsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return getSpentMotherCardIdsInPlay(stacks, cards).length
}

export function isUsableMotherCard(card: Card | undefined) {
  return card?.kind === 'mother' && card.spentMother !== true
}

export function getUsableMotherCardIdsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return stacks.flatMap((stack) => stack.cardIds.filter((cardId) => isUsableMotherCard(cards[cardId])))
}

export function countUsableMotherCardsInPlay(stacks: readonly Stack[], cards: Record<string, Card>) {
  return getUsableMotherCardIdsInPlay(stacks, cards).length
}

function getCrewCardIds(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.filter((cardId) => cards[cardId]?.kind === 'crew')
}

function countRequirementIcons(icons: readonly RequirementIconKind[]) {
  const counts: Record<RequirementIconKind, number> = {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  }

  for (const icon of icons) {
    counts[icon] += 1
  }

  return counts
}

export function getMissingNeedIcons(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  stackCardIds: readonly string[] = [],
) {
  const requiredIcons = countRequirementIcons(icons)
  const availableIcons: Record<RequirementIconKind, number> = {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  }

  for (const cardId of crewCardIds) {
    for (const specialization of getCrewSpecializationsForNeed(cardId, cards, stackCardIds)) {
      availableIcons[specialization] += 1
    }
  }

  const missingSpecificIcons: MotherCoveredIcon[] = requirementIconKinds.flatMap((icon) =>
    Array.from({ length: Math.max(0, requiredIcons[icon] - availableIcons[icon]) }).map(() => icon),
  )
  const unusedCrewIconCount = requirementIconKinds.reduce(
    (count, icon) => count + Math.max(0, availableIcons[icon] - requiredIcons[icon]),
    0,
  )
  const missingAnyIconCount = Math.max(0, any - unusedCrewIconCount)

  const missingAnyIcons: MotherCoveredIcon[] = Array.from({ length: missingAnyIconCount }).map(() => 'any')

  return [...missingSpecificIcons, ...missingAnyIcons]
}

function removeLeastUsefulCrewIcons(
  availableIcons: Record<RequirementIconKind, number>,
  requiredIcons: Record<RequirementIconKind, number>,
  count: number,
) {
  for (let ignored = 0; ignored < count; ignored += 1) {
    const excessIcon = requirementIconKinds.find((icon) => availableIcons[icon] > requiredIcons[icon])

    if (excessIcon) {
      availableIcons[excessIcon] -= 1
      continue
    }

    const usefulIcon = requirementIconKinds.find((icon) => (
      availableIcons[icon] > 0 && requiredIcons[icon] > 0
    ))

    if (usefulIcon) {
      availableIcons[usefulIcon] -= 1
      continue
    }

    const anyIcon = requirementIconKinds.find((icon) => availableIcons[icon] > 0)

    if (!anyIcon) {
      return
    }

    availableIcons[anyIcon] -= 1
  }
}

function getGateMissingNeedIcons(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  stackCardIds: readonly string[],
  modifiers: Pick<GateHazardModifiers, 'ignoredCrewCardIds' | 'ignoredSingleIconCrewCardIds' | 'ignoredCrewIconCount'>,
) {
  const requiredIcons = countRequirementIcons(icons)
  const availableIcons: Record<RequirementIconKind, number> = {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  }

  for (const cardId of crewCardIds) {
    if (modifiers.ignoredCrewCardIds.has(cardId)) {
      continue
    }

    const specializations = getCrewSpecializationsForNeed(cardId, cards, stackCardIds)
    const effectiveSpecializations = modifiers.ignoredSingleIconCrewCardIds.has(cardId)
      ? specializations.slice(1)
      : specializations

    for (const specialization of effectiveSpecializations) {
      availableIcons[specialization] += 1
    }
  }

  removeLeastUsefulCrewIcons(availableIcons, requiredIcons, modifiers.ignoredCrewIconCount)

  return requirementIconKinds.flatMap((icon) =>
    Array.from({ length: Math.max(0, requiredIcons[icon] - availableIcons[icon]) }).map(() => icon),
  )
}

function countMissingNeedIcons(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  stackCardIds: readonly string[] = [],
) {
  return getMissingNeedIcons(crewCardIds, cards, icons, any, stackCardIds).length
}

function getCrewMotherNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  motherCount: number,
  extraHumanCrewRequired = 0,
  stackCardIds: readonly string[] = [],
): CrewMotherNeedPayment | null {
  const selectedCardIds: string[] = []
  let best: CrewMotherNeedPayment | null = null

  function considerSelectedCrew() {
    const motherCoveredIcons = getMissingNeedIcons(selectedCardIds, cards, icons, any, stackCardIds)

    if (motherCoveredIcons.length > motherCount) {
      return
    }

    const baseCrewCount = Math.max(1, selectedCardIds.length)
    const minimumCrewCount = baseCrewCount + extraHumanCrewRequired

    if (crewCardIds.length < minimumCrewCount) {
      return
    }

    const candidate = {
      requiredMotherCount: motherCoveredIcons.length,
      motherCoveredIcons,
      minimumCrewCount,
    }

    if (
      !best ||
      candidate.requiredMotherCount < best.requiredMotherCount ||
      (
        candidate.requiredMotherCount === best.requiredMotherCount &&
        candidate.minimumCrewCount < best.minimumCrewCount
      )
    ) {
      best = candidate
    }
  }

  function search(startIndex: number) {
    considerSelectedCrew()

    for (let index = startIndex; index < crewCardIds.length; index += 1) {
      const cardId = crewCardIds[index]

      if (!cardId) {
        continue
      }

      selectedCardIds.push(cardId)
      search(index + 1)
      selectedCardIds.pop()
    }
  }

  search(0)

  return crewCardIds.length > 0 ? best : null
}

export function canCompleteNeedWithCrewAndMother(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  motherCount: number,
  extraHumanCrewRequired = 0,
  stackCardIds: readonly string[] = [],
) {
  const payment = getCrewMotherNeedPayment(
    crewCardIds,
    cards,
    icons,
    any,
    motherCount,
    extraHumanCrewRequired,
    stackCardIds,
  )

  return payment !== null
}

function getGateCrewCardNeedPaymentWithFuel(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  requiredCrewCount: number,
  motherCount: number,
  fuelCount: number,
  controlConsoleCount: number,
  modifiers: GateHazardModifiers,
  stackCardIds: readonly string[] = [],
  waterPairFuelAmount = 1,
): GateNeedPayment | null {
  if (crewCardIds.length < requiredCrewCount) {
    return null
  }

  const selectedIconCrewCardIds: string[] = []
  let best: GateNeedPayment | null = null

  function considerSelectedIconCrew() {
    const missingIcons = getGateMissingNeedIcons(
      selectedIconCrewCardIds,
      cards,
      icons,
      stackCardIds,
      modifiers,
    )
    const motherCoveredIcons = missingIcons.slice(Math.min(controlConsoleCount, missingIcons.length))
    const motherCostIcons = motherCoveredIcons.flatMap((icon) => (
      Array.from({ length: modifiers.motherCostPerMissingIcon }).map(() => icon)
    ))

    if (motherCostIcons.length > motherCount) {
      return
    }

    if (motherCoveredIcons.length > 0 && crewCardIds.length === 0) {
      return
    }

    const requiredFuelCount = modifiers.requiredFuelCount +
      motherCostIcons.length * modifiers.motherFuelCost
    const fuelSpentCount = Math.min(fuelCount, requiredFuelCount)
    const fuelGeneratedCount = requiredFuelCount - fuelSpentCount
    const selectedIconCrewCardIdSet = new Set(selectedIconCrewCardIds)
    const fuelCrewCardIds = crewCardIds.filter((cardId) => !selectedIconCrewCardIdSet.has(cardId))

    if (!canPayMissingFuelWithCrew(fuelGeneratedCount, fuelCrewCardIds, cards, waterPairFuelAmount)) {
      return
    }

    const candidate = {
      requiredMotherCount: motherCostIcons.length,
      motherCoveredIcons: motherCostIcons,
      minimumCrewCount: requiredCrewCount,
      requiredFuelCount,
      fuelSpentCount,
      fuelGeneratedCount,
    }

    if (
      !best ||
      candidate.requiredMotherCount < best.requiredMotherCount ||
      (
        candidate.requiredMotherCount === best.requiredMotherCount &&
        candidate.fuelGeneratedCount < best.fuelGeneratedCount
      )
    ) {
      best = candidate
    }
  }

  function search(startIndex: number) {
    considerSelectedIconCrew()

    for (let index = startIndex; index < crewCardIds.length; index += 1) {
      const cardId = crewCardIds[index]

      if (!cardId) {
        continue
      }

      selectedIconCrewCardIds.push(cardId)
      search(index + 1)
      selectedIconCrewCardIds.pop()
    }
  }

  search(0)

  return best
}

function getGateHazardModifiers(
  _crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  _stackCardIds: readonly string[],
  usableMotherCount: number,
  gateFuelDiscount = 0,
  extraFuelRequired = 0,
): GateHazardModifiers {
  const ignoredCrewCardIds = new Set<string>()
  const ignoredSingleIconCrewCardIds = new Set<string>()
  const ignoredCrewIconCount = 0
  const motherCostPerMissingIcon = 1
  const motherFuelCost = getMotherFuelCost(cards) + getGateMotherFuelCost(gate)
  const usableMotherCapacity = gateBlocksMotherIcons(gate)
    ? 0
    : usableMotherCount
  const baseModifiers = {
    ignoredCrewCardIds,
    ignoredSingleIconCrewCardIds,
    ignoredCrewIconCount,
    motherCostPerMissingIcon,
    motherFuelCost,
    usableMotherCapacity,
    requiredFuelCount: 0,
  }
  const requiredFuelCount = Math.max(0, gate.need.fuel - gateFuelDiscount) + extraFuelRequired

  return {
    ...baseModifiers,
    requiredFuelCount,
    usableMotherCapacity,
  }
}

function getGateNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  stressCountBefore: number,
  usableMotherCount: number,
  fuelCount: number,
  availableFuelCount = 0,
  gateFuelDiscount = 0,
  serviceDroneBayCount = 0,
  controlConsoleCount = 0,
  hazardSkipCount = 0,
  extraFuelRequired = 0,
  stackCardIds: readonly string[] = [],
  waterPairFuelAmount = 1,
) {
  const modifiers = getGateHazardModifiers(
    crewCardIds,
    cards,
    gate,
    stackCardIds,
    usableMotherCount,
    gateFuelDiscount,
    extraFuelRequired,
  )
  const extraHumanCrewRequired = getGateExtraCrewSlots(gate, stressCountBefore, hazardSkipCount)
  const crewNeedReduction = getServiceDroneBayCrewReduction(gate, serviceDroneBayCount)
  const requiredCrewSlots = Math.max(0, gate.need.crew - crewNeedReduction) + extraHumanCrewRequired
  const totalFuelCount = Math.max(0, fuelCount + availableFuelCount)

  let payment: GateNeedPayment | null = null

  for (const requiredIcons of getGateRequiredIconOptions(gate)) {
    const candidate = getGateCrewCardNeedPaymentWithFuel(
      crewCardIds,
      cards,
      requiredIcons,
      requiredCrewSlots,
      modifiers.usableMotherCapacity,
      totalFuelCount,
      controlConsoleCount,
      modifiers,
      stackCardIds,
      waterPairFuelAmount,
    )

    if (!candidate) {
      continue
    }

    if (
      !payment ||
      candidate.requiredMotherCount < payment.requiredMotherCount ||
      (
        candidate.requiredMotherCount === payment.requiredMotherCount &&
        candidate.fuelGeneratedCount < payment.fuelGeneratedCount
      )
    ) {
      payment = candidate
    }
  }

  if (!payment) {
    return null
  }

  return {
    ...payment,
    extraHumanCrewRequired,
    motherSpentTotal: stressCountBefore + payment.requiredMotherCount,
  }
}

export function canCompleteGateNeedWithCrewAndMother(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  stressCountBefore: number,
  usableMotherCount: number,
  fuelCount = 0,
  availableFuelCount = 0,
  gateFuelDiscount = 0,
  serviceDroneBayCount = 0,
  controlConsoleCount = 0,
  hazardSkipCount = 0,
  stackCardIds: readonly string[] = [],
  waterPairFuelAmount = 1,
) {
  return getGateNeedPayment(
    crewCardIds,
    cards,
    gate,
    stressCountBefore,
    usableMotherCount,
    fuelCount,
    availableFuelCount,
    gateFuelDiscount,
    serviceDroneBayCount,
    controlConsoleCount,
    hazardSkipCount,
    0,
    stackCardIds,
    waterPairFuelAmount,
  ) !== null
}

function canPayMissingFuelWithCrew(
  missingFuel: number,
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  waterPairFuelAmount = 1,
) {
  if (missingFuel === 0) {
    return true
  }

  const roleCounts = countWaterPairCrewRoles(crewCardIds, cards)

  return Boolean(
    roleCounts &&
      Math.min(roleCounts.mechanicCount, roleCounts.scientistCount) * waterPairFuelAmount >= missingFuel,
  )
}

function isBetterMissionNeedPayment(candidate: MissionNeedPayment, best: MissionNeedPayment | null) {
  if (!best) {
    return true
  }

  if (candidate.requiredMotherCount !== best.requiredMotherCount) {
    return candidate.requiredMotherCount < best.requiredMotherCount
  }

  return candidate.fuelMotherCount < best.fuelMotherCount
}

function getMissionNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  requiredFuel: number,
  fuelCount: number,
  motherCount: number,
  motherFuelCost: number,
  stackCardIds: readonly string[] = [],
  waterPairFuelAmount = 1,
): MissionNeedPayment | null {
  if (crewCardIds.length === 0) {
    return null
  }

  const selectedIconCrewCardIds: string[] = []
  let best: MissionNeedPayment | null = null

  function considerSelectedIconCrew() {
    const missingIcons = getMissingNeedIcons(selectedIconCrewCardIds, cards, icons, any, stackCardIds)

    if (missingIcons.length > motherCount) {
      return
    }

    const missingFuel = requiredFuel + missingIcons.length * motherFuelCost - fuelCount

    if (missingFuel < 0) {
      return
    }

    const selectedIconCrewCardIdSet = new Set(selectedIconCrewCardIds)
    const fuelCrewCardIds = crewCardIds.filter((cardId) => !selectedIconCrewCardIdSet.has(cardId))

    if (!canPayMissingFuelWithCrew(missingFuel, fuelCrewCardIds, cards, waterPairFuelAmount)) {
      return
    }

    const motherCoveredIcons = [...missingIcons]
    const candidate = {
      requiredMotherCount: motherCoveredIcons.length,
      motherCoveredIcons,
      fuelMotherCount: 0,
    }

    if (isBetterMissionNeedPayment(candidate, best)) {
      best = candidate
    }
  }

  function search(startIndex: number) {
    considerSelectedIconCrew()

    for (let index = startIndex; index < crewCardIds.length; index += 1) {
      const cardId = crewCardIds[index]

      if (!cardId) {
        continue
      }

      selectedIconCrewCardIds.push(cardId)
      search(index + 1)
      selectedIconCrewCardIds.pop()
    }
  }

  search(0)

  return best
}

export function canCompleteMissionNeedWithFuelOptions(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  requiredFuel: number,
  availableFuelCount: number,
  motherCount: number,
  stackCardIds: readonly string[] = [],
  any = 0,
  waterPairFuelAmount = 1,
) {
  return getMissionNeedPayment(
    crewCardIds,
    cards,
    icons,
    any,
    requiredFuel,
    availableFuelCount,
    motherCount,
    getMotherFuelCost(cards),
    stackCardIds,
    waterPairFuelAmount,
  ) !== null
}

export function getMissionStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  fuelDiscount = 0,
  missionAnyIconSurcharge = 0,
  waterPairFuelAmount = 1,
  wildCardId: string | null = null,
): MissionStackCompletion | null {
  const missionCardIndex = stack.cardIds.findIndex((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'mission' && Boolean(card.mission)
  })

  if (missionCardIndex === -1) {
    return null
  }

  const missionCardId = stack.cardIds[missionCardIndex]
  const missionCard = missionCardId ? cards[missionCardId] : undefined

  if (!missionCard?.mission || !missionCardId) {
    return null
  }

  let fuelCount = 0
  let motherCount = 0
  let hasBlockingCard = false
  const crewCardIds = getCrewCardIds(stack, cards)
  const missionFuelDiscount = countMissionFuelDiscountDiscoveries(stack.cardIds, cards)

  for (const [index, cardId] of stack.cardIds.entries()) {
    if (cardId === missionCardId) {
      continue
    }

    const card = cards[cardId]

    if (!card) {
      hasBlockingCard = true
      continue
    }

    if (card.kind === 'resource') {
      if (card.resource === 'fuel') {
        fuelCount += 1
      } else {
        hasBlockingCard = true
      }
    } else if (card.kind === 'crew') {
      continue
    } else if (isUsableMotherCard(card)) {
      motherCount += 1
    } else if (isCrewDiscoveryCard(card)) {
      if (!isPairedCrewDiscoveryIndex(index, stack.cardIds, cards)) {
        hasBlockingCard = true
      }
    } else if (isMissionDiscoveryCard(card)) {
      continue
    } else {
      hasBlockingCard = true
    }
  }

  const requiredFuel = Math.max(
    0,
    missionCard.mission.need.fuel +
      getDestinationFuelSurcharge(cards, missionCard.mission) -
      fuelDiscount -
      missionFuelDiscount,
  )

  if (missionCard.mission.pattern === 'open') {
    const best = findBestPatternForCrew(crewCardIds, cards, wildCardId)
    const fuelPaid = fuelCount >= requiredFuel

    return {
      missionCardId,
      missionCardIndex,
      requiredMotherCount: 0,
      motherCoveredIcons: [],
      isReady: best !== null && fuelPaid && !hasBlockingCard,
      dynamicFuelReward: best?.fuel,
      dynamicPattern: best?.pattern,
    }
  }

  if (missionCard.mission.pattern) {
    const patternSatisfied = canCompleteHandPattern(crewCardIds, cards, missionCard.mission.pattern, wildCardId)
    const fuelPaid = fuelCount >= requiredFuel

    return {
      missionCardId,
      missionCardIndex,
      requiredMotherCount: 0,
      motherCoveredIcons: [],
      isReady: patternSatisfied && fuelPaid && !hasBlockingCard,
    }
  }

  const missingIconCount = countMissingNeedIcons(
    crewCardIds,
    cards,
    missionCard.mission.need.icons,
    missionAnyIconSurcharge,
    stack.cardIds,
  )
  const payment = getMissionNeedPayment(
    crewCardIds,
    cards,
    missionCard.mission.need.icons,
    missionAnyIconSurcharge,
    requiredFuel,
    fuelCount,
    motherCount,
    getMotherFuelCost(cards),
    stack.cardIds,
    waterPairFuelAmount,
  )

  return {
    missionCardId,
    missionCardIndex,
    requiredMotherCount: payment?.requiredMotherCount ?? missingIconCount,
    motherCoveredIcons: payment?.motherCoveredIcons ?? [],
    isReady: payment !== null && !hasBlockingCard,
  }
}

export function getGateStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  stressCountBefore: number,
  serviceDroneBayCount = 0,
  controlConsoleCount = 0,
  availableFuelCount = 0,
  gateFuelDiscount = 0,
  waterPairFuelAmount = 1,
): GateStackCompletion | null {
  const gateCardIndex = stack.cardIds.findIndex((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'gate' && Boolean(card.gate)
  })

  if (gateCardIndex === -1) {
    return null
  }

  const gateCardId = stack.cardIds[gateCardIndex]
  const gateCard = gateCardId ? cards[gateCardId] : undefined

  if (!gateCard?.gate || !gateCardId || !gateCard.faceUp) {
    return null
  }

  let hasBlockingCard = false
  let usableMotherCount = 0
  let fuelCount = 0
  const stressCleared = countGateStressClearDiscoveries(stack.cardIds, cards)
  const hazardSkipCount = countGateHazardSkipDiscoveries(stack.cardIds, cards)
  const effectiveStressCount = Math.max(0, stressCountBefore - stressCleared)
  const allowsGateFuel = gateCard.gate.need.fuel > 0 ||
    gateCard.gate.clear.extraFuel > 0 ||
    getMotherFuelCost(cards) + getGateMotherFuelCost(gateCard.gate) > 0

  for (const [index, cardId] of stack.cardIds.entries()) {
    if (cardId === gateCardId) {
      continue
    }

    const card = cards[cardId]

    if (card?.kind === 'crew') {
      if (gateBlocksCrewCard(gateCard.gate, card)) {
        hasBlockingCard = true
      }

      continue
    }

    if (card?.kind === 'resource' && card.resource === 'fuel' && allowsGateFuel) {
      fuelCount += 1
    } else if (isUsableMotherCard(card)) {
      usableMotherCount += 1
    } else if (isCrewDiscoveryCard(card)) {
      if (gateBlocksDiscoveries(gateCard.gate)) {
        hasBlockingCard = true
        continue
      }

      if (!isPairedCrewDiscoveryIndex(index, stack.cardIds, cards)) {
        hasBlockingCard = true
      }
    } else if (isGateDiscoveryCard(card)) {
      if (gateBlocksDiscoveries(gateCard.gate)) {
        hasBlockingCard = true
      }

      continue
    } else if (isActiveHazardCard(card)) {
      continue
    } else {
      hasBlockingCard = true
    }
  }

  const crewCardIds = getCrewCardIds(stack, cards)
  const fallbackModifiers = getGateHazardModifiers(
    crewCardIds,
    cards,
    gateCard.gate,
    stack.cardIds,
    usableMotherCount,
    gateFuelDiscount,
    0,
  )
  const fallbackRequiredMotherCount = Math.min(
    ...getGateRequiredIconOptions(gateCard.gate).map((icons) => (
      getGateMissingNeedIcons(
        crewCardIds,
        cards,
        icons,
        stack.cardIds,
        fallbackModifiers,
      ).length * fallbackModifiers.motherCostPerMissingIcon
    )),
  )
  const fallbackMotherAfterControlConsoles = Math.max(0, fallbackRequiredMotherCount - controlConsoleCount)
  const basePayment = getGateNeedPayment(
    crewCardIds,
    cards,
    gateCard.gate,
    effectiveStressCount,
    usableMotherCount,
    fuelCount,
    availableFuelCount,
    gateFuelDiscount,
    serviceDroneBayCount,
    controlConsoleCount,
    hazardSkipCount,
    0,
    stack.cardIds,
    waterPairFuelAmount,
  )
  const cleanCrewMet = crewCardIds.length >=
    Math.max(0, gateCard.gate.need.crew - getServiceDroneBayCrewReduction(gateCard.gate, serviceDroneBayCount)) +
      gateCard.gate.clear.extraCrew
  const cleanPayment = basePayment && cleanCrewMet && gateCard.gate.clear.extraFuel > 0
    ? getGateNeedPayment(
        crewCardIds,
        cards,
        gateCard.gate,
        effectiveStressCount,
        usableMotherCount,
        fuelCount,
        availableFuelCount,
        gateFuelDiscount,
        serviceDroneBayCount,
        controlConsoleCount,
        hazardSkipCount,
        gateCard.gate.clear.extraFuel,
        stack.cardIds,
        waterPairFuelAmount,
      )
    : basePayment
  const payment = cleanPayment ?? basePayment

  return {
    gateCardId,
    gateCardIndex,
    motherSpentTotal: payment?.motherSpentTotal ?? effectiveStressCount + Math.min(fallbackMotherAfterControlConsoles, usableMotherCount),
    extraHumanCrewRequired: payment?.extraHumanCrewRequired ?? (
      getGateExtraCrewSlots(gateCard.gate, effectiveStressCount, hazardSkipCount)
    ),
    requiredMotherCount: payment?.requiredMotherCount ?? fallbackMotherAfterControlConsoles,
    motherCoveredIcons: payment?.motherCoveredIcons ?? [],
    requiredFuelCount: basePayment?.requiredFuelCount ?? fallbackModifiers.requiredFuelCount,
    fuelSpentCount: payment?.fuelSpentCount ?? Math.min(fuelCount + availableFuelCount, fallbackModifiers.requiredFuelCount),
    fuelGeneratedCount: payment?.fuelGeneratedCount ?? 0,
    isReady:
      basePayment !== null &&
      !hasBlockingCard,
  }
}

export function withoutCards(cards: Record<string, Card>, cardIds: string[]) {
  const nextCards = { ...cards }

  for (const cardId of cardIds) {
    delete nextCards[cardId]
  }

  return nextCards
}
