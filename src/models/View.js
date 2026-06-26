import { reactive } from 'vue';
import Viewport from './Viewport.js'
import PortRegistry from './PortRegistry.js'
import SelectionController from './SelectionController.js'
import { buildBezierPath } from '@/helpers/svgBezier.js'

export default class View {
    constructor(graph) {
        this.graph = graph
        this.boardElement = null
        this.state = reactive({
            isDraggingNode: false,
            mouseX: 0,
            mouseY: 0,
        });
        this.dragStartWorld = null

        this.viewport = new Viewport()
        this.portRegistry = new PortRegistry()
        this.selection = new SelectionController()

        this._onMove = this.onMove.bind(this)
        this._onMouseDown = this.onMouseDown.bind(this)
        this._onMouseUp = this.onMouseUp.bind(this)
        this._onWheel = this.onWheel.bind(this)
    }

    nodeDragStart(node, event) {
        if (!event.shiftKey && !this.selection.isSelected(node)) {
            this.selection.clear()
        }

        this.selection.select(node)

        this.dragStartWorld = this.viewport.screenToWorld(event.clientX, event.clientY)

        this.selection.snapshotPositions()

        this.state.isDraggingNode = true;
    }

    onMouseDown(event) {
        if (event.button !== 2) return

        this.graph.clearPortSelection()

        this.viewport.panStart(event.clientX, event.clientY)
    }

    onMove(event) {
        this.state.mouseX = event.clientX
        this.state.mouseY = event.clientY

        if (this.state.isDraggingNode) {
            const world = this.viewport.screenToWorld(event.clientX, event.clientY);

            const dx = world.x - this.dragStartWorld.x;
            const dy = world.y - this.dragStartWorld.y;

            this.selection.applyDelta(dx, dy)
        }

        this.viewport.applyPan(event.clientX, event.clientY)

        this.portRegistry.updateAll()
    }

    onWheel(event) {
        event.preventDefault();

        const rect = event.currentTarget.getBoundingClientRect();
        this.viewport.applyWheel(event, rect)

        this.portRegistry.updateAll()
    }

    onMouseUp() {
        this.state.isDraggingNode = false

        this.viewport.panStop()
    }

    unmount() {
        this.boardElement.removeEventListener('mousemove', this._onMove)
        this.boardElement.removeEventListener('mousedown', this._onMouseDown)
        this.boardElement.removeEventListener('mouseup', this._onMouseUp)
        this.boardElement.removeEventListener('wheel', this._onWheel)
    }

    mount(element) {
        this.boardElement = element

        this.boardElement.addEventListener('mousemove', this._onMove)
        this.boardElement.addEventListener('mousedown', this._onMouseDown)
        this.boardElement.addEventListener('mouseup', this._onMouseUp)
        this.boardElement.addEventListener('wheel', this._onWheel, { passive: false })
    }

    getSVGPath(connection) {
        const source = this.portRegistry.get(connection.sourcePortId);
        const target = this.portRegistry.get(connection.targetPortId);

        return buildBezierPath(
            source.x, source.y,
            target.x, target.y,
            false
        );
    }

    getActiveSVGPath(sourcePort) {
        if (!sourcePort) return;

        const source = this.portRegistry.get(sourcePort.id);

        return buildBezierPath(
            source.x, source.y,
            this.state.mouseX,
            this.state.mouseY,
            sourcePort.ioType === 'input'
        );
    }
}