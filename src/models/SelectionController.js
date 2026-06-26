import { reactive } from 'vue';

export default class SelectionController {
    constructor() {
        this.state = reactive({
            selectedNodes: [],
        });
    }

    select(node) {
        if (!this.isSelected(node)) {
            this.state.selectedNodes.push({ node, startX: 0, startY: 0 });
        }
    }

    clear() {
        this.state.selectedNodes = [];
    }

    isSelected(node) {
        return this.state.selectedNodes.some(n => n.node.id === node.id);
    }

    getSelected() {
        return this.state.selectedNodes;
    }

    snapshotPositions() {
        for (const selectedNode of this.state.selectedNodes) {
            selectedNode.startX = selectedNode.node.x
            selectedNode.startY = selectedNode.node.y
        }
    }

    applyDelta(dx, dy) {
        for (const entry of this.state.selectedNodes) {
            entry.node.x = entry.startX + dx
            entry.node.y = entry.startY + dy
        }
    }
}