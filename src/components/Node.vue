<template>
    <div :style="style" class="node" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
        <div @pointerdown="startDrag" class="title-bar">{{ props.node.title }}
            <div class="title-bar-button" @click="emit('remove')">

                <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M19.207 6.207a1 1 0 0 0-1.414-1.414L12 10.586 6.207 4.793a1 1 0 0 0-1.414 1.414L10.586 12l-5.793 5.793a1 1 0 1 0 1.414 1.414L12 13.414l5.793 5.793a1 1 0 0 0 1.414-1.414L13.414 12l5.793-5.793z"
                        fill="#fff" />
                </svg>
            </div>
        </div>
        <div class="window-content">
            <slot></slot>
        </div>

        <div v-if="isConnectTarget" @click="connector.endConnection(props.node)" class="target-selected" />

        <div v-if="props.node.inputs.length > 0" class="inputs" :style="{ height: props.node.height }">
            <div v-for="(input, i) in props.node.inputs" :key="input.id" class="circle input"
                @mousedown.right="removeConnection(i)" :ref="el => setInputRef(input.id, el)" />
        </div>
        <div v-if="props.node.hasOutputs" class="outputs" :style="{ height: props.node.height }">
            <div @click="connector.startConnection(props.node)" class="circle output" ref="outputPin" />
        </div>
    </div>

    <canvas ref="inputLinesCanvas" class="input-lines-canvas">
    </canvas>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useNodeConnector } from '../composables/useNodeConnector';
import { drawConnectedLines } from '@/helpers/lineDraw';

const connector = useNodeConnector();

const props = defineProps({
    node: {
        type: Object,
        required: true,
    },
    boardX: {
        type: Number,
        required: true,
    },
    boardY: {
        type: Number,
        required: true,
    },
    boardScale: {
        type: Number,
        required: true,
    },
})

const emit = defineEmits(['remove', 'remove-input', 'set-output']);

const isConnectTarget = computed(() => {
    return connector.connecting.value && connector.connectionStart.value?.id !== props.node.id && isHovered.value;
})

function removeConnection(i) {
    emit('remove-input', i);
}

const dragging = ref(false)

const dragPosition = ref({
    x: 0,
    y: 0,
});

const isHovered = ref(false);

const outputPin = ref(null);
const inputLinesCanvas = ref(null);
let inputLinesCtx = null;

const inputPins = ref({});

function setInputRef(id, el) {
    if (el) {
        inputPins.value[id] = el;
    } else {
        delete inputPins.value[id];
    }
}

function startDrag() {
    dragging.value = true
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', stopDrag)
}

function recalculateOutputPos() {
    if (outputPin.value) {
        const rect = outputPin.value.getBoundingClientRect();

        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        emit('set-output', x, y);
    }
}

function onMove(event) {
    dragPosition.value.x += event.movementX / props.boardScale;
    dragPosition.value.y += event.movementY / props.boardScale;

    recalculateOutputPos();
}

onMounted(() => {
    if (outputPin.value) {
        const rect = outputPin.value.getBoundingClientRect();

        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        emit('set-output', x, y);
    }
    if (inputLinesCanvas.value) {
        inputLinesCanvas.value.width = window.innerWidth;
        inputLinesCanvas.value.height = window.innerHeight;
        inputLinesCtx = inputLinesCanvas.value.getContext("2d");
    }
})

watch(() => props.node, () => {
    const elements = Object.values(inputPins.value);

    drawConnectedLines(inputLinesCtx, props.node.inputs, elements);
}, { deep: true });

watch(() => inputPins.value, () => {
    const elements = Object.values(inputPins.value);

    drawConnectedLines(inputLinesCtx, props.node.inputs, elements);
}, { deep: true });

watch(() => [props.boardScale, props.boardX, props.boardY], () => {
    recalculateOutputPos();

    const elements = Object.values(inputPins.value);

    drawConnectedLines(inputLinesCtx, props.node.inputs, elements);
}, { deep: true });

function stopDrag() {
    dragging.value = false

    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stopDrag)
}

const style = computed(() => {
    return {
        width: props.node.width,
        height: props.node.height,
        // left: `${dragPosition.value.x}px`,
        // top: `${dragPosition.value.y}px`,
        position: 'absolute',
        transform: `
      translate(${dragPosition.value.x * props.boardScale + props.boardX}px,
                ${dragPosition.value.y * props.boardScale + props.boardY}px)
      scale(${props.boardScale})
    `,
        transformOrigin: '0 0',
    }
})

</script>

<style scoped>
.node {
    position: absolute;
    width: 400px;
    height: 400px;
    display: flex;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.title-bar {
    background-color: #4f4f4f;
    color: #ffffff;
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    border-top: 1px solid #82c2ff;
    border-left: 1px solid #82c2ff;
    border-right: 1px solid #82c2ff;
    cursor: grab;
    user-select: none;
}

.target-selected {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: rgb(0, 0, 0);
    opacity: 0.5;
    border-radius: 12px;
}

.window-content {
    flex: 1;
    background-color: #cfcfcf;
    padding: 12px;
    overflow: auto;
    border-bottom: 1px solid #ffffff;
    border-left: 1px solid #ffffff;
    border-right: 1px solid #ffffff;
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
    overflow: hidden;
}

.inputs {
    height: 100%;
    width: 40px;
    position: absolute;
    bottom: 0;
    left: -20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
}

.outputs {
    height: 100%;
    width: 40px;
    position: absolute;
    bottom: 0;
    right: -20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    cursor: pointer;
}

.circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid #ffffff;
}

.input {
    background-color: #13df00;
}

.output {
    background-color: #cfcd3d;
}

.output:hover {
    background-color: #c5a100;
}

.input-lines-canvas {
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    position: fixed;
    pointer-events: none;
}
</style>