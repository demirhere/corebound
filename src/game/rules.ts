import type { Card, CardBlueprint, RequirementIconKind, Stack } from './types'

export type HorizonStackCompletion = {
  horizonCardId: string
  horizonCardIndex: number
  isReady: boolean
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
      },
    ]
  })
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
    } else {
      hasBlockingCard = true
    }
  }

  const hasRequiredFuel = fuelCount === horizonCard.horizon.need.fuel
  const hasRequiredIcons = requirementIconKinds.every(
    (icon) => availableIcons[icon] >= requiredIcons[icon],
  )

  return {
    horizonCardId,
    horizonCardIndex,
    isReady: hasRequiredFuel && hasRequiredIcons && !hasBlockingCard,
  }
}

export function withoutCards(cards: Record<string, Card>, cardIds: string[]) {
  const nextCards = { ...cards }

  for (const cardId of cardIds) {
    delete nextCards[cardId]
  }

  return nextCards
}
