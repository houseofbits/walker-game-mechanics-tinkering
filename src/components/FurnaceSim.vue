<script setup>
import { computed } from "vue";
import { useFurnaceSim, FuelType } from "@/composables/useFurnaceSim";

const coal = new FuelType({
  name: "Coal",
  calorificValueMJ: 32,
  burnRate: 0.15,
  ignitionTemp: 180,
  ignitionRamp: 20,
  volatility: 0.08,
  smokeFactor: 0.4,
  ashFactor: 0.5,
  maxTemp: 1200,
});

const wood = new FuelType({
  name: "Wood",
  calorificValueMJ: 18,
  burnRate: 0.25,
  ignitionTemp: 120,
  volatility: 0.25,
  smokeFactor: 1.0,
  ashFactor: 0.2,
  maxTemp: 600,
});

const { furnace, start, addFuel, ignite } =
  useFurnaceSim([
    { type: coal, mass: 0 },
    { type: wood, mass: 0 },
  ]);

start();

const MAX_TEMP = 1000;
const tempPct = computed(() =>
  Math.min(Math.max(furnace.temperature / MAX_TEMP * 100, 0), 100)
);

// [pct, [r, g, b]] stops matching the temperature range
const COLOR_STOPS = [
  [0,   [17,  17,  17]],
  [15,  [122, 21,  0]],
  [28,  [255, 69,  0]],
  [50,  [255, 21,  0]],
  [85,  [255, 0,   170]],
  [100, [255, 136, 255]],
];

function lerpColor(pct) {
  const stops = COLOR_STOPS;
  if (pct <= stops[0][0]) return stops[0][1];
  if (pct >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, c0] = stops[i];
    const [p1, c1] = stops[i + 1];
    if (pct >= p0 && pct <= p1) {
      const t = (pct - p0) / (p1 - p0);
      return c0.map((v, j) => Math.round(v + t * (c1[j] - v)));
    }
  }
}

const tempBarColor = computed(() => {
  const [r, g, b] = lerpColor(tempPct.value);
  return `rgb(${r}, ${g}, ${b})`;
});

</script>

<template>
  <div class="ui">
    <div class="title-bar">Furnace (basic)</div>
    <div class="content">
      <div class="furnace-ui">
        <p>Smoke: {{ furnace.smokeOutput.toFixed(2) }}</p>
        <p>{{ furnace.fuels.map((f) => f.type.name + ': ' + f.mass.toFixed(1)).join(', ') }}</p>
      </div>

      <div class="temp-bar-wrap">
        <div class="temp-bar-fill" :style="{ width: tempPct + '%', background: tempBarColor }" />
        <span class="temp-label">{{ furnace.temperature.toFixed(0) }}°C</span>
      </div>

      <button @click="addFuel(wood, 10)">Add Wood</button>
      <button @click="addFuel(coal, 10)">Add Coal</button>
      <button class="btn-ignite" @click="ignite()">Ignite</button>
    </div>
  </div>
</template>

<style scoped>
.ui {
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

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

.furnace-ui {
  background: #cacaca;
  padding: 12px;
  border-radius: 8px;
  flex-grow: 1;
  overflow-y: auto;
}

.furnace-ui p {
  margin: 4px 0;
  font-size: 14px;
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

button.btn-ignite {
  background: #e74c3c;
}

button.btn-ignite:hover {
  background: #c0392b;
}

button.btn-ignite:active {
  background: #a93226;
}
</style>
