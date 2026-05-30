import { ref, onUnmounted } from 'vue';
import { createFurnaceState } from '../services/FurnaceState';
import { updateFurnaceSimulation } from '../services/FurnaceSimulation';

/**
 * Vue composable for managing furnace simulation.
 *
 * @param {Array} initialFuels - Initial array of fuel entries
 * @returns {Object} Furnace state and control methods
 */
export function useFurnaceSim(initialFuels = []) {
  const furnace = createFurnaceState(initialFuels);

  const running = ref(false);
  let raf;
  let lastTime = performance.now();

  /**
   * Animation frame loop for continuous simulation.
   */
  function loop(now) {
    if (!running.value) return;

    const dt = (now - lastTime) / 1000;
    lastTime = now;

    updateFurnaceSimulation(furnace, dt, now / 1000);

    raf = requestAnimationFrame(loop);
  }

  /**
   * Start the simulation.
   */
  function start() {
    if (running.value) return;
    running.value = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  /**
   * Stop the simulation.
   */
  function stop() {
    running.value = false;
    if (raf) cancelAnimationFrame(raf);
  }

  /**
   * Add fuel to the furnace, or increase mass if fuel type already exists.
   *
   * @param {FuelType} type - The fuel type
   * @param {number} mass - Mass of fuel to add (kg)
   */
  function addFuel(type, mass) {
    const existing = furnace.fuels.find(
      f => f.type.name === type.name
    );

    if (existing) {
      existing.mass += mass;
    } else {
      furnace.fuels.push({ type, mass });
    }
  }

  /**
   * Ignite the furnace by raising its temperature if fuel is available.
   */
  function ignite() {
    const isBurning = furnace.fuels.find(f => f.mass > 0) === undefined;
    if (!isBurning && furnace.temperature < 200) {
      furnace.temperature = 200;
    }
  }

  onUnmounted(stop);

  return {
    furnace,
    running,
    start,
    stop,
    addFuel,
    ignite,
  };
}
