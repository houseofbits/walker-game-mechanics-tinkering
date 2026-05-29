<script setup>
import { useFurnaceSim, FuelType } from "@/composables/useFurnaceSim";

const coal = new FuelType({
  name: "Coal",
  calorificValueMJ: 32,
  burnRate: 0.45,
  ignitionTemp: 180,
  volatility: 0.08,
  smokeFactor: 0.4,
  ashFactor: 0.5,
});

const wood = new FuelType({
  name: "Wood",
  calorificValueMJ: 18,
  burnRate: 0.8,
  ignitionTemp: 120,
  volatility: 0.25,
  smokeFactor: 1.0,
  ashFactor: 0.2,
});

const { furnace, start, addFuel, temperatureColor, ignite } =
  useFurnaceSim([
    { type: coal, mass: 0 },
    { type: wood, mass: 0 },
  ]);

start();
</script>

<template>
  <div class="ui">
    <div class="furnace-ui" :style="{ background: temperatureColor }">
      <p>Temp: {{ furnace.temperature.toFixed(1) }}</p>
      <p>Smoke: {{ furnace.smokeOutput.toFixed(2) }}</p>
      <p>{{ furnace.fuels.map((f) => f.type.name + ': ' + f.mass.toFixed(1)).join(', ') }}</p>
    </div>

    <button @click="addFuel(wood, 10)">Add Wood</button>
    <button @click="addFuel(coal, 10)">Add Coal</button>
    <button @click="ignite()">Ignite</button>
  </div>
</template>