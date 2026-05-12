import type {
  ActiveShipPart,
  CardBlueprint,
  CardIconKind,
  CrewQuartersBlueprint,
  CrewSpecialization,
  DamageKind,
  DestinationFind,
  DiscoveryDetails,
  DiscoveryEffectKind,
  DiscoveryTag,
  GateDetails,
  HazardKind,
  MissionKind,
  MissionPatternKind,
  RequirementIconKind,
  ResourceKind,
  ShipPartKind,
  VisitReward,
} from '../types'
import {
  crewArt,
  discoveryArt,
  driftArt,
  gateArt,
  hazardArt,
  missionArt,
  motherArt,
  resourceArt,
} from './art'

export function createResourceDeck(resource: ResourceKind, count: number) {
  const art = resourceArt[resource]
  const title =
    resource === 'fuel'
      ? 'Fuel Cell'
      : resource === 'scrap'
        ? 'Scrap'
        : 'Hull Plate'

  return Array.from({ length: count }, (): CardBlueprint => ({
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'resource',
    resource,
  }))
}

export function createMotherDeck(count: number) {
  return Array.from({ length: count }, (): CardBlueprint => ({
    title: 'MOTHER',
    icon: motherArt.icon,
    hue: motherArt.hue,
    accent: motherArt.accent,
    kind: 'mother',
  }))
}

export function createCrewCard(
  title: string,
  specializations: [CrewSpecialization] | [CrewSpecialization, CrewSpecialization],
  portraitIndex: number,
  rank: number = 1,
): CardBlueprint {
  return {
    title,
    icon: crewArt.icon,
    hue: crewArt.hue,
    accent: crewArt.accent,
    kind: 'crew',
    specializations,
    rank,
    portraitIndex,
  }
}

export function createDiscoveryCard(
  title: string,
  tag: DiscoveryTag,
  effectKind: DiscoveryEffectKind,
  effectText: string,
  icon: CardIconKind,
  specimenIndex: number,
  options: Pick<DiscoveryDetails, 'icon' | 'amount'> = {},
): CardBlueprint {
  return {
    title,
    icon,
    hue: discoveryArt.hue,
    accent: discoveryArt.accent,
    kind: 'discovery',
    discovery: {
      tag,
      effectKind,
      effectText,
      ...options,
    },
    specimenIndex,
  }
}

export function createDriftCard(title: string, effectKind: 'burn' | 'fatigue', effectText: string): CardBlueprint {
  return {
    title,
    icon: driftArt.icon,
    hue: driftArt.hue,
    accent: driftArt.accent,
    kind: 'drift',
    drift: {
      effectKind,
      effectText,
    },
  }
}

export function createHazardCard(
  title: string,
  kind: HazardKind,
  effectText: string,
  clearText: string,
  damageTitle: string,
  damageEffectText: string,
  flavorText: string,
): CardBlueprint {
  const art = hazardArt[kind]

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'hazard',
    hazard: {
      kind,
      effectText,
      clearText,
      damageTitle,
      damageEffectText,
      flavorText,
      effectImplemented: true,
    },
  }
}

export function createDamageCard(
  title: string,
  kind: DamageKind,
  damageEffectText: string,
  flavorText: string,
  effectImplemented = true,
): CardBlueprint {
  const art = hazardArt[kind]
  const displayEffectText = effectImplemented
    ? damageEffectText
    : `${damageEffectText} (to be implemented)`

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'hazard',
    hazard: {
      kind,
      effectText: displayEffectText,
      clearText: '',
      damageTitle: title,
      damageEffectText: displayEffectText,
      flavorText,
      effectImplemented,
    },
  }
}

export function createMissionCard(
  title: string,
  missionKind: MissionKind,
  fuel: number,
  icons: RequirementIconKind[],
  find: DestinationFind,
  pattern?: MissionPatternKind,
): CardBlueprint {
  const art = missionArt[missionKind]

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'mission',
    mission: {
      kind: missionKind,
      need: {
        fuel,
        icons,
      },
      ...(pattern ? { pattern } : {}),
      find,
    },
  }
}

export function shipPartFind(
  itemName: string,
  shipPart: ShipPartKind,
  rewards: VisitReward[] = [],
): DestinationFind {
  return {
    kind: 'ship_part',
    itemName,
    shipPart,
    rewards,
  }
}

export function visitRewardFind(itemName: string, rewards: VisitReward[]): DestinationFind {
  return {
    kind: 'visit_reward',
    itemName,
    rewards,
  }
}

export function createActiveShipPartBlueprint(shipPart: ActiveShipPart): CardBlueprint {
  return {
    title: shipPart.label,
    // Blue counterpart to the purple deep-space mission art (hue 282).
    icon: 'hex',
    hue: 210,
    accent: '#7ab8ff',
    kind: 'active-ship-part',
    shipPart,
  }
}

export function createCrewQuartersBlueprint(quarters: CrewQuartersBlueprint): CardBlueprint {
  return {
    title: quarters.label,
    // Warm amber accent — different from the cool blue ship parts and the
    // crew-card teals so Crew Quarters reads as a distinct dialog offer.
    icon: 'person',
    hue: 32,
    accent: '#f5b061',
    kind: 'crew-quarters',
    crewQuarters: quarters,
  }
}

export function createGateCard(
  title: string,
  label: string,
  fuel: number,
  icons: RequirementIconKind[],
  crew: number,
  effectKind: GateDetails['effectKind'],
  effectText: string,
  clear: GateDetails['clear'],
  clearText: string,
  backgroundIndex: number,
): CardBlueprint {
  return {
    title,
    icon: gateArt.icon,
    hue: gateArt.hue,
    accent: gateArt.accent,
    kind: 'gate',
    gate: {
      label,
      backgroundIndex,
      need: {
        fuel,
        icons,
        crew,
      },
      effectKind,
      effectText,
      clear,
      clearText,
      motherPenalty: {
        threshold: 3,
        extraHumanCrew: 0,
      },
    },
  }
}
