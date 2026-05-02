import type { Card, CardBlueprint, RequirementIconKind, Stack } from './types'

export type HorizonStackCompletion = {
  horizonCardId: string
  horizonCardIndex: number
  requiredMotherCount: number
  isReady: boolean
}

export type GateStackCompletion = {
  gateCardId: string
  gateCardIndex: number
  isReady: boolean
  motherCardsInPlay: number
  extraCrewRequired: number
  requiredMotherCount: number
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

function countMissingNeedIcons(
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

  const missingSpecificIconCount = requirementIconKinds.reduce(
    (count, icon) => count + Math.max(0, requiredIcons[icon] - availableIcons[icon]),
    0,
  )
  const unusedCrewIconCount = requirementIconKinds.reduce(
    (count, icon) => count + Math.max(0, availableIcons[icon] - requiredIcons[icon]),
    0,
  )
  const missingAnyIconCount = Math.max(0, any - unusedCrewIconCount)

  return missingSpecificIconCount + missingAnyIconCount
}

function getMinimumCrewCountForNeedWithMother(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  motherCount: number,
) {
  const selectedCardIds: string[] = []
  let minimumCrewCount: number | null = null

  function search(startIndex: number) {
    if (minimumCrewCount !== null && selectedCardIds.length >= minimumCrewCount) {
      return
    }

    if (countMissingNeedIcons(selectedCardIds, cards, icons, any) <= motherCount) {
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

export function canCompleteNeedWithCrewAndMother(
  crewCardIds: readonly string[],
  cards: Record<string, Card>,
  icons: readonly RequirementIconKind[],
  any: number,
  motherCount: number,
  extraCrewRequired = 0,
) {
  const minimumCrewCount = getMinimumCrewCountForNeedWithMother(
    crewCardIds,
    cards,
    icons,
    any,
    motherCount,
  )

  return (
    minimumCrewCount !== null &&
    crewCardIds.length > 0 &&
    crewCardIds.length >= minimumCrewCount + extraCrewRequired
  )
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
  const hasRequiredFuel = fuelCount === requiredFuel
  const hasRequiredIcons = missingIconCount <= motherCount

  return {
    horizonCardId,
    horizonCardIndex,
    requiredMotherCount: missingIconCount,
    isReady: hasRequiredFuel && crewCardIds.length > 0 && hasRequiredIcons && !hasBlockingCard,
  }
}

export function getGateStackCompletion(
  stack: Stack,
  cards: Record<string, Card>,
  spentMotherCardCount: number,
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
  const requiredMotherCount = countMissingNeedIcons(
    crewCardIds,
    cards,
    gateCard.gate.need.icons,
    gateCard.gate.need.any,
  )
  const projectedMotherCardsInPlay = spentMotherCardCount + Math.min(requiredMotherCount, usableMotherCount)
  const minimumCrewCount = getMinimumCrewCountForNeedWithMother(
    crewCardIds,
    cards,
    gateCard.gate.need.icons,
    gateCard.gate.need.any,
    usableMotherCount,
  )
  const extraCrewRequired =
    projectedMotherCardsInPlay >= gateCard.gate.motherPenalty.threshold
      ? gateCard.gate.motherPenalty.extraCrew
      : 0

  return {
    gateCardId,
    gateCardIndex,
    motherCardsInPlay: projectedMotherCardsInPlay,
    extraCrewRequired,
    requiredMotherCount,
    isReady:
      minimumCrewCount !== null &&
      requiredMotherCount <= usableMotherCount &&
      crewCardIds.length > 0 &&
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
