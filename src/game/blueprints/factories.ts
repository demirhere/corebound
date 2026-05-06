import type {
  CardBlueprint,
  CardIconKind,
  CrewSpecialization,
  DamageKind,
  DestinationFind,
  DiscoveryDetails,
  DiscoveryEffectKind,
  DiscoveryTag,
  GateDetails,
  HazardKind,
  HorizonKind,
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
  horizonArt,
  motherArt,
  resourceArt,
} from './art'

export function createResourceDeck(resource: ResourceKind, count: number) {
  const art = resourceArt[resource]
  const title = resource === 'fuel' ? 'Fuel Cell' : 'Hull Plate'

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
  specializations: [CrewSpecialization, CrewSpecialization],
  portraitIndex: number,
): CardBlueprint {
  return {
    title,
    icon: crewArt.icon,
    hue: crewArt.hue,
    accent: crewArt.accent,
    kind: 'crew',
    specializations,
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

export function createHorizonCard(
  title: string,
  horizonKind: HorizonKind,
  fuel: number,
  icons: RequirementIconKind[],
  find: DestinationFind,
): CardBlueprint {
  const art = horizonArt[horizonKind]

  return {
    title,
    icon: art.icon,
    hue: art.hue,
    accent: art.accent,
    kind: 'horizon',
    horizon: {
      kind: horizonKind,
      need: {
        fuel,
        icons,
      },
      find,
    },
  }
}

export function shipPartFind(itemName: string, shipPart: ShipPartKind): DestinationFind {
  return {
    kind: 'ship_part',
    itemName,
    shipPart,
  }
}

export function visitRewardFind(itemName: string, rewards: VisitReward[]): DestinationFind {
  return {
    kind: 'visit_reward',
    itemName,
    rewards,
  }
}

export function createGateCard(
  title: string,
  label: string,
  icons: RequirementIconKind[],
  crew: number,
  effectKind: GateDetails['effectKind'],
  effectText: string,
  clear: GateDetails['clear'],
  clearText: string,
): CardBlueprint {
  return {
    title,
    icon: gateArt.icon,
    hue: gateArt.hue,
    accent: gateArt.accent,
    kind: 'gate',
    gate: {
      label,
      need: {
        icons,
        crew,
      },
      effectKind,
      effectText,
      clear,
      clearText,
      motherPenalty: {
        threshold: 3,
        extraHumanCrew: effectKind === 'stress-extra-slot' ? 1 : 0,
      },
    },
  }
}
