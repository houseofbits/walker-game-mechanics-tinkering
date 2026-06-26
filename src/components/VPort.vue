<template>
    <div :style="style" class="port" ref="portEl" @click="board.graph.selectPort(props.port)">

    </div>
</template>

<script setup>

import {ref, onMounted, onUnmounted, inject, computed} from 'vue'

const board = inject('board')

const props = defineProps({
    port: {
        type: Object,
        required: true,
    }
});

const portEl = ref(null);   //ref<HTMLElement>()
let observer//: ResizeObserver

onMounted(() => {
    board.view.portRegistry.register(props.port.id, portEl.value);

    observer = new ResizeObserver(() => {
        board.view.portRegistry.update(
            props.port.id
        )
    })

    observer.observe(portEl.value)    
})

onUnmounted(() => {
    observer.disconnect()

    board.view.portRegistry.unregister(props.port.id);
    
});

const style = computed(() => {
    return {
        'background-color': props.port.color,
    }
})

</script>

<style scoped>
    .port {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid white;
        background-color: white;
    }
    .port:hover {
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
    }
</style>