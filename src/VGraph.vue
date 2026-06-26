<template>
    <div class="graph-board" ref="boardEl" @click="onBoardClick">
        <VConnectionsLayer />

        <div class="transform-wrapper" :style="computedStyle">
            <template v-for="node in board.graph.nodes">
                <template v-if="node.isThinComponent">
                    <VBaseNode :is="node.component" :key="node.id" :node="node">
                        <template #content>
                            <component :is="node.component" :node="node" />
                        </template>
                    </VBaseNode>
                </template>

                <component v-else :is="node.component" v-for="node in board.graph.nodes" :key="node.id" :node="node" />
            </template>
        </div>
    </div>

    
</template>

<script setup>
import Lights from './components/Lights.vue';
import Board from './models/Board.js'
import Port from './models/Port.js'
import BaseNode from './models/BaseNode.js'
import { computed, onMounted, provide, ref } from 'vue';
import VConnectionsLayer from './components/VConnectionsLayer.vue';
import VBaseNode from './components/VBaseNode.vue';


const boardEl = ref(null);

const board = new Board()

provide('board', board)

board.graph.addNode(
    new BaseNode(
        [],
        [
            new Port('ss', "number", "red"),
            new Port('ss', "string", "blue")
        ],
        Lights,
    )
)

board.graph.addNode(
    new BaseNode(
        [
            new Port('ss', "number", "red")
        ], [],
        Lights
    )
)

const computedStyle = computed(() => {
    return {
        transform: `
      translate(${board.view.viewport.state.panX}px,
                ${board.view.viewport.state.panY}px)
      scale(${board.view.viewport.state.zoom})
    `,
        transformOrigin: '0 0',
    };
});

function onBoardClick(event) {
  const clickedNode = event.target.closest('.node')

  if (!clickedNode) {
    board.view.selection.clear()
  }
}

onMounted(() => {
    board.view.mount(boardEl.value)
})

</script>

<style scoped>
.graph-board {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: gray;
}

.transform-wrapper {
    position: fixed;
    width: 100%;
    height: 100%;
}
</style>