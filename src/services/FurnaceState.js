import { reactive } from 'vue';

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
export function createFurnaceState(fuels = []) {
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
