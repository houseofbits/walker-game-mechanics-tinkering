<template>
  <div class="stage">
    <!-- <Furnace :x="300" :y="300" />

    <Fuel :initial-x="100" :initial-y="100" src="./assets/coal.png" />
    <Fuel :initial-x="200" :initial-y="200" src="./assets/wood.png" /> -->

    <FurnaceSim />
  </div>
</template>

<script setup>
import Fuel from "./components/Fuel.vue";
import Furnace from "./components/Furnace.vue";
import FurnaceSim from "./components/FurnaceSim.vue";

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
  padding: 8px;
}
</style>