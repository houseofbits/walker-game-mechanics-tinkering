<template>
  <div class="window-ui">
    <div class="title-bar">
      Hopper
      <div class="title-bar-button" @click="emit('remove')">x</div>
    </div>
    <div class="window-content">
      <div class="hopper-section-columns">
        <div v-if="hopper.hopperState.enabled" class="status-line">
          Status: {{ hopper.hopperState.isFeeding ? "🔄 Feeding..." : "⏸️ Idle" }}
        </div>
        <div v-else class="status-line">
          Status: 🔴 Disabled
        </div>

        <div class="status-line small">
          Furnace Temp: {{ furnaceTemp.toFixed(1) }}°C
        </div>
      </div>

      <div class="hopper-section">
        <label>Fuel Type:</label>
        <select v-model="selectedFuelType" @change="updateFuelType" class="fuel-select">
          <option value="">-- Select Fuel --</option>
          <option v-for="fuel in availableFuels" :key="fuel.name" :value="fuel">
            {{ fuel.name }}
          </option>
        </select>
      </div>

      <div class="hopper-section-columns">
        <div class="hopper-section">
          <label>Max Capacity (kg):</label>
          <input v-model.number="maxMassInput" type="number" min="1" @change="updateMaxMass" class="input-field" />
        </div>

        <div class="hopper-section">
          <label>Temperature Threshold (°C):</label>
          <input v-model.number="thresholdInput" type="number" @change="updateThreshold" class="input-field" />
        </div>
      </div>

      <div class="hopper-section">
        <label>Fuel: {{ hopper.hopperState.mass.toFixed(1) }} / {{ hopper.hopperState.maxMass.toFixed(1) }} kg</label>
        <div class="temp-bar-wrap">
          <div class="temp-bar-fill" :style="{ width: fuelPercentage + '%', background: 'orange' }" />
          <span class="temp-label">{{ fuelPercentage.toFixed(0) }}% </span>
        </div>
      </div>

      <div class="hopper-section">
        <button @click="addFuel10kg" class="btn-blue">Add 10kg Fuel</button>
      </div>

      <div class="hopper-section">
        <button @click="hopper.toggleFeeding()" :class="hopper.hopperState.enabled ? 'btn-green' : 'btn-gray'">
          {{ hopper.hopperState.enabled ? "Auto-Feed: ON" : "Auto-Feed: OFF" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHopperState } from "@/composables/useHopperState";
import { useFurnaceSim, FuelType } from "@/composables/useFurnaceSim";
import { computed, ref, onMounted } from "vue";

const emit = defineEmits(["remove"]);

const hopper = useHopperState();
const { furnace } = useFurnaceSim();

// Available fuel types from furnace system
const availableFuels = [
  new FuelType({
    name: "Coal",
    calorificValueMJ: 32,
    burnRate: 0.45,
    ignitionTemp: 180,
    ignitionRamp: 20,
    volatility: 0.08,
    smokeFactor: 0.4,
    ashFactor: 0.5,
    maxTemp: 1200,
  }),
  new FuelType({
    name: "Wood",
    calorificValueMJ: 18,
    burnRate: 0.8,
    ignitionTemp: 120,
    volatility: 0.25,
    smokeFactor: 1.0,
    ashFactor: 0.2,
    maxTemp: 600,
  }),
];

const selectedFuelType = ref(null);
const maxMassInput = ref(hopper.hopperState.maxMass);
const thresholdInput = ref(hopper.hopperState.temperatureThreshold);

const fuelPercentage = computed(
  () => (hopper.hopperState.mass / hopper.hopperState.maxMass) * 100
);

const fuelColor = computed(() => {
  if (fuelPercentage.value > 75) return "#2ECC71";
  if (fuelPercentage.value > 50) return "#F39C12";
  if (fuelPercentage.value > 25) return "#E67E22";
  return "#E74C3C";
});

const furnaceTemp = computed(() => furnace.temperature);

function updateFuelType() {
  if (selectedFuelType.value) {
    hopper.setFuelType(selectedFuelType.value);
  }
}

function updateMaxMass() {
  hopper.setMaxMass(maxMassInput.value);
}

function updateThreshold() {
  hopper.setTemperatureThreshold(thresholdInput.value);
}

function addFuel10kg() {
  hopper.addFuelToHopper(10);
}

onMounted(() => {
  hopper.start();
});
</script>

<style scoped>
.window-content {
  padding: 12px;
}

.hopper-section-columns {
  display: flex;
  flex-direction: rows;
  justify-content: space-between;
  gap: 6px;
}

.hopper-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.fuel-select,
.input-field {
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

.fuel-select:focus,
.input-field:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.3);
}

.temp-bar-wrap {
  position: relative;
  width: 100%;
  height: 40px;
  background: #cacaca;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.temp-bar-fill {
  height: 100%;
  border-radius: 8px;
  transition: width 0.1s linear, background 0.1s linear;
}

.temp-label {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
}

button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-blue {
  background: #3498db;
  color: white;
}

.btn-blue:hover {
  background: #2980b9;
}

.btn-green {
  background: #27ae60;
  color: white;
}

.btn-green:hover {
  background: #229954;
}

.btn-gray {
  background: #95a5a6;
  color: white;
}

.btn-gray:hover {
  background: #7f8c8d;
}

.status-line {
  font-size: 13px;
  padding: 6px 8px;
  background: #ecf0f1;
  border-radius: 3px;
  margin-top: 8px;
  border-left: 3px solid #3498db;
}

.status-line.small {
  font-size: 12px;
  margin-top: 6px;
}
</style>
