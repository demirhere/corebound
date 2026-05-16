import {
  findSatisfiedPatternRewardsForCrew,
  getMissionPatternFuel,
} from './rules'
import {
  applyShipPartMissionEffects,
  getCrewQuartersFuelBonus,
  type MissionEffectResult,
} from './shipPartEffects'
import type {
  ActiveCrewQuarters,
  ActiveShipPart,
  Card,
  MissionPatternKind,
} from './types'

type BestOpenMissionPatternRewardArgs = {
  crewCardIds: readonly string[]
  cards: Record<string, Card>
  wildCardId?: string | null
  activeShipParts: readonly ActiveShipPart[]
  activeCrewQuarters: readonly ActiveCrewQuarters[]
  usedCrewCards: readonly Card[]
  missionIndexInSector: number
  isLastMissionInSector: boolean
  sectorIndex: number
  scrapsAvailable: number
  missionsCompletedBefore: number
  lastPatternPlayed: MissionPatternKind | null
  patternStreakBefore: number
}

export type OpenMissionPatternReward = {
  pattern: MissionPatternKind
  baseFuel: number
  fuelReward: number
  shipPartMissionEffects: MissionEffectResult
  crewQuartersFuelBonus: number
}

// Crew Quarters Upgrade preview: given the crew currently stacked on a CQU
// card, pick the best satisfied pattern and report the Fuel reward AFTER the
// upgrade is applied. Mirrors the "totalFuel" math in CrewGuideDialog (base
// pattern Fuel + ship-part deterministic bonus for this pattern + Crew
// Quarters bonus including the new +1 stack), so the stack-action label and
// the guide stay consistent. Returns null when no pattern is satisfied.
type CrewQuartersUpgradePreviewArgs = {
  crewCardIds: readonly string[]
  cards: Record<string, Card>
  activeShipParts: readonly ActiveShipPart[]
  activeCrewQuarters: readonly ActiveCrewQuarters[]
  wildCardId?: string | null
}

export type CrewQuartersUpgradePreview = {
  pattern: MissionPatternKind
  baseFuel: number
  upgradedFuel: number
}

export function getCrewQuartersUpgradePreview(
  args: CrewQuartersUpgradePreviewArgs,
): CrewQuartersUpgradePreview | null {
  const satisfied = findSatisfiedPatternRewardsForCrew(
    args.crewCardIds,
    args.cards,
    args.wildCardId ?? null,
  )
  let best: CrewQuartersUpgradePreview | null = null

  for (const candidate of satisfied) {
    const baseFuel = getMissionPatternFuel(candidate.pattern)
    // Deterministic ship-part bonus for this pattern + crew count (same set
    // used by CrewGuideDialog so the preview matches the guide).
    let shipPartBonus = 0
    for (const part of args.activeShipParts) {
      for (const effect of part.effects) {
        if (effect.kind === 'pattern' && effect.patterns.includes(candidate.pattern)) {
          shipPartBonus += effect.fuel
        } else if (effect.kind === 'pattern-tier' && effect.patterns.includes(candidate.pattern)) {
          shipPartBonus += effect.fuel
        } else if (effect.kind === 'crew-count-cap' && args.crewCardIds.length <= effect.maxCrew) {
          shipPartBonus += effect.fuel
        } else if (effect.kind === 'per-crew-used') {
          shipPartBonus += Math.min(effect.maxFuel, args.crewCardIds.length * effect.fuelPerCrew)
        }
      }
    }
    const crewQuartersBonus = getCrewQuartersFuelBonus(args.activeCrewQuarters, candidate.pattern)
    // +1 (the upgrade we're previewing) — the card adds +1 Fuel/play, the same
    // for every pattern in the generic-card design.
    const upgradedFuel = baseFuel + shipPartBonus + crewQuartersBonus + 1
    if (!best || upgradedFuel > best.upgradedFuel) {
      best = { pattern: candidate.pattern, baseFuel, upgradedFuel }
    }
  }

  return best
}

export function findBestOpenMissionPatternReward(
  args: BestOpenMissionPatternRewardArgs,
): OpenMissionPatternReward | null {
  let best: OpenMissionPatternReward | null = null

  for (const candidate of findSatisfiedPatternRewardsForCrew(
    args.crewCardIds,
    args.cards,
    args.wildCardId ?? null,
  )) {
    const shipPartMissionEffects = applyShipPartMissionEffects(args.activeShipParts, {
      usedCrewCards: args.usedCrewCards,
      missionIndexInSector: args.missionIndexInSector,
      isLastMissionInSector: args.isLastMissionInSector,
      sectorIndex: args.sectorIndex,
      pattern: candidate.pattern,
      scrapsAvailable: args.scrapsAvailable,
      missionsCompletedBefore: args.missionsCompletedBefore,
      lastPatternPlayed: args.lastPatternPlayed,
      patternStreakBefore: args.patternStreakBefore,
    })
    const crewQuartersFuelBonus = getCrewQuartersFuelBonus(
      args.activeCrewQuarters,
      candidate.pattern,
    )
    const fuelReward = Math.max(
      0,
      candidate.fuel + shipPartMissionEffects.fuelDelta + crewQuartersFuelBonus,
    )

    if (!best || fuelReward > best.fuelReward) {
      best = {
        pattern: candidate.pattern,
        baseFuel: candidate.fuel,
        fuelReward,
        shipPartMissionEffects,
        crewQuartersFuelBonus,
      }
    }
  }

  return best
}
