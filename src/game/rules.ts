import type { Card, CardBlueprint, RequirementIconKind, Stack } from './types'

export type HorizonStackCompletion = {
  horizonCardId: string
  horizonCardIndex: number
  isReady: boolean
}

export type GateStackCompletion = {
  gateCardId: string
  gateCardIndex: number
  isReady: boolean
  motherCardsInPlay: number
  extraCrewRequired: number
}

const requirementIconKinds = ['life', 'star', 'engine', 'signal'] as const

export function isFaceDownStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === false)
}

export function isFaceUpStack(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length > 0 && stack.cardIds.every((cardId) => cards[cardId]?.faceUp === true)
}

export function isSingleFaceDownCard(stack: Stack, cards: Record<string, Card>) {
  return stack.cardIds.length === 1 && cards[stack.cardIds[0]]?.faceUp === false
}

export function canStackCards(sourceStack: Stack, targetStack: Stack, cards: Record<string, Card>) {
  return isFaceUpStack(sourceStack, cards) && isFaceUpStack(targetStack, cards)
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

function satisfiesGateNeed(
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

  for (const icon of requirementIconKinds) {
    if (availableIcons[icon] < requiredIcons[icon]) {
      return false
    }
  }

  const unusedIconCount = requirementIconKinds.reduce(
    (count, icon) => count + availableIcons[icon] - requiredIcons[icon],
    0,
  )

  return unusedIconCount >= any
}

function getMinimumCrewCountForGateNeed(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
) {
  const selectedCardIds: string[] = []
  let minimumCrewCount: number | null = null

  function search(startIndex: number) {
    if (minimumCrewCount !== null && selectedCardIds.length >= minimumCrewCount) {
      return
    }

    if (satisfiesGateNeed(selectedCardIds, cards, icons, any)) {
      minimumCrewCount = selectedCardIds.length
      return
    }

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

  return minimumCrewCount
}

export function getHorizonStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
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

  const requiredIcons = countRequirementIcons(horizonCard.horizon.need.icons)
  const availableIcons: Record<RequirementIconKind, number> = {
    life: 0,
    star: 0,
    engine: 0,
    signal: 0,
  }
  let fuelCount = 0
  let motherCount = 0
  let hasBlockingCard = false

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
      for (const specialization of card.specializations ?? []) {
        availableIcons[specialization] += 1
      }
    } else if (card.kind === 'mother') {
      motherCount += 1
    } else {
      hasBlockingCard = true
    }
  }

  const missingIconCount = requirementIconKinds.reduce(
    (count, icon) => count + Math.max(0, requiredIcons[icon] - availableIcons[icon]),
    0,
  )
  const hasRequiredFuel = fuelCount === horizonCard.horizon.need.fuel
  const hasRequiredIcons = missingIconCount <= motherCount

  return {
    horizonCardId,
    horizonCardIndex,
    isReady: hasRequiredFuel && hasRequiredIcons && !hasBlockingCard,
  }
}

export function getGateStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  motherCardsInPlay: number,
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

  for (const cardId of stack.cardIds) {
    if (cardId === gateCardId) {
      continue
    }

    if (cards[cardId]?.kind !== 'crew') {
      hasBlockingCard = true
    }
  }

  const crewCardIds = getCrewCardIds(stack, cards)
  const minimumCrewCount = getMinimumCrewCountForGateNeed(
    crewCardIds,
    cards,
    gateCard.gate.need.icons,
    gateCard.gate.need.any,
  )
  const extraCrewRequired =
    motherCardsInPlay >= gateCard.gate.motherPenalty.threshold
      ? gateCard.gate.motherPenalty.extraCrew
      : 0

  return {
    gateCardId,
    gateCardIndex,
    motherCardsInPlay,
    extraCrewRequired,
    isReady:
      minimumCrewCount !== null &&
      crewCardIds.length >= minimumCrewCount + extraCrewRequired &&
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
