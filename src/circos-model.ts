import { Graph, Node, Edge, GraphModel } from "./graph"
import { assert } from "./utils"


export interface ArcShape {
  // 组成圆环的片段，值在 0 到 1 之间
  start: number
  end: number
  cx: number
  cy: number
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

export interface Arc {
  shape: ArcShape
}

export interface OutterArc extends Arc {
  node: Node
}

export interface InnerArc extends Arc {
  node: Node
  parent: OutterArc
}

export interface BezierCurve {
  edge: Edge
  shape: BezierCurveShape
}

export class CirCosModel {
  graph: Graph
  outterArcs: OutterArc[]
  innerArcs: InnerArc[]
  innerBezierCurves: BezierCurve[]

  get model() {
    return this.graph.nodes.map(node => ({ name: node.id, value: node.value }))
  }

  constructor(graphModel: GraphModel) {
    this.graph = this.initGraph(graphModel)
    this.outterArcs = this.initOutterArcs(this.graph)
    this.innerArcs = this.initInnerArcs(this.graph, this.outterArcs)
    this.innerBezierCurves = this.initInnerBezierCurves(this.graph, this.innerArcs)
  }

  initGraph(graphModel: GraphModel) {
    const graph = new Graph(graphModel)
    return graph
  }

  initOutterArcs(graph: Graph): OutterArc[] {
    // Sum of all nodes' value must be 1
    const GAP = 0.01
    const totalGapSize = GAP * graph.nodes.length
    const scale = 1 - totalGapSize
    let start = 0
    const arcs = graph.nodes.map(node => {
      const end = start + node.value * scale
      const arc: OutterArc = ({
        node,
        shape: {
          start: start,
          end: end,
          cx: 0,
          cy: 0,
          r: 1,
        },
      })
      start = end + GAP
      return arc
    })
    return arcs
  }

  initInnerArcs(graph: Graph, outterArcs: OutterArc[]): InnerArc[] {
    const GAP = 0.015
    const totalGapSize = GAP * graph.nodes.length
    const scale = 1 - totalGapSize
    let start = 0
    const arcGroups = graph.nodes.map(node => {
      let end = 0
      const outterArc = outterArcs.find(arc => arc.node === node)
      assert(!!outterArc, `outterArc not found for node ${node.id}`)
      const group = node.edges.map(edge => {
        end = start + edge.value / 2 * scale
        const arc: InnerArc = {
          parent: outterArc,
          node: edge.source === node ? edge.target : edge.source,
          shape: {
            start: start,
            end: end,
            cx: 0,
            cy: 0,
            r: 0.6,
          }
        }
        start = end
        return arc
      })
      start = end + GAP
      return group
    })
    return arcGroups.flat()
  }

  initInnerBezierCurves(graph: Graph, innerArcs: InnerArc[]) {
    function findArcByEdge(source: Node, target: Node) {
      const arcs = innerArcs.filter(arc => arc.parent.node === source)
      const arc = arcs.find(arc => arc.node === target)
      assert(!!arc, `arc not found for edge ${source.id} -> ${target.id}`)
      return arc
    }

    function getMiddlePointOfArc(arc: Arc) {
      const { start, end, cx, cy, r } = arc.shape
      const middleAngle = (start + end) / 2 * Math.PI * 2
      const x = cx + r * Math.cos(middleAngle)
      const y = cy + r * Math.sin(middleAngle)
      return { x, y }
    }

    const curves = graph.edges.map<BezierCurve>(edge => {
      const startArc = findArcByEdge(edge.source, edge.target)
      const endArc = findArcByEdge(edge.target, edge.source)
      const startArcMiddle = getMiddlePointOfArc(startArc)
      const endArcMiddle = getMiddlePointOfArc(endArc)
      return {
        edge,
        shape: {
          // middle point of the source arc
          x1: startArcMiddle.x,
          y1: startArcMiddle.y,
          x2: endArcMiddle.x,
          y2: endArcMiddle.y,
          // control point of the source arc
          cpx2: startArcMiddle.x,
          cpy2: startArcMiddle.y,
          // control point of the target arc
          cpx1: endArcMiddle.x,
          cpy1: endArcMiddle.y,
        }
      }
    })

    return curves
  }
}