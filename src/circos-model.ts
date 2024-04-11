import { Graph, Node, Edge, GraphModel } from "./graph"
import { assert } from "./utils"


export interface SectorShape {
  // 组成圆环的片段，值在 0 到 1 之间
  start: number
  end: number
  cx: number
  cy: number
  r0: number
  r: number
}

export interface BezierCurveShape {
  x1: number
  y1: number
  x2: number
  y2: number
  cpx1: number
  cpy1: number
  cpx2: number
  cpy2: number
}

export interface Sector {
  shape: SectorShape
}

export interface OutterSector extends Sector {
  node: Node
}

export interface InnerSector extends Sector {
  node: Node
  parent: OutterSector
}

export interface BezierCurve {
  start: InnerSector
  end: InnerSector
  shape: BezierCurveShape
}

export class CirCosModel {
  graph: Graph
  outterSectors: OutterSector[]
  innerSectors: InnerSector[]
  innerBezierCurves: BezierCurve[]

  get model() {
    return this.graph.nodes.map(node => ({ name: node.id, value: node.value }))
  }

  constructor(graphModel: GraphModel) {
    this.graph = this.initGraph(graphModel)
    this.outterSectors = this.initOutterSectors(this.graph)
    this.innerSectors = this.initInnerSectors(this.graph, this.outterSectors)
    this.innerBezierCurves = this.initInnerBezierCurves(this.graph, this.innerSectors)
  }

  initGraph(graphModel: GraphModel) {
    const graph = new Graph(graphModel)
    return graph
  }

  initOutterSectors(graph: Graph): OutterSector[] {
    // Sum of all nodes' value must be 1
    const GAP = 0.01
    const totalGapSize = GAP * graph.nodes.length
    const scale = 1 - totalGapSize
    let start = 0
    const arcs = graph.nodes.map(node => {
      const end = start + node.value * scale
      const sector: OutterSector = ({
        node,
        shape: {
          start: start,
          end: end,
          cx: 0,
          cy: 0,
          r0: 0.95,
          r: 1,
        },
      })
      start = end + GAP
      return sector
    })
    return arcs
  }

  initInnerSectors(graph: Graph, outterSectors: OutterSector[]): InnerSector[] {
    const GAP = 0.015
    const totalGapSize = GAP * graph.nodes.length
    const scale = 1 - totalGapSize
    let start = 0
    const arcGroups = graph.nodes.map(node => {
      let end = 0
      const outterSector = outterSectors.find(sector => sector.node === node)
      assert(!!outterSector, `outterSector not found for node ${node.id}`)
      const group = node.edges.map(edge => {
        end = start + edge.value / 2 * scale
        const sector: InnerSector = {
          parent: outterSector,
          node: edge.source === node ? edge.target : edge.source,
          shape: {
            start: start,
            end: end,
            cx: 0,
            cy: 0,
            r0: 0.55,
            r: 0.6,
          }
        }
        start = end
        return sector
      })
      start = end + GAP
      return group
    })
    return arcGroups.flat()
  }

  initInnerBezierCurves(graph: Graph, innerSectors: InnerSector[]) {
    function findSectorByEdge(source: Node, target: Node) {
      const arcs = innerSectors.filter(sector => sector.parent.node === source)
      const sector = arcs.find(sector => sector.node === target)
      assert(!!sector, `sector not found for edge ${source.id} -> ${target.id}`)
      return sector
    }

    function getMiddlePointOfSector(sector: Sector) {
      const { start, end, cx, cy, r } = sector.shape
      const middleAngle = (start + end) / 2 * Math.PI * 2
      const x = cx + r * Math.cos(middleAngle)
      const y = cy + r * Math.sin(middleAngle)
      return { x, y }
    }

    const curves = graph.edges.map<BezierCurve>(edge => {
      const startSector = findSectorByEdge(edge.source, edge.target)
      const endSector = findSectorByEdge(edge.target, edge.source)
      const startSectorMiddle = getMiddlePointOfSector(startSector)
      const endSectorMiddle = getMiddlePointOfSector(endSector)
      return {
        start: startSector,
        end: endSector,
        shape: {
          // middle point of the source sector
          x1: startSectorMiddle.x,
          y1: startSectorMiddle.y,
          x2: endSectorMiddle.x,
          y2: endSectorMiddle.y,
          // control point of the source sector
          cpx1: startSector.shape.cx,
          cpy1: startSector.shape.cy,
          // control point of the target sector
          cpx2: endSector.shape.cx,
          cpy2: endSector.shape.cy,
        }
      }
    })

    return curves
  }
}