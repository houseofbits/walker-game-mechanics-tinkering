<template>
        <Board />
        <button class="btn btn-add-node" @click="addLightNode">Add node</button>
</template>

<script setup>
import Board from './Board.vue';
import useBoardNodes from "./composables/useBoardNodes.js";
import Lights from "./components/Lights.vue";
import BaseNode from "./models/BaseNode.js";

const { addNode } = useBoardNodes();

function addLightNode() {
    addNode(new BaseNode(Lights, 'Light',
        {
            name: 'Main Lights',
            isOn: false,
            isLit: false,
            ampsDrain: 0,
        }));
}

</script>

<style scoped>

.btn-add-node {
    position: absolute;
    top: 20px;
    left: 20px;
}
</style>