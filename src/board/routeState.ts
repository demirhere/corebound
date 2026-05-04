import {
  MAP_SLOT_COUNT,
  MAP_SLOT_POSITIONS,
  ROUTE_SLOT_COUNT,
} from '../game/setup'
import type {
  BoardState,
  RouteSlot,
  ShipPartKind,
  Stack,
} from '../game/types'

export function createEmptyRouteSlots() {
  return Array<RouteSlot | null>(ROUTE_SLOT_COUNT).fill(null)
}

export function createEmptyMapSlots() {
  return Array<string | null>(MAP_SLOT_COUNT).fill(null)
}

export function getMapStackId(slotIndex: number) {
  return `stack-map-${slotIndex + 1}`
}

export function getMapStackPosition(current: BoardState, slotIndex: number) {
  const basePosition = MAP_SLOT_POSITIONS[slotIndex] ?? MAP_SLOT_POSITIONS[0]
  const traveledStopsInLane = current.routeSlots.filter((slot) => slot?.mapSlotIndex === slotIndex).length

  return {
    x: basePosition.x + traveledStopsInLane * 3.5,
    y: basePosition.y + traveledStopsInLane * 5.5,
  }
}

export function getRefilledMapStackId(current: BoardState, slotIndex: number, cardId: string) {
  const preferredStackId = getMapStackId(slotIndex)

  return current.stacks.some((stack) => stack.id === preferredStackId)
    ? `${preferredStackId}-${cardId}`
    : preferredStackId
}

export function getRouteCardIds(routeSlots: readonly (RouteSlot | null)[]) {
  return routeSlots.flatMap((slot) => slot ? [slot.cardId] : [])
}

export function stackContainsRouteCard(stack: Stack, routeSlots: readonly (RouteSlot | null)[]) {
  const routeCardIds = new Set(getRouteCardIds(routeSlots))

  return stack.cardIds.some((cardId) => routeCardIds.has(cardId))
}

function countRouteStops(routeSlots: readonly (RouteSlot | null)[]) {
  return routeSlots.filter(Boolean).length
}

export function isRouteFilled(routeSlots: readonly (RouteSlot | null)[]) {
  return countRouteStops(routeSlots) >= ROUTE_SLOT_COUNT
}

export function countShipParts(
  routeSlots: readonly (RouteSlot | null)[],
  shipPart: ShipPartKind,
  statuses: readonly RouteSlot['status'][],
) {
  return routeSlots.reduce((count, slot) => (
    slot?.shipPart === shipPart && statuses.includes(slot.status) ? count + 1 : count
  ), 0)
}

export function countSpentShipParts(routeSlots: readonly (RouteSlot | null)[], shipPart: ShipPartKind) {
  return countShipParts(routeSlots, shipPart, ['spent'])
}

export function countPotentialGateShipParts(routeSlots: readonly (RouteSlot | null)[], shipPart: ShipPartKind) {
  return countShipParts(routeSlots, shipPart, ['available', 'spent'])
}
