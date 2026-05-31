<template>
  <div class="stage">
    <div class="grid-container">
      <div 
        v-for="(block, index) in gridBlocks" 
        :key="index" 
        class="grid-block"
      >
        <component 
          v-if="gridComponents[index]" 
          :is="gridComponents[index]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import FurnaceSim from "./components/FurnaceSim.vue";
import Battery from "./components/Battery.vue";

const GRID_SIZE = 400;
const gridBlocks = ref([]);
const gridComponents = [FurnaceSim, Battery];

const calculateGridBlocks = () => {
  const cols = Math.ceil(window.innerWidth / GRID_SIZE);
  const rows = Math.ceil(window.innerHeight / GRID_SIZE);
  gridBlocks.value = Array(cols * rows).fill(null);
};

onMounted(() => {
  calculateGridBlocks();
  window.addEventListener("resize", calculateGridBlocks);
});

</script>

<style>
* {
  font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif;
  font-size: 18px;
  }

body {
  margin: 0;
  padding: 0;
}

.stage {
  position: relative;
  margin: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: rgb(117, 117, 117);
  padding: 0;
}

.grid-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, 424px);
  grid-template-rows: repeat(auto-fill, 424px);
  pointer-events: auto;
}

.grid-block {
  width: 424px;
  height: 424px;
  box-sizing: border-box;
  border-right: 2px dashed rgba(200, 200, 200, 0.5);
  border-bottom: 2px dashed rgba(200, 200, 200, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: auto;
}

/* Global title bar style for reuse */
.title-bar {
  background: linear-gradient(to right, #0078d4, #0078d4);
  color: white;
  padding: 8px 16px;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  border-bottom: 1px solid #005a9e;
  user-select: none;
}

.window-ui {
  width: 400px;
  height: 400px;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.window-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

button {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
  flex-shrink: 0;
}

button:hover {
  background: #357abd;
}

button:active {
  background: #2a5aa0;
}

button.btn-red {
  background: #e74c3c;
}

button.btn-red:hover {
  background: #c0392b;
}

button.btn-red:active {
  background: #a93226;
}
</style>