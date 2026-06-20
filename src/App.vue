<template>
  <div class="stage">
    <div class="grid-container">
      <div 
        v-for="(block, index) in gridBlocks" 
        :key="index" 
        class="grid-block"
      >
        <component 
          v-if="getComponent(index)" 
          :is="getComponent(index)"
          @remove="remove(index)"
        />
        <div v-else class="component-selector">
          <label>Select Component:</label>
          <select 
            :value="gridComponentSelection[index] || ''"
            @change="(e: any) => selectComponent(index, e.target.value)"
            class="selector-dropdown"
          >
            <option value="">-- None --</option>
            <option v-for="name in componentNames" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import FurnaceSim from "./components/FurnaceSim.vue";
import Battery from "./components/Battery.vue";
import Lights from "./components/Lights.vue";
import Hopper from "./components/Hopper.vue";
import HopperMonitor from "./components/HopperMonitor.vue";

const componentsList = {
  "Furnace": FurnaceSim,
  "Battery": Battery,
  "Lights": Lights,
  "Hopper": Hopper,
  "HopperMonitor": HopperMonitor,
};

const componentNames = Object.keys(componentsList);

const GRID_SIZE = 400;
const gridBlocks = ref([]);
const gridComponentSelection = ref<(string | null)[]>([
  "Furnace",
  "Battery",
]);

function remove(index: number) {
  gridComponentSelection.value[index] = null;
}

const calculateGridBlocks = () => {
  const cols = Math.ceil(window.innerWidth / GRID_SIZE);
  const rows = Math.ceil(window.innerHeight / GRID_SIZE);
  const totalCells = cols * rows;
  gridBlocks.value = Array(totalCells).fill(null);
};

function selectComponent(index: number, componentName: string) {
  gridComponentSelection.value[index] = componentName;
}

function getComponent(index: number) {
  const componentName = gridComponentSelection.value[index];
  if (componentName && componentName in componentsList) {
    return (componentsList as any)[componentName];
  }
  return null;
}

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
  overflow: hidden;
}

input {
  width: auto;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
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
  padding: 8px 8px;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  border-bottom: 1px solid #005a9e;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-bar-button {
  border: none;
  color: white;
  font-size: 22px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.title-bar-button:hover {
  background: rgba(255, 255, 255, 0.5);
}

.title-bar-button:active {
  background: rgba(255, 255, 255, 0.7);
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
  justify-content: space-between;
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

.component-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-selector label {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.selector-dropdown {
  padding: 10px 12px;
  font-size: 14px;
  border: 2px solid #4a90e2;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  min-width: 150px;
}

.selector-dropdown:hover {
  background: #f0f0f0;
  border-color: #357abd;
}

.selector-dropdown:focus {
  outline: none;
  box-shadow: 0 0 6px rgba(74, 144, 226, 0.5);
}

label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

select, input {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

select:focus,
input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.3);
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>