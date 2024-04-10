import { init } from "echarts/types/src/echarts.all.js"
import { EdgeModel, Graph, Node, Edge, NodeModel, GraphModel } from "./graph"


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
  node: Node
  shape: ArcShape
}

export interface BezierCurve {
  shape: BezierCurveShape
}

export class CirCosModel {
  graph: Graph
  outterArcs: Arc[]
  innerArcGroups: Arc[][]
  innerBezierCurves: BezierCurve[]

  get model() {
    const ids = this.graph.nodes.map(node => ([node.id]))
    return [['id'], ...ids]
  }

  constructor(graphModel: GraphModel) {
    this.graph = this.initGraph(graphModel)
    this.outterArcs = this.initOutterArcs(this.graph)
    this.innerArcGroups = this.initInnerArcGroups(this.graph)
    this.innerBezierCurves = this.initInnerBezierCurves(this.graph)
  }

  initGraph(graphModel: GraphModel) {
    const graph = new Graph(graphModel)
    return graph
  }

  initOutterArcs(graph: Graph) {
    // Sum of all nodes' value must be 1
    const GAP = 0.01
    const totalGapSize = GAP * (graph.nodes.length - 1)
    const scale = 1 - totalGapSize
    let start = 0
    const arcs = graph.nodes.map(node => {
      const end = start + node.value * scale
      const arc: Arc = ({
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

  initInnerArcGroups(graph: Graph) {
    const GAP = 0.01
    let start = 0
    const arcGroups = graph.nodes.map(node => {
      let end = 0
      const group = node.edges.map(edge => {
        end = start + edge.value
        const arc: Arc = {
          node: edge.source,
          shape: {
            start: start,
            end: end,
            cx: 0,
            cy: 0,
            r: 0.8,
          }
        }
        start = end
        return arc
      })
      start = end + GAP
      return group
    })
    return arcGroups
  }

  initInnerBezierCurves(graph: Graph) {
    // TODO
    return []
  }
}