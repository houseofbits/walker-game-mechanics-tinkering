/**
 * Utility: clamps a value between min and max.
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Advances the furnace simulation by dt seconds.
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
 *
 * @param {Object} furnace - The furnace state object
 * @param {number} dt - Delta time in seconds
 * @param {number} time - Current simulation time in seconds
 * @returns {Object} The updated furnace state
 */
export function updateFurnaceSimulation(furnace, dt, time) {
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
