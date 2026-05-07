import { createMissionCard, visitRewardFind } from './factories'
import type { CardBlueprint } from '../types'

// 30 identical Open Mission placeholders — 3 dealt per sector across 10
// sectors. The real Fuel reward is computed at action time from the best
// hand pattern the stacked crew satisfies (see findBestPatternForCrew in
// rules.ts). The visit reward here is a placeholder and gets overridden
// when the mission completes.
const OPEN_MISSION_COUNT = 30

function createOpenMission(): CardBlueprint {
  return createMissionCard(
    'Mission',
    'deep-space',
    0,
    [],
    visitRewardFind('Mission Reward', []),
    'open',
  )
}

export const missionDeck: CardBlueprint[] = Array.from(
  { length: OPEN_MISSION_COUNT },
  () => createOpenMission(),
)
