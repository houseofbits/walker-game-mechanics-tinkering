<template>
  <div class="window-ui">
    <div class="title-bar">Battery

      <div class="title-bar-button" @click="emit('remove')">x</div>
    </div>
    <div class="window-content">
      Capacity: {{ batteryState.state.capacity.toFixed(1) }} Ah

      <div class="temp-bar-wrap">
        <div class="temp-bar-fill" :style="{ width: percentage + '%', background: 'green' }" />
        <span class="temp-label">{{ percentage.toFixed(0) }}% </span>
      </div>

      <button v-if="!batteryState.state.charging" class="btn-red" @click="charge()">Charge</button>
      <button v-else @click="batteryState.chargeOff()">Stop Charge</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBatteryState } from '@/composables/useBatteryState';
import { computed } from "vue";

const emit = defineEmits(['remove']);

const batteryState = useBatteryState();

const percentage = computed(() => (batteryState.state.level / batteryState.state.capacity) * 100);

function charge() {
  batteryState.charge(true);
}

</script>

<style scoped>
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
</style>