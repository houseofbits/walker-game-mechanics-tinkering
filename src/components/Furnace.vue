<template>
  <div class="furnace" :style="style">
        <img src="/assets/furnace.png" draggable="false" />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  x: {
    type: Number,
    default: 200,
  },
  y: {
    type: Number,
    default: 200,
  },
});

const style = computed(() => ({
  position: "absolute",
  left: props.x + "px",
  top: props.y + "px",
  width: "100px",
  height: "100px",
}));
</script>

<style scoped>
.furnace {
  background: linear-gradient(145deg, #2b2b2b, #1a1a1a);
  padding: 12px;
  border: 2px solid #444;
  border-radius: 12px;
  box-shadow: inset 0 0 20px rgba(255, 80, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.furnace img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
</style>