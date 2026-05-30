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
    this.burnRate = Math.max(0, burnRate);
    this.ignitionTemp = ignitionTemp ?? 0;
    this.ignitionRamp = Math.max(1, ignitionRamp ?? 80); // min 1 prevents /0
    this.volatility = clamp(volatility, 0, 1); // >1 makes fluctuation go negative
    this.smokeFactor = Math.max(0, smokeFactor);
    this.ashFactor = Math.max(0, ashFactor);
    this.maxTemp = Math.max(this.ignitionTemp + 1, maxTemp); // must exceed ignitionTemp
  }
}

/**
 * Clamps a value between min and max.
 */
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
