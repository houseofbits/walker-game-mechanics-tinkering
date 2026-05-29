import { ref, reactive, computed, onUnmounted } from "vue";

/* -----------------------------
   Fuel Type
------------------------------*/
export class FuelType {
  constructor({
    name,
    calorificValueMJ,
    burnRate,
    ignitionTemp,
    volatility,
    smokeFactor,
    ashFactor,
  }) {
    this.name = name;
    this.calorificValueMJ = calorificValueMJ;
    this.burnRate = burnRate;
    this.ignitionTemp = ignitionTemp;
    this.volatility = volatility;
    this.smokeFactor = smokeFactor;
    this.ashFactor = ashFactor;
  }
}

/* -----------------------------
   Furnace Factory
------------------------------*/
function createFurnace(fuels = []) {
  return reactive({
    temperature: 15,
    ambientTemperature: 15,

    thermalMass: 8.0,
    coolingCoefficient: 0.0025,

    storedHeatMJ: 0,

    fuels,

    combustionEfficiency: 0.85,

    ashLevel: 0,
    pressure: 0,

    smokeOutput: 0,
    isBurning: false,
  });
}

/* -----------------------------
   Helpers
------------------------------*/
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/* -----------------------------
   CORE SIMULATION
------------------------------*/
function updateFurnace(furnace, dt, time) {
  let totalHeat = 0;
  let totalSmoke = 0;
  let totalAsh = 0;
  let totalBurning = false;

  const totalFuelMass = furnace.fuels.reduce(
    (sum, f) => sum + f.mass,
    0
  );

  // fuel bed stability
  const fuelBedFactor = clamp(
    Math.log10(totalFuelMass + 1) / 2,
    0,
    1
  );

  for (const fuelEntry of furnace.fuels) {
    const fuel = fuelEntry.type;
    let mass = fuelEntry.mass;

    if (mass <= 0) continue;

    /* -----------------------------
       IGNITION (FIXED)
    ------------------------------*/
    let ignitionFactor = 0;

    if (furnace.temperature >= fuel.ignitionTemp) {
      ignitionFactor = clamp(
        (furnace.temperature - fuel.ignitionTemp) / 80,
        0,
        1
      );
    }

    /* -----------------------------
       OXYGEN
    ------------------------------*/
    const oxygenEfficiency = clamp(
      1.0 - furnace.ashLevel * 0.5,
      0,
      1
    );

    /* -----------------------------
       FLUCTUATION
    ------------------------------*/
    const fluctuation =
      1 + Math.sin(time * 0.4) * fuel.volatility;

    /* -----------------------------
       BURN RATE
    ------------------------------*/
    const burnRate =
      fuel.burnRate *
      ignitionFactor *
      oxygenEfficiency *
      fuelBedFactor *
      fluctuation;

    let burned = burnRate * dt;
    burned = Math.min(burned, mass);

    fuelEntry.mass -= burned;

    /* -----------------------------
       HEAT OUTPUT
    ------------------------------*/
    const heatProduced =
      burned * fuel.calorificValueMJ * furnace.combustionEfficiency;

    totalHeat += heatProduced;

    /* -----------------------------
       SMOKE MODEL (FIXED)
    ------------------------------*/
    const combustionQuality = oxygenEfficiency * ignitionFactor;

    totalSmoke +=
      burnRate *
      fuel.smokeFactor *
      (1 - combustionQuality * combustionQuality);

    /* -----------------------------
       ASH
    ------------------------------*/
    totalAsh += burnRate * fuel.ashFactor * 0.002;

    totalBurning = totalBurning || burned > 0;
  }

  /* -----------------------------
     EMBER HEAT
  ------------------------------*/
  let emberHeat = 0;

  if (totalFuelMass <= 0 && furnace.temperature > 80) {
    emberHeat = furnace.temperature * 0.0015;
  }

  const heatMJ = totalHeat + emberHeat;

  /* -----------------------------
     ENERGY BUFFER (IMPORTANT FIX)
  ------------------------------*/
  furnace.storedHeatMJ += heatMJ;
  furnace.storedHeatMJ -= 3.5 * dt;
  furnace.storedHeatMJ = Math.max(0, furnace.storedHeatMJ);

  // -----------------------------
  // TEMPERATURE (FIXED CORE)
  // -----------------------------

  const heatEnergy = totalHeat + emberHeat;

  // convert energy → temperature directly (NO power step)
  const temperatureGain =
    heatEnergy / furnace.thermalMass;

  // cooling (proper dt scaling)
  const temperatureLoss =
    (furnace.temperature - furnace.ambientTemperature) *
    furnace.coolingCoefficient *
    dt;

  // apply
  furnace.temperature += temperatureGain - temperatureLoss;

  /* -----------------------------
     PRESSURE
  ------------------------------*/
  if (furnace.temperature > 100) {
    furnace.pressure += (furnace.temperature - 100) * 0.01 * dt;
  }

  furnace.pressure *= 0.995;

  /* -----------------------------
     OUTPUTS
  ------------------------------*/
  furnace.smokeOutput = totalSmoke;

  furnace.ashLevel = clamp(
    furnace.ashLevel + totalAsh - 0.0003 * dt,
    0,
    1
  );

  furnace.isBurning = totalBurning || emberHeat > 0;

  return furnace;
}

/* -----------------------------
   COMPOSABLE
------------------------------*/
export function useFurnaceSim(initialFuels = []) {
  const furnace = createFurnace(initialFuels);

  const running = ref(false);
  let raf;
  let lastTime = performance.now();

  function loop(now) {
    if (!running.value) return;

    const dt = (now - lastTime) / 1000;
    lastTime = now;

    updateFurnace(furnace, dt, now / 1000);

    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running.value) return;
    running.value = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(loop);
  }

  function stop() {
    running.value = false;
    if (raf) cancelAnimationFrame(raf);
  }

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

  const temperatureColor = computed(() => {
    const t = furnace.temperature;

    if (t < 100) return "#2b2b2b";
    if (t < 250) return "#ff6a00";
    if (t < 500) return "#ff2a00";
    return "#ff00aa";
  });

  function ignite(temperature = 200) {
    const hasMass = furnace.fuels.find(f => f.mass > 0) !== undefined;

    if (hasMass && furnace.temperature < temperature) {
      furnace.temperature = temperature;
    }
  }

  onUnmounted(stop);

  return {
    furnace,
    running,
    start,
    stop,
    addFuel,
    temperatureColor,
    ignite,
  };
}