import Connection from '@/models/Connection.js'
import { reactive, ref } from 'vue';

export default class Graph {
    constructor() {
        this.nodes = {}        // { [id]: node }
        this.connections = reactive({})
        this.selectedPort = ref(null)        
    }

    addNode(node) {
        this.nodes[node.id] = node
    }

    removeNode(id) {
        delete this.nodes[id]
    }

    addConnection(conn) {
        this.connections[conn.id] = conn
    }

    removeConnection(id) {
        delete this.connections[id]
    }

    selectPort(port) {
        if (!this.selectedPort.value) {
            this.selectedPort.value = port
            
            return
        }

        if (this.selectedPort.value.id === port.id) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.ioType === port.ioType) {
            this.selectedPort.value = null;

            return
        }

        if (this.selectedPort.value.type !== port.type) {
            this.selectedPort.value = null;

            return
        }

        const existing = Object.values(this.connections).find(
            con =>
                (con.sourcePortId === port.id &&
                con.targetPortId === this.selectedPort.value.id) ||
                (con.targetPortId === port.id &&
                con.sourcePortId === this.selectedPort.value.id)
        )

        if (existing) {
            this.selectedPort.value = null;

            return
        }

        if (port.ioType === 'output') {
            this.addConnection(new Connection(port, this.selectedPort.value))
        } else {
            this.addConnection(new Connection(this.selectedPort.value, port))
        }

        this.selectedPort.value = null
    }

    clearPortSelection() {
        this.selectedPort.value = null
    }    
}