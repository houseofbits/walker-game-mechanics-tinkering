<template>
    <div class="board">
        <Node v-for="node in nodes" :node="node" :key="node.id" @set-output="(x, y) => setOutputPos(node, x, y)"
            :board-x="boardX" :board-y="boardY" :board-scale="boardScale" @remove="removeNode(node)"
            @remove-input="(i) => removeInput(node, i)">
            <component :is="node.component" :node="node" />
        </Node>
    </div>
    <canvas id="connection-canvas" ref="connectionCanvas" />
</template>

<script setup>
import Node from './components/Node.vue';
import { ref, onMounted, onUnmounted } from 'vue';
import { useNodeConnector } from './composables/useNodeConnector';
import { drawConnection } from './helpers/lineDraw';
import useBoardNodes from "./composables/useBoardNodes.js";

let ctx = null;
const { nodes } = useBoardNodes();
const connectionCanvas = ref(null);
const boardX = ref(0.0);
const boardY = ref(0.0);
const boardScale = ref(1.0);
let draggingBoard = false
let lastBoardX = 0
let lastBoardY = 0

function onMouseDown(e) {
    if (e.button !== 2) return // right mouse only

    draggingBoard = true
    lastBoardX = e.clientX
    lastBoardY = e.clientY
}

function onMouseMove(e) {
    if (!draggingBoard) return

    const dx = e.clientX - lastBoardX
    const dy = e.clientY - lastBoardY

    boardX.value += dx
    boardY.value += dy

    lastBoardX = e.clientX
    lastBoardY = e.clientY
}

function onMouseUp() {
    draggingBoard = false
}

function setOutputPos(node, x, y) {
    node.outputX = x;
    node.outputY = y;
}

function removeInput(node, i) {
    node.inputs[i].linked = null;
    node.inputs.splice(i, 1);
}

function removeNode(node) {
    const index = nodes.value.findIndex(n => n.id === node.id);

    if (node.linked) {
        node.linked.inputs = node.linked.inputs.filter(n => n.id !== node.id);
    }

    if (index !== -1) {
        nodes.value.splice(index, 1);
    }
}

const mouse = { x: 0, y: 0 };

const connector = useNodeConnector();

onMounted(() => {
    const canvas = connectionCanvas.value;
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        document.addEventListener("mousemove", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;

            redraw();
        });
    }

    ctx = connectionCanvas.value.getContext("2d");

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
});

onUnmounted(() => {
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
})

function redraw() {
    ctx.clearRect(0, 0, connectionCanvas.value.width, connectionCanvas.value.height);

    if (!connector.connecting.value && !connector.connectionStart.value) {
        return;
    }

    // fixed node socket position
    const start = { x: connector.connectionStart.value.outputX, y: connector.connectionStart.value.outputY };

    // mouse is dynamic end point
    drawConnection(ctx, start, mouse);
}


function onWheel(e) {
    e.preventDefault()

    const step = 0.01;

    if (e.deltaY > 0) {
        boardScale.value -= step
    } else {
        boardScale.value += step
    }
}

</script>
<style scoped>
.board {
    background-color: #8f8f8f;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

#connection-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}
</style>