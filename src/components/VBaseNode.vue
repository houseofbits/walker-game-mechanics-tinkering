<template>
    <div @mousedown="e => dragStart(e)" :style="style" class="node" :class="{selected: isSelected}">
        <div class="title-bar">
            <slot name="title" />

            <div class="title-bar-button">
                <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M19.207 6.207a1 1 0 0 0-1.414-1.414L12 10.586 6.207 4.793a1 1 0 0 0-1.414 1.414L10.586 12l-5.793 5.793a1 1 0 1 0 1.414 1.414L12 13.414l5.793 5.793a1 1 0 0 0 1.414-1.414L13.414 12l5.793-5.793z"
                        fill="#fff" />
                </svg>
            </div>
        </div>

        <div class="window-content">
            <slot name="content" />
        </div>

        <div v-if="props.node.inputs.length > 0" class="inputs" :style="{ height: props.node.height }">
            <VPort v-for="port in props.node.inputs" :key="port.id" :port="port"></VPort>
        </div>
        <div v-if="props.node.outputs.length > 0" class="outputs" :style="{ height: props.node.height }">
            <VPort v-for="port in props.node.outputs" :key="port.id" :port="port"></VPort>
        </div>
    </div>
</template>

<script setup>
import VPort from './VPort.vue'
import { computed, onMounted, inject } from 'vue'

const board = inject('board')

const props = defineProps({
    node: {
        type: Object,
        required: true,
    }
})

function dragStart(event) {
    board.view.nodeDragStart(props.node, event);
}

const style = computed(() => {
    return {
        width: props.node.width,
        height: props.node.height,
        left: `${props.node.x.value}px`,
        top: `${props.node.y.value}px`,
    }
})

const isSelected = computed(() => {
    return board.view.selection.isSelected(props.node)
});

onMounted(() => {

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
    transition: border 100ms linear;
}

.selected {
    border: 1px solid white;
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
    overflow: hidden;
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
</style>