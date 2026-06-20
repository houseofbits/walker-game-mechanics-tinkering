<template>
  <div class="window-ui">
    <div class="title-bar">HopperMonitor
      <div class="title-bar-button" @click="emit('remove')">x</div>
    </div>
    <div class="window-content">
      <div class="rows">
        <label>Hopper:</label>
        <select @change="setHopperState">
          <option value="">-- Select Hopper --</option>
          <option v-for="hopper in hopperStates" :key="hopper.name" :value="hopper.name">
            {{ hopper.name }}
          </option>
        </select>
      </div>

      <template v-if="!monitor.hopperState.value">
        <div class="monitor-off-content">
          ⚠️ No Hopper Selected
        </div>
      </template>
      <template v-else>
        <div v-if="monitorState.isOn" class="crt-monitor">
          <div class="monitor-screen">
            <div class="scan-line"></div>
            <div class="monitor-content">
              <div class="monitor-line">{{ hopper.hopperState.value?.enabled ? "STATUS: ENABLED" : "STATUS: DISABLED" }}</div>
              <div class="monitor-line">FUEL TYPE: {{ hopper.hopperState.value?.fuelType?.name || "NONE" }}</div>
              <div class="monitor-line">TEMP THRESHOLD: {{ hopper.hopperState.value?.temperatureThreshold }}°C</div>
              <div class="monitor-line">FUEL LEVEL: {{ hopper.hopperState.value?.mass.toFixed(1) }}/{{
                hopper.hopperState.value?.maxMass.toFixed(1) }} KG</div>
              <div class="monitor-line">CAPACITY: {{ fuelPercentage.toFixed(0) }}%</div>
              <div class="monitor-line separator">---</div>
              <div class="monitor-line">MODE: {{ hopper.hopperState.value?.isFeeding ? "FEEDING..." : "IDLE" }}</div>
            </div>
          </div>
        </div>
        <div v-else class="crt-monitor">
          <div class="monitor-off-content">
            📺 MONITOR OFF
          </div>
        </div>

        <div class="control-section">
          <button v-if="!monitorState.isOn" class="btn-monitor-on" @click="hopper.toggle()">
            Turn Monitor On
          </button>
          <button v-else class="btn-monitor-off" @click="hopper.toggle()">
            Turn Monitor Off
          </button>

          <button @click="hopper.toggleHopperFeeding()"
            :class="hopper.hopperState.value?.enabled ? 'btn-feed-on' : 'btn-feed-off'">
            {{ hopper.hopperState.value?.enabled ? "Feeding: ON" : "Feeding: OFF" }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useHopperMonitorState } from "@/composables/useHopperMonitorState";
import { computed, onMounted, onUnmounted } from "vue";
import { hopperStates, fingHopperStateByName } from "@/composables/useHopperState";

const emit = defineEmits(["remove"]);

const monitor = useHopperMonitorState();
const monitorState = monitor.state;
const hopperState = monitor.hopperState;

// Wrap methods for template binding
const hopper = {
  hopperState,
  toggle: () => monitor.toggle(),
  toggleHopperFeeding: () => monitor.toggleHopperFeeding(),
};

const fuelPercentage = computed(() => {
  if (hopperState.value?.maxMass === 0) return 0;
  return (hopperState.value?.mass / hopperState.value?.maxMass) * 100;
});

function setHopperState(event) {
  const selectedName = event.target.value;
  const selectedHopper = fingHopperStateByName(selectedName);
  if (selectedHopper) {
    monitor.setHopperState(selectedHopper);
  } else {
    monitor.setHopperState(null); 
  }
}

onMounted(() => {
  hopperState.value?.start();
});

onUnmounted(() => {
  monitor.stopDrain();
});
</script>

<style scoped>
/* CRT Monitor Styling */
.crt-monitor {
  background: #0a0a0a;
  border: 3px solid #333;
  border-radius: 16px;
  padding: 12px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 255, 0, 0.2);
  position: relative;
  overflow: hidden;
  height: 160px;
}

.monitor-screen {
  position: relative;
  font-family: "Courier New", monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #00ff00;
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
}

/* Scan line effect */
.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(to bottom,
      rgba(0, 0, 0, 0.15) 0px,
      rgba(0, 0, 0, 0.15) 1px,
      transparent 1px,
      transparent 2px);
  pointer-events: none;
  z-index: 1;
  animation: scanlines 8s linear infinite;
}

@keyframes scanlines {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(10px);
  }
}

.monitor-content {
  position: relative;
  z-index: 2;
  letter-spacing: 1px;
}

.monitor-line {
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.monitor-line.separator {
  color: #00aa00;
  opacity: 0.6;
}

.monitor-off-content {
  color: #5a5a5a;
  font-size: 18px;
  font-weight: bold;
  font-family: "Courier New", monospace;
}

.control-section {
  display: flex;
  gap: 8px;
}

.control-section button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.btn-monitor-on {
  background: #27ae60;
  color: white;
}

.btn-monitor-on:hover {
  background: #229954;
}

.btn-monitor-on:active {
  background: #1e8449;
}

.btn-monitor-off {
  background: #e74c3c;
  color: white;
}

.btn-monitor-off:hover {
  background: #c0392b;
}

.btn-monitor-off:active {
  background: #a93226;
}

.btn-feed-on {
  background: #3498db;
  color: white;
}

.btn-feed-on:hover {
  background: #2980b9;
}

.btn-feed-off {
  background: #95a5a6;
  color: white;
}

.btn-feed-off:hover {
  background: #7f8c8d;
}
</style>
