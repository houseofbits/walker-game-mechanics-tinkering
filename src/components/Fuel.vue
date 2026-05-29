<template>
  <div
    class="draggable"
    :style="style"
    @pointerdown="onPointerDown"
  >
    <img :src="src" draggable="false" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  src: {
    type: String,
    required: true,
  },
  initialX: {
    type: Number,
    default: 100,
  },
  initialY: {
    type: Number,
    default: 100,
  },
});

const x = ref(props.initialX);
const y = ref(props.initialY);

let offsetX = 0;
let offsetY = 0;
let dragging = false;

const style = computed(() => ({
  position: "absolute",
  width: "100px",
  height: "100px",
  left: x.value + "px",
  top: y.value + "px",
  cursor: dragging ? "grabbing" : "grab",
  userSelect: "none",
}));

function onPointerDown(e) {
  dragging = true;

  offsetX = e.clientX - x.value;
  offsetY = e.clientY - y.value;

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);

  e.target.setPointerCapture?.(e.pointerId);
}

function onPointerMove(e) {
  if (!dragging) return;

  x.value = e.clientX - offsetX;
  y.value = e.clientY - offsetY;
}

function onPointerUp() {
  dragging = false;

  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
}
</script>

<style scoped>
.draggable {
  display: flex;
  align-items: center;
  justify-content: center;
}

.draggable img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
</style>