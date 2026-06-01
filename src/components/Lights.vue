<template>
  <div class="window-ui">
    <div class="title-bar">Lights ({{  lightsState.state.name }})
      <div class="title-bar-button" @click="emit('remove')">x</div>

    </div>
    <div class="window-content">
      <div class="light-display">
        <div class="light-icon" :class="{
          'light-on': lightsState.state.isOn && lightsState.state.isLit,
          'light-off': !lightsState.state.isOn || lightsState.state.isOn && !lightsState.state.isLit,
        }">
          💡
        </div>
      </div>

      <div class="amps-control">
        <div class="amps-input-wrapper">
          <input v-model="lightsState.state.name" type="text"  class="name-input"/>
          <span class="amps-unit">Name</span>
        </div>

        <label>Amp Drain/min:</label>
        <div class="amps-input-wrapper">
          <input type="number" v-model.number="lightsState.state.ampsDrain"
            @change="lightsState.setAmpsDrain(lightsState.state.ampsDrain)" min="0" step="1" class="amps-input" />
          <span class="amps-unit">A</span>
        </div>
      </div>

      <button v-if="!lightsState.state.isOn" class="btn-on" @click="lightsState.toggle()">
        Turn On
      </button>
      <button v-else class="btn-off" @click="lightsState.toggle()">
        Turn Off
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLightsState } from '@/composables/useLightsState';

const emit = defineEmits(['remove']);

const lightsState = useLightsState();

</script>

<style scoped>
.light-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  height: 80px;
}

.light-icon {
  font-size: 60px;
  line-height: 1;
  transition: opacity 0.1s ease, filter 0.1s ease;
}

.light-on {
  opacity: 1;
  filter: drop-shadow(0 0 10px #FFD700) brightness(1.2);
}

.light-flickering {
  animation: flicker 0.3s infinite;
  filter: drop-shadow(0 0 5px #FF8C00);
}

.light-off {
  opacity: 0.3;
  filter: grayscale(1) brightness(0.5);
}

@keyframes flicker {

  0%,
  100% {
    opacity: 0.2;
  }

  50% {
    opacity: 1;
  }
}

.amps-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.amps-control label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.amps-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.name-input {
  width: 150px;
}

.amps-input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.3);
}

.amps-unit {
  font-size: 14px;
  color: #666;
}

.btn-on {
  background: #27ae60;
}

.btn-on:hover {
  background: #229954;
}

.btn-on:active {
  background: #1e8449;
}

.btn-off {
  background: #e74c3c;
}

.btn-off:hover {
  background: #c0392b;
}

.btn-off:active {
  background: #a93226;
}
</style>
