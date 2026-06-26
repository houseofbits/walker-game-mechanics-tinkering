<template>
    <v-base-node :node="node">

    </v-base-node>
</template>

<script setup>
import VBaseNode from './VBaseNode.vue';

const props = defineProps({
    node: {
        type: Object,
        required: true,
    }
})

</script>

<style scoped>

</style>