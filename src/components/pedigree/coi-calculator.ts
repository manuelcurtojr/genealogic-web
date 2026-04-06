/**
 * Wright's Path Coefficient Method for COI calculation.
 * COI = Σ [ (1/2)^(L1 + L2 + 1) ]
 * L1 = generations from sire to common ancestor
 * L2 = generations from dam to common ancestor
 */

interface PedigreeNode {
  id: string
  father_id: string | null
  mother_id: string | null
}

type AncestorMap = Map<string, number[]>

function collectAncestors(
  nodeId: string | null,
  gen: number,
  maxGen: number,
  nodeMap: Map<string, PedigreeNode>,
  map: AncestorMap
) {
  if (!nodeId || gen > maxGen) return
  const node = nodeMap.get(nodeId)
  if (!node) return

  if (!map.has(nodeId)) map.set(nodeId, [])
  map.get(nodeId)!.push(gen)

  collectAncestors(node.father_id, gen + 1, maxGen, nodeMap, map)
  collectAncestors(node.mother_id, gen + 1, maxGen, nodeMap, map)
}

export function calculateCOI(
  dogId: string,
  pedigreeData: PedigreeNode[],
  maxGen: number = 10
): number {
  const nodeMap = new Map<string, PedigreeNode>()
  pedigreeData.forEach(n => nodeMap.set(n.id, n))

  const dog = nodeMap.get(dogId)
  if (!dog || !dog.father_id || !dog.mother_id) return 0

  const sireAncestors: AncestorMap = new Map()
  const damAncestors: AncestorMap = new Map()

  collectAncestors(dog.father_id, 1, maxGen - 1, nodeMap, sireAncestors)
  collectAncestors(dog.mother_id, 1, maxGen - 1, nodeMap, damAncestors)

  let coi = 0
  for (const [ancestorId, sireDepths] of sireAncestors) {
    const damDepths = damAncestors.get(ancestorId)
    if (!damDepths) continue

    for (const l1 of sireDepths) {
      for (const l2 of damDepths) {
        coi += Math.pow(0.5, l1 + l2 + 1)
      }
    }
  }

  return Math.round(coi * 10000) / 100 // percentage with 2 decimals
}

export function calculateCOIFromParents(
  sireId: string,
  damId: string,
  pedigreeData: PedigreeNode[],
  maxGen: number = 10
): number {
  const nodeMap = new Map<string, PedigreeNode>()
  pedigreeData.forEach(n => nodeMap.set(n.id, n))

  const sireAncestors: AncestorMap = new Map()
  const damAncestors: AncestorMap = new Map()

  collectAncestors(sireId, 1, maxGen - 1, nodeMap, sireAncestors)
  collectAncestors(damId, 1, maxGen - 1, nodeMap, damAncestors)

  let coi = 0
  for (const [ancestorId, sireDepths] of sireAncestors) {
    const damDepths = damAncestors.get(ancestorId)
    if (!damDepths) continue

    for (const l1 of sireDepths) {
      for (const l2 of damDepths) {
        coi += Math.pow(0.5, l1 + l2 + 1)
      }
    }
  }

  return Math.round(coi * 10000) / 100
}

export function getCOILevel(coi: number): 'green' | 'orange' | 'red' {
  if (coi <= 6.25) return 'green'
  if (coi <= 12.5) return 'orange'
  return 'red'
}

export function getCOIInterpretation(coi: number): string {
  const level = getCOILevel(coi)
  switch (level) {
    case 'green': return 'Nivel de consanguinidad bajo. La diversidad genetica es adecuada.'
    case 'orange': return 'Nivel de consanguinidad moderado. Se recomienda precaucion en futuros cruces.'
    case 'red': return 'Nivel de consanguinidad alto. Riesgo elevado de problemas geneticos hereditarios.'
  }
}
