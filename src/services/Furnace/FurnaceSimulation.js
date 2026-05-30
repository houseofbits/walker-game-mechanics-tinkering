/**
 * Utility: clamps a value between min and max.
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/**
 * Calculate the ignition factor (0→1) based on furnace temperature.
 * Higher temperature = more complete combustion.
 *
 * @private
 */
function calculateIgnitionFactor(furnaceTemp, fuel) {
  return clamp(
    (furnaceTemp - fuel.ignitionTemp) / fuel.ignitionRamp,
    0,
    1
  );
}

/**
 * Calculate oxygen efficiency (0→1) reduced by ash buildup.
 * High ash clogs airflow, reducing combustion efficiency.
 *
 * @private
 */
function calculateOxygenEfficiency(ashLevel) {
  return clamp(1.0 - ashLevel * 0.5, 0, 1);
}

/**
 * Calculate sinusoidal burn-rate fluctuation based on fuel volatility.
 * Adds realistic flicker to the flame.
 *
 * @private
 */
function calculateFluctuation(time, volatility) {
  return 1 + Math.sin(time * 0.4) * volatility;
}

/**
 * Calculate actual burn rate as product of all efficiency factors.
 *
 * @private
 */
function calculateBurnRate(fuel, ignitionFactor, oxygenEfficiency, fuelBedFactor, fluctuation) {
  return fuel.burnRate * ignitionFactor * oxygenEfficiency * fuelBedFactor * fluctuation;
}

/**
 * Calculate how much fuel is consumed this tick and update fuel mass.
 * Returns the amount actually burned.
 *
 * @private
 */
function consumeFuel(fuelEntry, burnRate, dt) {
  const burned = Math.min(burnRate * dt, fuelEntry.mass);
  fuelEntry.mass -= burned;
  if (fuelEntry.mass < 0.01) fuelEntry.mass = 0;
  return burned;
}

/**
 * Calculate heat energy produced from burning fuel.
 *
 * @private
 */
function calculateHeatFromBurning(burned, fuel, combustionEfficiency) {
  return burned * fuel.calorificValueMJ * combustionEfficiency;
}

/**
 * Calculate smoke emissions based on combustion quality.
 * Poor ignition or high ash produces more smoke (incomplete burn).
 *
 * @private
 */
function calculateSmoke(burnRate, fuel, combustionQuality) {
  return burnRate * fuel.smokeFactor * (1 - combustionQuality * combustionQuality);
}

/**
 * Calculate ash accumulation from burning this fuel.
 *
 * @private
 */
function calculateAshProduction(burnRate, fuel) {
  return burnRate * fuel.ashFactor * 0.002;
}

/**
 * Process all fuel entries for this simulation tick.
 * Accumulates heat, smoke, and ash totals. Returns { totalHeat, totalSmoke, totalAsh, anyBurning }.
 *
 * @private
 */
function processFuelBurning(furnace, dt, time, fuelBedFactor) {
  let totalHeat = 0;
  let totalSmoke = 0;
  let totalAsh = 0;
  let anyBurning = false;

  for (const fuelEntry of furnace.fuels) {
    const fuel = fuelEntry.type;
    if (fuelEntry.mass <= 0) continue;

    const ignitionFactor = calculateIgnitionFactor(furnace.temperature, fuel);
    const oxygenEfficiency = calculateOxygenEfficiency(furnace.ashLevel);
    const fluctuation = calculateFluctuation(time, fuel.volatility);
    const burnRate = calculateBurnRate(fuel, ignitionFactor, oxygenEfficiency, fuelBedFactor, fluctuation);

    const burned = consumeFuel(fuelEntry, burnRate, dt);

    totalHeat += calculateHeatFromBurning(burned, fuel, furnace.combustionEfficiency);

    const combustionQuality = oxygenEfficiency * ignitionFactor;
    totalSmoke += calculateSmoke(burnRate, fuel, combustionQuality);
    totalAsh += calculateAshProduction(burnRate, fuel);
    anyBurning = anyBurning || burned > 0;
  }

  return { totalHeat, totalSmoke, totalAsh, anyBurning };
}

/**
 * Calculate residual heat from hot furnace walls after all fuel is consumed.
 * Allows the furnace to cool slowly and realistically.
 *
 * @private
 */
function calculateEmberHeat(totalFuelMass, furnaceTemp, dt) {
  if (totalFuelMass <= 0 && furnaceTemp > 80) {
    return furnaceTemp * 0.0015 * dt;
  }
  return 0;
}

/**
 * Update furnace temperature based on heat input and cooling losses (Newton's law).
 *
 * @private
 */
function updateTemperature(furnace, heatEnergy, dt) {
  const safeThermalMass = Math.max(0.001, furnace.thermalMass);
  const coolingLoss = Math.max(0, furnace.coolingCoefficient) *
    (furnace.temperature - furnace.ambientTemperature) * dt;

  furnace.temperature += (heatEnergy / safeThermalMass) - coolingLoss;
}

/**
 * Update furnace pressure. Pressure builds above 100 °C and naturally decays.
 *
 * @private
 */
function updatePressure(furnace, dt) {
  if (furnace.temperature > 100) {
    furnace.pressure += (furnace.temperature - 100) * 0.01 * dt;
  }
  furnace.pressure *= 0.995;
}

/**
 * Update furnace state properties: smoke output, ash level, and burning status.
 *
 * @private
 */
function updateFurnaceState(furnace, totalSmoke, totalAsh, anyBurning, emberHeat, dt) {
  furnace.smokeOutput = totalSmoke;
  furnace.ashLevel = clamp(furnace.ashLevel + totalAsh - 0.0003 * dt, 0, 1);
  furnace.isBurning = anyBurning || emberHeat > 0;
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
  const totalFuelMass = furnace.fuels.reduce((sum, f) => sum + f.mass, 0);

  // More fuel = more stable combustion, logarithmic scaling
  const fuelBedFactor = Math.max(0, Math.log10(totalFuelMass + 1));

  // Process all fuel burning and accumulate effects
  const { totalHeat, totalSmoke, totalAsh, anyBurning } = processFuelBurning(
    furnace,
    dt,
    time,
    fuelBedFactor
  );

  // Calculate residual heat from hot walls
  const emberHeat = calculateEmberHeat(totalFuelMass, furnace.temperature, dt);
  const heatEnergy = totalHeat + emberHeat;

  // Apply physics: temperature, pressure, and state updates
  updateTemperature(furnace, heatEnergy, dt);
  updatePressure(furnace, dt);
  updateFurnaceState(furnace, totalSmoke, totalAsh, anyBurning, emberHeat, dt);

  return furnace;
}
