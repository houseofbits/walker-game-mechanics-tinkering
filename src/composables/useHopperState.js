import { reactive, ref, onUnmounted } from "vue";
import { useFurnaceSim } from "./useFurnaceSim";
import { useBatteryState } from "./useBatteryState";

/**
 * Hopper state composable. Manages fuel storage and automatic feeding to furnace
 * while consuming electricity from the battery.
 */
export function useHopperState() {
  const { furnace, addFuel } = useFurnaceSim();
  const batteryState = useBatteryState();

  const hopperState = reactive({
    mass: 0,
    maxMass: 100, // kg, configurable
    enabled: false, // auto-feed toggle
    isFeeding: false,
    feedRate: 10, // kg/s - amount to feed per second
    temperatureThreshold: 250, // °C - feed when furnace temp drops below this
    powerConsumption: 2,
    fuelType: null,
    // New: Feed cycle tracking
    consecutiveAdds: 5, // Number of 10kg additions in current cycle
    lastAddTime: 0, // Timestamp of last fuel addition (ms)
    errorStatus: null, // Error message when limit reached
    tempAboveThresholdPreviously: true, // Track if temp was above threshold in previous tick
    lastFurnaceTemp: 15, // Last furnace temperature (for threshold crossing detection)
    // Gate: Only feed after furnace is heated above threshold
    hasReachedThreshold: false, // Set to true once furnace temp crosses above threshold
  });

  let raf;
  let lastTime = performance.now();
  const running = ref(false);

  /**
   * Reset the feeding cycle state
   */
  function resetFeedingCycle() {
    hopperState.consecutiveAdds = 0;
    hopperState.lastAddTime = 0;
    hopperState.errorStatus = null;
  }

  /**
   * Check if furnace temperature crossed the threshold
   * Returns: 'above' (went from below to above), 'below' (went from above to below), or null
   */
  function checkThresholdCrossing(currentTemp) {
    const wasAbove = hopperState.tempAboveThresholdPreviously;
    const isAbove = currentTemp >= hopperState.temperatureThreshold;

    let crossing = null;
    if (wasAbove && !isAbove) {
      crossing = 'below'; // crossed down below threshold
    } else if (!wasAbove && isAbove) {
      crossing = 'above'; // crossed up above threshold
    }

    hopperState.tempAboveThresholdPreviously = isAbove;
    return crossing;
  }

  /**
   * Add fuel to hopper (up to maxMass limit)
   */
  function addFuelToHopper(amount) {
    const available = hopperState.maxMass - hopperState.mass;
    const toAdd = Math.min(amount, available);
    hopperState.mass += toAdd;
    return toAdd;
  }

  /**
   * Toggle auto-feeding on/off
   */
  function toggleFeeding() {
    hopperState.enabled = !hopperState.enabled;
    // Reset the threshold gate when toggling off
    if (!hopperState.enabled) {
      hopperState.hasReachedThreshold = false;
    }
  }

  /**
   * Set the fuel type this hopper uses
   */
  function setFuelType(fuelType) {
    hopperState.fuelType = fuelType;
  }

  /**
   * Set maximum fuel capacity
   */
  function setMaxMass(maxMass) {
    hopperState.maxMass = Math.max(1, maxMass);
    if (hopperState.mass > hopperState.maxMass) {
      hopperState.mass = hopperState.maxMass;
    }
  }

  /**
   * Set feed rate (kg/s)
   */
  function setFeedRate(rate) {
    hopperState.feedRate = Math.max(0, rate);
  }

  /**
   * Set temperature threshold (°C)
   */
  function setTemperatureThreshold(temp) {
    hopperState.temperatureThreshold = temp;
  }

  /**
   * Update hopper state each simulation tick
   * Implements controlled feeder logic:
   * - Add 10 kg once when temp drops below threshold
   * - Wait 10 seconds before checking again
   * - Add more if still below threshold (up to 5 times)
   * - Disable feeding after 5 consecutive adds
   */
  function update(dt) {
    hopperState.isFeeding = false;

    // Check if auto-feed is enabled
    if (!hopperState.enabled) {
      hopperState.lastFurnaceTemp = furnace.temperature;
      return;
    }

    const currentTemp = furnace.temperature;

    // Update the threshold gate: mark when furnace has reached above threshold
    if (currentTemp >= hopperState.temperatureThreshold) {
      hopperState.hasReachedThreshold = true;
    }

    // Gate: Only allow feeding after furnace has been heated above threshold at least once
    if (!hopperState.hasReachedThreshold) {
      hopperState.lastFurnaceTemp = currentTemp;
      return;
    }

    // Check for hopper fuel availability and fuel type
    if (hopperState.mass <= 0 || !hopperState.fuelType) {
      hopperState.lastFurnaceTemp = currentTemp;
      return;
    }

    const crossing = checkThresholdCrossing(currentTemp);

    // Detect threshold crossing to reset feeding cycle
    if (crossing === 'below') {
      // Temperature just dropped below threshold - start new feeding cycle
      resetFeedingCycle();
    } else if (crossing === 'above') {
      // Temperature recovered above threshold - mark for potential reset
      // (reset will complete when it drops below threshold again)
    }

    // Only proceed with feeding if temp is below threshold
    if (currentTemp >= hopperState.temperatureThreshold) {
      hopperState.lastFurnaceTemp = currentTemp;
      return;
    }

    // We're below threshold - check if we should add fuel
    const now = performance.now();
    const timeSinceLastAdd = hopperState.lastAddTime > 0 ? now - hopperState.lastAddTime : Infinity;

    // Add fuel on first attempt or after 10 second wait
    const shouldAdd = hopperState.consecutiveAdds === 0 || timeSinceLastAdd >= 10000;

    if (shouldAdd) {
      // Check if we've hit the consecutive add limit
      if (hopperState.consecutiveAdds >= 5) {
        hopperState.errorStatus = 'Furnace not heating: 5 feed attempts failed';
        hopperState.enabled = false;
        hopperState.lastFurnaceTemp = currentTemp;
        return;
      }

      // Check if battery has enough power
      const currentBatteryLevel = batteryState.state.level;

      if (currentBatteryLevel < hopperState.powerConsumption) {
        hopperState.enabled = false;
        hopperState.lastFurnaceTemp = currentTemp;
        return;
      }

      // Add 10 kg to furnace (or whatever is available)
      const fuelToFeed = Math.min(10, hopperState.mass);

      if (fuelToFeed > 0) {
        addFuel(hopperState.fuelType, fuelToFeed);
        hopperState.mass -= fuelToFeed;
        hopperState.consecutiveAdds += 1;
        hopperState.lastAddTime = now;
        hopperState.isFeeding = true;

        // Consume power from battery
        batteryState.state.level = Math.max(0, batteryState.state.level - hopperState.powerConsumption);
      }
    }

    hopperState.lastFurnaceTemp = currentTemp;
  }

  /**
   * Start the update loop using requestAnimationFrame
   */
  function start() {
    if (running.value) return;
    running.value = true;
    lastTime = performance.now();

    function loop(now) {
      if (!running.value) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;

      update(dt);

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
  }

  /**
   * Stop the update loop
   */
  function stop() {
    running.value = false;
    if (raf) cancelAnimationFrame(raf);
  }

  onUnmounted(stop);

  return {
    hopperState,
    addFuelToHopper,
    toggleFeeding,
    setFuelType,
    setMaxMass,
    setFeedRate,
    setTemperatureThreshold,
    update,
    start,
    stop,
    running,
    resetFeedingCycle,
  };
}
