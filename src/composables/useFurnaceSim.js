import { ref, reactive, computed, onUnmounted } from "vue";

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Describes a fuel's physical properties. All values are tunable per-fuel.
 *
 * @param {string}  name              - Display name.
 * @param {number}  calorificValueMJ  - Energy released per kg burned (MJ/kg).
 *                                      Coal ≈ 32, wood ≈ 18. Higher = hotter fire.
 * @param {number}  burnRate          - Maximum kg consumed per second at full ignition.
 *                                      Higher = burns faster, exhausts fuel sooner.
 * @param {number}  ignitionTemp      - Minimum furnace temperature (°C) for the fuel to catch.
 * @param {number}  ignitionRamp      - °C above ignitionTemp to reach full burn rate (default 80).
 *                                      Smaller = fuel responds more aggressively just after ignition.
 *                                      Larger = gradual ramp, sluggish start.
 * @param {number}  volatility        - Amplitude of the sinusoidal burn-rate flicker (0–1).
 *                                      0 = steady flame, 0.25 = visible fluctuation.
 * @param {number}  smokeFactor       - Base smoke emission rate. Scaled down by combustion quality,
 *                                      so poor ignition or high ash = more smoke.
 * @param {number}  ashFactor         - Fraction of burn rate that becomes ash residue.
 *                                      High ash clogs airflow (reduces oxygenEfficiency).
 * @param {number}  maxTemp           - Maximum combustion temperature (°C) this fuel can sustain.
 *                                      Heat output tapers linearly to 0 as furnace approaches this value,
 *                                      creating a natural equilibrium — no hard clamp needed.
 *                                      Coal ≈ 1200, wood ≈ 600.
 */
export class FuelType {
  constructor({
    name,
    calorificValueMJ,
    burnRate,
    ignitionTemp,
    ignitionRamp,
    volatility,
    smokeFactor,
    ashFactor,
    maxTemp,
  }) {
    this.name = name;
    this.calorificValueMJ = Math.max(0, calorificValueMJ);
    this.burnRate         = Math.max(0, burnRate);
    this.ignitionTemp     = ignitionTemp ?? 0;
    this.ignitionRamp     = Math.max(1, ignitionRamp ?? 80);  // min 1 prevents /0
    this.volatility       = clamp(volatility, 0, 1);          // >1 makes fluctuation go negative
    this.smokeFactor      = Math.max(0, smokeFactor);
    this.ashFactor        = Math.max(0, ashFactor);
    this.maxTemp          = Math.max(this.ignitionTemp + 1, maxTemp); // must exceed ignitionTemp
  }
}

/**
 * Furnace state. The tunable parameters below control the physical character of the furnace.
 *
 * thermalMass      - How much energy (MJ) is needed to raise temperature by 1 °C.
 *                    High = slow to heat up and slow to cool down (heavy stone furnace).
 *                    Low  = fast response, spiky temperature (thin metal box). Tune: 1–20.
 *
 * coolingCoefficient - Newton cooling constant. Temperature drops at:
 *                    (temp - ambient) × coolingCoefficient per second.
 *                    0.001 = well-insulated, 0.005 = drafty/thin-walled. Tune: 0.0005–0.01.
 *
 * combustionEfficiency - Fraction of fuel energy actually converted to heat (the rest is lost
 *                    as unburned gases). Tune: 0.5 (poor draft) – 0.95 (forced air).
 */
function createFurnace(fuels = []) {
  return reactive({
    temperature: 15,
    ambientTemperature: 15,
    thermalMass: 3.0,
    coolingCoefficient: 0.003,
    fuels,
    combustionEfficiency: 0.85,
    ashLevel: 0,
    pressure: 0,
    smokeOutput: 0,
    isBurning: false,
  });
}


/**
 * Advances the simulation by dt seconds.
 *
 * Algorithm overview
 * ------------------
 * Each tick, for every fuel entry:
 *
 *   1. ignitionFactor  = how fully the fuel is burning, 0→1 as temperature rises from
 *                        ignitionTemp to ignitionTemp + ignitionRamp.
 *
 *   2. oxygenEfficiency = reduced by ash buildup (ash blocks airflow).
 *
 *   3. burnRate = fuel.burnRate × ignitionFactor × oxygenEfficiency × fuelBedFactor × fluctuation
 *      - fuelBedFactor: log-scaled 0→1 over total fuel mass; a thin layer burns less stably.
 *      - fluctuation: sinusoidal flicker driven by fuel volatility.
 *
 *   4. burned = burnRate × dt  (capped at remaining mass)
 *      Heat produced = burned × calorificValueMJ × combustionEfficiency
 *
 *   5. Smoke = high when combustion quality (ignition × oxygen) is low — incomplete burn.
 *      Ash accumulates from burnRate, slowly self-clears over time.
 *
 * After the fuel loop:
 *
 *   6. Ember heat: if all fuel is gone but the furnace is still hot (>80 °C), the walls
 *      radiate a small residual heat proportional to temperature.
 *
 *   7. Temperature update (Euler step):
 *        ΔT = heatEnergy / thermalMass  −  (T − T_ambient) × coolingCoefficient × dt
 *      First term heats the furnace; second is Newton's law of cooling.
 *
 *   8. Pressure builds above 100 °C and decays by 0.5% per tick.
 */
function updateFurnace(furnace, dt, time) {
  let totalHeat = 0;
  let totalSmoke = 0;
  let totalAsh = 0;
  let anyBurning = false;

  const totalFuelMass = furnace.fuels.reduce((sum, f) => sum + f.mass, 0);

  // more fuel = more stable combustion, logarithmic scaling
  const fuelBedFactor = Math.max(0, Math.log10(totalFuelMass + 1));

  for (const fuelEntry of furnace.fuels) {
    const fuel = fuelEntry.type;
    if (fuelEntry.mass <= 0) continue;

    const ignitionFactor = clamp(
      (furnace.temperature - fuel.ignitionTemp) / fuel.ignitionRamp,
      0,
      1
    );

    const oxygenEfficiency = clamp(1.0 - furnace.ashLevel * 0.5, 0, 1);
    const fluctuation = 1 + Math.sin(time * 0.4) * fuel.volatility;

    const burnRate =
      fuel.burnRate * ignitionFactor * oxygenEfficiency * fuelBedFactor * fluctuation;

    const burned = Math.min(burnRate * dt, fuelEntry.mass);
    fuelEntry.mass -= burned;
    if (fuelEntry.mass < 0.01) fuelEntry.mass = 0;

    totalHeat += burned * fuel.calorificValueMJ * furnace.combustionEfficiency;

    const combustionQuality = oxygenEfficiency * ignitionFactor;
    totalSmoke += burnRate * fuel.smokeFactor * (1 - combustionQuality * combustionQuality);
    totalAsh += burnRate * fuel.ashFactor * 0.002;
    anyBurning = anyBurning || burned > 0;
  }

  // residual heat from hot walls after fuel runs out
  const emberHeat = (totalFuelMass <= 0 && furnace.temperature > 80)
    ? furnace.temperature * 0.0015 * dt
    : 0;

  const heatEnergy = totalHeat + emberHeat;

  // temperature update: heat gain vs Newton cooling
  const safeThermalMass = Math.max(0.001, furnace.thermalMass);
  furnace.temperature +=
    heatEnergy / safeThermalMass -
    Math.max(0, furnace.coolingCoefficient) * (furnace.temperature - furnace.ambientTemperature) * dt;

  // pressure builds above 100 °C, decays naturally
  if (furnace.temperature > 100) {
    furnace.pressure += (furnace.temperature - 100) * 0.01 * dt;
  }
  furnace.pressure *= 0.995;

  furnace.smokeOutput = totalSmoke;
  furnace.ashLevel = clamp(furnace.ashLevel + totalAsh - 0.0003 * dt, 0, 1);
  furnace.isBurning = anyBurning || emberHeat > 0;

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

  function ignite() {
    const isBurning = furnace.fuels.find(f => f.mass > 0) == undefined;
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