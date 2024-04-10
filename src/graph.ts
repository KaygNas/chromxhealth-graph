export interface NodeModel {
  id: string
}
export interface EdgeModel {
  id: string
  source: string
  target: string
  value: number
}
export interface GraphModel {
  nodes: NodeModel[]
  edges: EdgeModel[]
}

export class Edge {
  private _source: Node
  get source() {
    return this._source
  }
  private _target: Node
  get target() {
    return this._target
  }
  readonly model: EdgeModel
  get value() {
    return this.model.value
  }
  constructor(source: Node, target: Node, model: EdgeModel) {
    this.model = model
    this._source = source
    this._target = target
    source.addOutEdge(this)
    target.addInEdge(this)
  }
  setSource(source: Node) {
    if (this._source === source) return
    this._source = source
    source.addOutEdge(this)
  }
  setTarget(target: Node) {
    if (this._target === target) return
    this._target = target
    target.addInEdge(this)
  }
}
export class Node {
  readonly model: NodeModel
  get id() {
    return this.model.id
  }
  private _inEdges: Set<Edge>
  get inEdges() {
    return Array.from(this._inEdges)
  }
  private _outEdges: Set<Edge>
  get outEdges() {
    return Array.from(this._outEdges)
  }
  get edges() {
    return [...this.inEdges, ...this.outEdges]
  }
  get value() {
    return this.edges.reduce((acc, edge) => acc + edge.value, 0) / 2
  }
  constructor(id: string) {
    this.model = { id }
    this._inEdges = new Set()
    this._outEdges = new Set()
  }
  addInEdge(edge: Edge) {
    if (this._inEdges.has(edge)) return
    edge.setTarget(this)
    this._inEdges.add(edge)
  }
  addOutEdge(edge: Edge) {
    if (this._outEdges.has(edge)) return
    edge.setSource(this)
    this._outEdges.add(edge)
  }
}

export class Graph {
  private _nodes: Map<string, Node>
  get nodes() {
    return Array.from(this._nodes.values())
  }
  private _edges: Map<string, Edge>
  get edges() {
    return Array.from(this._edges.values())
  }
  get model() {
    return {
      nodes: this.nodes.map(node => node.model),
      edges: this.edges.map(edge => edge.model),
    }
  }
  constructor(graph: GraphModel = { nodes: [], edges: [] }) {
    this._nodes = new Map()
    this._edges = new Map()
    graph.nodes.forEach(node => this.addNode(node))
    graph.edges.forEach(edge => this.addEdge(edge))
  }
  addNode(model: NodeModel) {
    if (this._nodes.has(model.id)) return
    this._nodes.set(model.id, new Node(model.id))
  }
  addEdge(model: EdgeModel) {
    const source = this._nodes.get(model.source)
    if (!source) throw new Error(`Node ${model.source} not found`)
    const target = this._nodes.get(model.target)
    if (!target) throw new Error(`Node ${model.target} not found`)
    const edge = new Edge(source, target, model)
    this._edges.set(model.id, edge)
  }
  getNodeById(id: string) {
    return this._nodes.get(id)
  }
  getEdgeById(id: string) {
    return this._edges.get(id)
  }
}