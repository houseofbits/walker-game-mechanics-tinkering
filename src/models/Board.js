import Graph from './Graph.js'
import View from './View.js'
import Port from './Port.js'
import BaseNode from './BaseNode.js'

export default class Board {
    constructor() {
        this.graph = new Graph()
        this.view = new View(this.graph)
    }
}