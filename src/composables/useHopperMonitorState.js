import { reactive, ref } from "vue";
import { useBatteryState } from "./useBatteryState";

export function useHopperMonitorState() {
  const monitorState = reactive({
    isOn: false,
    ampsDrain: 3, // Amps consumed per second when on (CRT monitor power consumption)
  });

  let drainInterval = null;
  let hopperState = ref(null);
  const batteryState = useBatteryState();

  function toggle() {
    monitorState.isOn = !monitorState.isOn;
    if (monitorState.isOn && batteryState.state.level > 0) {
      startDrain();
    } else {
      stopDrain();
    }
  }

  function setAmpsDrain(amps) {
    monitorState.ampsDrain = Math.max(0, amps);
  }

  function startDrain() {
    if (drainInterval) return; // Prevent multiple intervals

    drainInterval = setInterval(() => {
      if (monitorState.isOn && batteryState.state.level > 0) {
        // Drain battery at the configured amp rate per minute (divide by 60 for per-second rate)
        batteryState.state.level = Math.max(0, batteryState.state.level - (monitorState.ampsDrain / 60 / 10));
      } else if (batteryState.state.level <= 0) {
        monitorState.isOn = false;
        stopDrain();
      }
    }, 100); // Update frequency matches Lights for consistency
  }

  function stopDrain() {
    if (drainInterval) {
      clearInterval(drainInterval);
      drainInterval = null;
    }
  }

  function toggleHopperFeeding() {
    // hopperState.value?.toggleFeeding();
  }

  function setHopperState(state) {
    hopperState.value = state;
  }

  return {
    state: monitorState,
    hopperState,
    toggle,
    setAmpsDrain,
    toggleHopperFeeding,
    stopDrain,
    setHopperState,
  };
}
