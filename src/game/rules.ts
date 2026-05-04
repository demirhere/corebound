import type { Card, CardBlueprint, Deck, GateDetails, RequirementIconKind, Stack } from './types'

export type HorizonStackCompletion = {
  horizonCardId: string
  horizonCardIndex: number
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  isReady: boolean
}

export type GateStackCompletion = {
  gateCardId: string
  gateCardIndex: number
  isReady: boolean
  motherSpentTotal: number
  extraHumanCrewRequired: number
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
}

export type MotherCoveredIcon = RequirementIconKind | 'any' | 'fuel'

type HorizonNeedPayment = {
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  fuelMotherCount: number
}

type CrewMotherNeedPayment = {
  requiredMotherCount: number
  motherCoveredIcons: MotherCoveredIcon[]
  minimumCrewCount: number
}

const requirementIconKinds = ['life', 'star', 'engine', 'signal'] as const

type CompletionNeed = {
  icons: readonly RequirementIconKind[]
  any: number
  fuel: number
}

type WaterPairCrewRole = 'engineer' | 'scientist'

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
) {
  const missingWithAllCrew = getMissingNeedIcons(crewCardIds, cards, icons, any).length

  return crewCardIds.every((cardId) => {
    const missingWithoutCard = getMissingNeedIcons(
      crewCardIds.filter((candidateId) => candidateId !== cardId),
      cards,
      icons,
      any,
    ).length

    return missingWithoutCard > missingWithAllCrew
  })
}

function getWaterPairCrewRole(card: Card | undefined): WaterPairCrewRole | null {
  if (card?.kind !== 'crew') {
    return null
  }

  const specializations = card.specializations ?? []

  if (specializations.length > 0 && specializations.every((specialization) => specialization === 'engine')) {
    return 'engineer'
  }

  const specializationSet = new Set(specializations)

  return specializationSet.has('engine') && specializationSet.has('signal') ? 'scientist' : null
}

function countWaterPairCrewRoles(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
) {
  let engineerCount = 0
  let scientistCount = 0

  for (const cardId of crewCardIds) {
    const role = getWaterPairCrewRole(cards[cardId])

    if (role === 'engineer') {
      engineerCount += 1
    } else if (role === 'scientist') {
      scientistCount += 1
    } else {
      return null
    }
  }

  return { engineerCount, scientistCount }
}

function canUseWaterSupport(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  fuelCardCount: number,
  requiredFuel: number,
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
      roleCounts.engineerCount <= remainingFuel &&
      roleCounts.scientistCount <= remainingFuel,
  )
}

function canAssignUsefulSupport(
  crewCardIds: readonly string[],
  fuelCardCount: number,
  motherCount: number,
  cards: Record<string, Card>,
  need: CompletionNeed,
) {
  if (fuelCardCount > need.fuel) {
    return false
  }

  const iconCrewCardIds: string[] = []
  let canAssignSupport = false

  function searchCrewAssignments(index: number) {
    if (canAssignSupport) {
      return
    }

    if (index >= crewCardIds.length) {
      if (!iconCrewCardsAreUseful(iconCrewCardIds, cards, need.icons, need.any)) {
        return
      }

      const missingIconCount = getMissingNeedIcons(
        iconCrewCardIds,
        cards,
        need.icons,
        need.any,
      ).length
      const iconCrewCardIdSet = new Set(iconCrewCardIds)
      const fuelCrewCardIds = crewCardIds.filter((cardId) => !iconCrewCardIdSet.has(cardId))

      for (let iconMotherCount = 0; iconMotherCount <= Math.min(motherCount, missingIconCount); iconMotherCount += 1) {
        if (iconMotherCount === motherCount && canUseWaterSupport(fuelCrewCardIds, cards, fuelCardCount, need.fuel)) {
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
  motherCount: number,
  beaconCount: number,
) {
  const maxMotherIconCoverage = Math.max(0, gate.need.icons.length - beaconCount)

  return crewCardIds.length + motherCount > 0 && motherCount <= maxMotherIconCoverage
}

function canUseAllCardsInCompletionStack(
  cardIds: readonly string[],
  cards: Record<string, Card>,
  fuelDiscount: number,
  stressCountBefore: number,
  hullPatchCount: number,
  beaconCount: number,
) {
  let objectiveCard: Card | null = null
  const crewCardIds: string[] = []
  let fuelCardCount = 0
  let motherCount = 0

  for (const cardId of cardIds) {
    const card = cards[cardId]

    if (!card?.faceUp) {
      return false
    }

    if ((card.kind === 'horizon' && card.horizon) || (card.kind === 'gate' && card.gate)) {
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
    } else {
      return false
    }
  }

  if (!objectiveCard || crewCardIds.length + fuelCardCount + motherCount === 0) {
    return false
  }

  if (objectiveCard.kind === 'horizon' && objectiveCard.horizon) {
    return canAssignUsefulSupport(
      crewCardIds,
      fuelCardCount,
      motherCount,
      cards,
      {
        icons: objectiveCard.horizon.need.icons,
        any: 0,
        fuel: Math.max(0, objectiveCard.horizon.need.fuel - fuelDiscount),
      },
    )
  }

  if (objectiveCard.kind === 'gate' && objectiveCard.gate && fuelCardCount === 0) {
    const gatePayment = getGateNeedPayment(
      crewCardIds,
      cards,
      objectiveCard.gate,
      stressCountBefore,
      motherCount,
      hullPatchCount,
      beaconCount,
    )

    return gatePayment !== null || canStackLegalGateSupport(
      crewCardIds,
      objectiveCard.gate,
      motherCount,
      beaconCount,
    )
  }

  return false
}

function canStackAsLoosePile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])

  return (
    stackedCards.every((card) => card?.kind === 'resource' && card.resource === 'fuel') ||
    stackedCards.every((card) => card?.kind === 'crew') ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother !== true) ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother === true) ||
    stackedCards.every(
      (card) =>
        card?.kind === 'crew' ||
        (card?.kind === 'resource' && card.resource === 'fuel') ||
        isUsableMotherCard(card),
    )
  )
}

export function canStackCards(
  sourceStack: Stack,
  targetStack: Stack,
  cards: Record<string, Card>,
  fuelDiscount = 0,
  stressCountBefore = 0,
  hullPatchCount = 0,
  beaconCount = 0,
) {
  return (
    isFaceUpStack(sourceStack, cards) &&
    isFaceUpStack(targetStack, cards) &&
    (
      canStackAsLoosePile(sourceStack, targetStack, cards) ||
      canUseAllCardsInCompletionStack(
        [...targetStack.cardIds, ...sourceStack.cardIds],
        cards,
        fuelDiscount,
        stressCountBefore,
        hullPatchCount,
        beaconCount,
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
        horizon: card.horizon
          ? {
              kind: card.horizon.kind,
              need: {
                fuel: card.horizon.need.fuel,
                icons: [...card.horizon.need.icons],
              },
              rewards: card.horizon.rewards.map((reward) => ({ ...reward })),
            }
          : undefined,
        gate: card.gate
          ? {
              label: card.gate.label,
              need: {
                icons: [...card.gate.need.icons],
                crew: card.gate.need.crew,
              },
              motherPenalty: { ...card.gate.motherPenalty },
            }
          : undefined,
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
) {
  const requiredIcons = countRequirementIcons(icons)
  const availableIcons: Record<RequirementIconKind, number> = {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  }

  for (const cardId of crewCardIds) {
    for (const specialization of cards[cardId]?.specializations ?? []) {
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

function countMissingNeedIcons(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
) {
  return getMissingNeedIcons(crewCardIds, cards, icons, any).length
}

function getCrewMotherNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  motherCount: number,
  extraHumanCrewRequired = 0,
): CrewMotherNeedPayment | null {
  const selectedCardIds: string[] = []
  let best: CrewMotherNeedPayment | null = null

  function considerSelectedCrew() {
    const motherCoveredIcons = getMissingNeedIcons(selectedCardIds, cards, icons, any)

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
) {
  const payment = getCrewMotherNeedPayment(
    crewCardIds,
    cards,
    icons,
    any,
    motherCount,
    extraHumanCrewRequired,
  )

  return payment !== null
}

function getGateCrewCardNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  requiredCrewCount: number,
  motherCount: number,
  beaconCount: number,
): CrewMotherNeedPayment | null {
  if (crewCardIds.length < requiredCrewCount) {
    return null
  }

  const missingIcons = getMissingNeedIcons(crewCardIds, cards, icons, 0)
  const motherCoveredIcons = missingIcons.slice(Math.min(beaconCount, missingIcons.length))

  if (motherCoveredIcons.length > motherCount) {
    return null
  }

  if (motherCoveredIcons.length > 0 && crewCardIds.length === 0) {
    return null
  }

  return {
    requiredMotherCount: motherCoveredIcons.length,
    motherCoveredIcons,
    minimumCrewCount: requiredCrewCount,
  }
}

function getGateNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  stressCountBefore: number,
  usableMotherCount: number,
  hullPatchCount = 0,
  beaconCount = 0,
) {
  const extraHumanCrewRequired = stressCountBefore >= gate.motherPenalty.threshold
    ? gate.motherPenalty.extraHumanCrew
    : 0
  const requiredCrewSlots = Math.max(0, gate.need.crew + extraHumanCrewRequired - hullPatchCount)

  const payment = getGateCrewCardNeedPayment(
    crewCardIds,
    cards,
    gate.need.icons,
    requiredCrewSlots,
    usableMotherCount,
    beaconCount,
  )

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
  hullPatchCount = 0,
  beaconCount = 0,
) {
  return getGateNeedPayment(
    crewCardIds,
    cards,
    gate,
    stressCountBefore,
    usableMotherCount,
    hullPatchCount,
    beaconCount,
  ) !== null
}

function canPayMissingFuelWithCrew(
  missingFuel: number,
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
) {
  if (missingFuel === 0) {
    return true
  }

  const roleCounts = countWaterPairCrewRoles(crewCardIds, cards)

  return Boolean(
    roleCounts &&
      roleCounts.engineerCount >= missingFuel &&
      roleCounts.scientistCount >= missingFuel,
  )
}

function isBetterHorizonNeedPayment(candidate: HorizonNeedPayment, best: HorizonNeedPayment | null) {
  if (!best) {
    return true
  }

  if (candidate.requiredMotherCount !== best.requiredMotherCount) {
    return candidate.requiredMotherCount < best.requiredMotherCount
  }

  return candidate.fuelMotherCount < best.fuelMotherCount
}

function getHorizonNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  requiredFuel: number,
  fuelCount: number,
  motherCount: number,
): HorizonNeedPayment | null {
  const missingFuel = requiredFuel - fuelCount

  if (missingFuel < 0 || crewCardIds.length === 0) {
    return null
  }

  const selectedIconCrewCardIds: string[] = []
  let best: HorizonNeedPayment | null = null

  function considerSelectedIconCrew() {
    const missingIcons = getMissingNeedIcons(selectedIconCrewCardIds, cards, icons, 0)

    if (missingIcons.length > motherCount) {
      return
    }

    const selectedIconCrewCardIdSet = new Set(selectedIconCrewCardIds)
    const fuelCrewCardIds = crewCardIds.filter((cardId) => !selectedIconCrewCardIdSet.has(cardId))

    if (!canPayMissingFuelWithCrew(missingFuel, fuelCrewCardIds, cards)) {
      return
    }

    const motherCoveredIcons = [...missingIcons]
    const candidate = {
      requiredMotherCount: motherCoveredIcons.length,
      motherCoveredIcons,
      fuelMotherCount: 0,
    }

    if (isBetterHorizonNeedPayment(candidate, best)) {
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

export function canCompleteHorizonNeedWithFuelOptions(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  requiredFuel: number,
  availableFuelCount: number,
  motherCount: number,
) {
  return getHorizonNeedPayment(
    crewCardIds,
    cards,
    icons,
    requiredFuel,
    Math.min(requiredFuel, availableFuelCount),
    motherCount,
  ) !== null
}

export function getHorizonStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  fuelDiscount = 0,
): HorizonStackCompletion | null {
  const horizonCardIndex = stack.cardIds.findIndex((cardId) => {
    const card = cards[cardId]

    return card?.kind === 'horizon' && Boolean(card.horizon)
  })

  if (horizonCardIndex === -1) {
    return null
  }

  const horizonCardId = stack.cardIds[horizonCardIndex]
  const horizonCard = horizonCardId ? cards[horizonCardId] : undefined

  if (!horizonCard?.horizon || !horizonCardId) {
    return null
  }

  let fuelCount = 0
  let motherCount = 0
  let hasBlockingCard = false
  const crewCardIds = getCrewCardIds(stack, cards)

  for (const cardId of stack.cardIds) {
    if (cardId === horizonCardId) {
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
    } else {
      hasBlockingCard = true
    }
  }

  const missingIconCount = countMissingNeedIcons(crewCardIds, cards, horizonCard.horizon.need.icons, 0)
  const requiredFuel = Math.max(0, horizonCard.horizon.need.fuel - fuelDiscount)
  const payment = getHorizonNeedPayment(
    crewCardIds,
    cards,
    horizonCard.horizon.need.icons,
    requiredFuel,
    fuelCount,
    motherCount,
  )

  return {
    horizonCardId,
    horizonCardIndex,
    requiredMotherCount: payment?.requiredMotherCount ?? missingIconCount,
    motherCoveredIcons: payment?.motherCoveredIcons ?? [],
    isReady: payment !== null && !hasBlockingCard,
  }
}

export function getGateStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  stressCountBefore: number,
  hullPatchCount = 0,
  beaconCount = 0,
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

  if (!gateCard?.gate || !gateCardId) {
    return null
  }

  let hasBlockingCard = false
  let usableMotherCount = 0

  for (const cardId of stack.cardIds) {
    if (cardId === gateCardId) {
      continue
    }

    const card = cards[cardId]

    if (card?.kind === 'crew') {
      continue
    }

    if (isUsableMotherCard(card)) {
      usableMotherCount += 1
    } else {
      hasBlockingCard = true
    }
  }

  const crewCardIds = getCrewCardIds(stack, cards)
  const fallbackRequiredMotherCount = countMissingNeedIcons(
    crewCardIds,
    cards,
    gateCard.gate.need.icons,
    0,
  )
  const fallbackMotherAfterBeacons = Math.max(0, fallbackRequiredMotherCount - beaconCount)
  const payment = getGateNeedPayment(
    crewCardIds,
    cards,
    gateCard.gate,
    stressCountBefore,
    usableMotherCount,
    hullPatchCount,
    beaconCount,
  )

  return {
    gateCardId,
    gateCardIndex,
    motherSpentTotal: payment?.motherSpentTotal ?? stressCountBefore + Math.min(fallbackMotherAfterBeacons, usableMotherCount),
    extraHumanCrewRequired: payment?.extraHumanCrewRequired ?? (
      stressCountBefore >= gateCard.gate.motherPenalty.threshold
        ? gateCard.gate.motherPenalty.extraHumanCrew
        : 0
    ),
    requiredMotherCount: payment?.requiredMotherCount ?? fallbackMotherAfterBeacons,
    motherCoveredIcons: payment?.motherCoveredIcons ?? [],
    isReady:
      payment !== null &&
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
