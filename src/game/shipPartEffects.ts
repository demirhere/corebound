import type {
  ActiveShipPart,
  Card,
  CrewSpecialization,
  MissionPatternKind,
} from './types'

// === Constants ====================================================================

export const BASE_HAND_SIZE_LIMIT = 5
export const SHIP_PART_SLOT_CAP = 5

// === Mission context ==============================================================

export type MissionEffectContext = {
  // Crew used to satisfy the pattern this action.
  usedCrewCards: readonly Card[]
  // 0-based mission action index within this sector (0..2 for 3 actions).
  missionIndexInSector: number
  // True if this is the last mission action of the sector.
  isLastMissionInSector: boolean
  // 0-based sector index (currentSector - 1).
  sectorIndex: number
  // Pattern actually scored — for an Open mission, the dynamic best pattern.
  pattern: MissionPatternKind | null
  // Scraps available before this mission applies its effects (for converters).
  scrapsAvailable: number
  // Run-wide totals BEFORE this mission resolves (used by Compounding Drive
  // and Mission Streak to compute the bonus for the current mission). The
  // caller is responsible for incrementing the counters on BoardState after
  // applying effects.
  missionsCompletedBefore: number
  lastPatternPlayed: MissionPatternKind | null
  patternStreakBefore: number
}

export type MissionEffectResult = {
  fuelDelta: number
  scrapDelta: number
}

// Computes additive Fuel + Scrap deltas from active ship parts at mission
// completion. Negative scrapDelta values (Emergency Reserves spending) are
// gated by `scrapsAvailable`; insufficient Scraps means the trigger is
// skipped entirely (no fuel either).
export function applyShipPartMissionEffects(
  parts: readonly ActiveShipPart[],
  ctx: MissionEffectContext,
): MissionEffectResult {
  let fuelDelta = 0
  let scrapDelta = 0
  let scrapsLeft = ctx.scrapsAvailable

  for (const part of parts) {
    for (const effect of part.effects) {
      if (effect.kind === 'icon') {
        const matches = ctx.usedCrewCards.some((card) =>
          (card.specializations ?? []).includes(effect.icon as CrewSpecialization),
        )
        if (matches) fuelDelta += effect.fuel
        continue
      }

      if (effect.kind === 'pattern') {
        if (ctx.pattern && effect.patterns.includes(ctx.pattern)) {
          fuelDelta += effect.fuel
        }
        continue
      }

      if (effect.kind === 'first-mission') {
        if (ctx.missionIndexInSector === 0) fuelDelta += effect.fuel
        continue
      }

      if (effect.kind === 'last-mission') {
        if (ctx.isLastMissionInSector) fuelDelta += effect.fuel
        continue
      }

      if (effect.kind === 'scrap') {
        if (effect.perMission) scrapDelta += effect.perMission
        if (effect.perFirstMission && ctx.missionIndexInSector === 0) {
          scrapDelta += effect.perFirstMission
        }
        if (effect.perLastMission && ctx.isLastMissionInSector) {
          scrapDelta += effect.perLastMission
        }
        continue
      }

      if (effect.kind === 'converter' && effect.trigger === 'first-mission') {
        if (ctx.missionIndexInSector !== 0) continue
        if (scrapsLeft >= effect.scrapsSpent) {
          scrapsLeft -= effect.scrapsSpent
          scrapDelta -= effect.scrapsSpent
          fuelDelta += effect.fuelGained
        }
        continue
      }

      if (effect.kind === 'crew-count-cap') {
        if (ctx.usedCrewCards.length <= effect.maxCrew) {
          fuelDelta += effect.fuel
        }
        continue
      }

      if (effect.kind === 'per-crew-used') {
        fuelDelta += Math.min(
          effect.maxFuel,
          ctx.usedCrewCards.length * effect.fuelPerCrew,
        )
        continue
      }

      if (effect.kind === 'mission-counter') {
        const stacks = Math.min(
          effect.maxStacks,
          Math.floor(ctx.missionsCompletedBefore / effect.interval),
        )
        fuelDelta += stacks * effect.fuelPerStack
        continue
      }

      if (effect.kind === 'pattern-streak') {
        if (ctx.pattern && ctx.pattern === ctx.lastPatternPlayed) {
          fuelDelta += Math.min(
            effect.maxBonus,
            ctx.patternStreakBefore * effect.fuelPerStreak,
          )
        }
        continue
      }

      if (effect.kind === 'pattern-tier') {
        if (ctx.pattern && effect.patterns.includes(ctx.pattern)) {
          fuelDelta += effect.fuel
        }
        continue
      }

      // Other effect kinds (wild / hand / sector-end-*) are applied
      // elsewhere — skip here.
    }
  }

  return { fuelDelta, scrapDelta }
}

// === Sector-end ==================================================================

export type SectorEndContext = {
  sectorIndex: number
  // Scraps after the gate-fuel cost has been paid, before sector-end joker
  // effects.
  scrapsAfterGate: number
  // Number of Ready (unused) crew at the moment the gate is faced. Used by
  // Reserve Capacitor to award fuel for unused crew.
  readyCrewCount: number
}

export type SectorEndResult = {
  fuelDelta: number
  scrapDelta: number
}

export function applyShipPartSectorEndEffects(
  parts: readonly ActiveShipPart[],
  ctx: SectorEndContext,
): SectorEndResult {
  let fuelDelta = 0
  let scrapDelta = 0
  let scrapsLeft = ctx.scrapsAfterGate

  for (const part of parts) {
    for (const effect of part.effects) {
      if (effect.kind === 'scrap') {
        if (effect.perSectorEnd) {
          scrapDelta += effect.perSectorEnd
          scrapsLeft += effect.perSectorEnd
        }
        continue
      }

      if (effect.kind === 'converter' && effect.trigger === 'sector-end') {
        if (scrapsLeft >= effect.scrapsSpent) {
          scrapsLeft -= effect.scrapsSpent
          scrapDelta -= effect.scrapsSpent
          fuelDelta += effect.fuelGained
        }
        continue
      }

      if (effect.kind === 'sector-end-fuel') {
        if (effect.sectors.length === 0 || effect.sectors.includes(ctx.sectorIndex)) {
          fuelDelta += effect.fuel
        }
        continue
      }

      if (effect.kind === 'sector-end-ready-crew') {
        const cappedCrew = Math.min(effect.maxCrew, ctx.readyCrewCount)
        fuelDelta += cappedCrew * effect.fuelPerCrew
        continue
      }
    }
  }

  return { fuelDelta, scrapDelta }
}

// === Crew capacity + wild slot ====================================================

export function getShipPartHandSizeLimit(parts: readonly ActiveShipPart[]): number {
  let limit = BASE_HAND_SIZE_LIMIT
  for (const part of parts) {
    for (const effect of part.effects) {
      if (effect.kind === 'hand') {
        limit += effect.handSizeDelta
      }
    }
  }
  return Math.max(1, limit)
}

export function hasShipPartWildSlot(parts: readonly ActiveShipPart[]): boolean {
  return parts.some((part) => part.effects.some((effect) => effect.kind === 'wild'))
}
