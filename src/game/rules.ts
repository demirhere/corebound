import type { Card, CardBlueprint, GateDetails, RequirementIconKind, Stack } from './types'

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

function canUseFuelSupport(
  crewCount: number,
  fuelCardCount: number,
  requiredFuel: number,
) {
  const remainingFuel = requiredFuel - fuelCardCount

  if (remainingFuel < 0) {
    return false
  }

  if (remainingFuel === 0) {
    return crewCount === 0
  }

  return crewCount <= remainingFuel * 2
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
      const fuelCrewCount = crewCardIds.length - iconCrewCardIds.length

      for (let iconMotherCount = 0; iconMotherCount <= Math.min(motherCount, missingIconCount); iconMotherCount += 1) {
        if (iconMotherCount === motherCount && canUseFuelSupport(fuelCrewCount, fuelCardCount, need.fuel)) {
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

function canUseAllCardsInCompletionStack(
  cardIds: readonly string[],
  cards: Record<string, Card>,
  fuelDiscount: number,
  motherSpentTotalBefore: number,
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
    return (
      getGateNeedPayment(
        crewCardIds,
        cards,
        objectiveCard.gate,
        motherSpentTotalBefore,
        motherCount,
      ) !== null ||
      canAssignUsefulSupport(
        crewCardIds,
        0,
        motherCount,
        cards,
        {
          icons: objectiveCard.gate.need.icons,
          any: objectiveCard.gate.need.any,
          fuel: 0,
        },
      )
    )
  }

  return false
}

function canStackAsSupplyPile(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  const stackedCards = [...targetStack.cardIds, ...sourceStack.cardIds].map((cardId) => cards[cardId])

  return (
    stackedCards.every((card) => card?.kind === 'resource' && card.resource === 'fuel') ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother !== true) ||
    stackedCards.every((card) => card?.kind === 'mother' && card.spentMother === true)
  )
}

export function canStackCards(
  sourceStack: Stack,
  targetStack: Stack,
  cards: Record<string, Card>,
  fuelDiscount = 0,
  motherSpentTotalBefore = 0,
) {
  return (
    isFaceUpStack(sourceStack, cards) &&
    isFaceUpStack(targetStack, cards) &&
    (
      canStackAsSupplyPile(sourceStack, targetStack, cards) ||
      canUseAllCardsInCompletionStack(
        [...targetStack.cardIds, ...sourceStack.cardIds],
        cards,
        fuelDiscount,
        motherSpentTotalBefore,
      )
    )
  )
}

export function canCombineAsDeck(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  return isSingleFaceDownCard(sourceStack, cards) && isSingleFaceDownCard(targetStack, cards)
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
                any: card.gate.need.any,
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

function getGateNeedPayment(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  motherSpentTotalBefore: number,
  usableMotherCount: number,
) {
  let extraHumanCrewRequired = motherSpentTotalBefore >= gate.motherPenalty.threshold
    ? gate.motherPenalty.extraHumanCrew
    : 0

  if (extraHumanCrewRequired === 0) {
    const basePayment = getCrewMotherNeedPayment(
      crewCardIds,
      cards,
      gate.need.icons,
      gate.need.any,
      usableMotherCount,
      0,
    )

    if (!basePayment) {
      return null
    }

    if (motherSpentTotalBefore + basePayment.requiredMotherCount >= gate.motherPenalty.threshold) {
      extraHumanCrewRequired = gate.motherPenalty.extraHumanCrew
    }
  }

  const payment = getCrewMotherNeedPayment(
    crewCardIds,
    cards,
    gate.need.icons,
    gate.need.any,
    usableMotherCount,
    extraHumanCrewRequired,
  )

  if (!payment) {
    return null
  }

  return {
    ...payment,
    extraHumanCrewRequired,
    motherSpentTotal: motherSpentTotalBefore + payment.requiredMotherCount,
  }
}

export function canCompleteGateNeedWithCrewAndMother(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  gate: GateDetails,
  motherSpentTotalBefore: number,
  usableMotherCount: number,
) {
  return getGateNeedPayment(
    crewCardIds,
    cards,
    gate,
    motherSpentTotalBefore,
    usableMotherCount,
  ) !== null
}

function canPayMissingFuelWithCrew(missingFuel: number, crewCount: number) {
  if (missingFuel === 0) {
    return true
  }

  return crewCount >= missingFuel * 2
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

    const remainingCrewCount = crewCardIds.length - selectedIconCrewCardIds.length
    if (!canPayMissingFuelWithCrew(missingFuel, remainingCrewCount)) {
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
  motherSpentTotalBefore: number,
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
    gateCard.gate.need.any,
  )
  const payment = getGateNeedPayment(
    crewCardIds,
    cards,
    gateCard.gate,
    motherSpentTotalBefore,
    usableMotherCount,
  )

  return {
    gateCardId,
    gateCardIndex,
    motherSpentTotal: payment?.motherSpentTotal ?? motherSpentTotalBefore + Math.min(fallbackRequiredMotherCount, usableMotherCount),
    extraHumanCrewRequired: payment?.extraHumanCrewRequired ?? 0,
    requiredMotherCount: payment?.requiredMotherCount ?? fallbackRequiredMotherCount,
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
