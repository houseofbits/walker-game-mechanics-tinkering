<template>
    <svg v-for="connection in board.graph.connections" :key="connection.id" class="connections">
        <path :d="board.view.getSVGPath(connection)" stroke="white" fill="none" stroke-width="2" />
    </svg>
    <svg v-if="board.graph.selectedPort.value" class="connections">
        <path :d="board.view.getActiveSVGPath(board.graph.selectedPort.value)" stroke="white" fill="none" stroke-width="2" />
    </svg>    
</template>

<script setup>

import {inject} from 'vue'

const board = inject('board')

</script>

<style scoped>
.connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>