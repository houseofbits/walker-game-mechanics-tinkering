// furnace-sim.js
// node furnace-sim.js

class FuelType {
    constructor({
        name,
        calorificValueMJ,
        burnRate,
        ignitionTemp,
        volatility,
        smokeFactor,
        ashFactor
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

class Furnace {
    constructor(fuels = []) {

        this.temperature = 250;
        this.ambientTemperature = 10;

        this.thermalMass = 5.0;
        this.coolingCoefficient = 0.003;

        this.storedHeatMJ = 0;

        // 🔥 MULTI FUEL STACK
        this.fuels = fuels;

        this.oxygen = 1.0;
        this.combustionEfficiency = 0.85;

        this.ashLevel = 0;

        this.engineDemandMJ = 3.5;

        this.pressure = 0;
        this.smokeOutput = 0;

        this.isBurning = false;
    }
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function updateFurnace(furnace, dt, time) {

    let totalHeat = 0;
    let totalSmoke = 0;
    let totalAsh = 0;
    let totalBurning = false;

    //----------------------------------------
    // FUEL BED EFFECT (shared)
    //----------------------------------------

    const totalFuelMass = furnace.fuels.reduce(
        (sum, f) => sum + f.mass,
        0
    );

    const fuelBedFactor = clamp(
        totalFuelMass / 25.0,
        0.1,
        1.0
    );

    //----------------------------------------
    // PROCESS EACH FUEL TYPE
    //----------------------------------------

    for (const fuelEntry of furnace.fuels) {

        const fuel = fuelEntry.type;
        let mass = fuelEntry.mass;

        if (mass <= 0) continue;

        //------------------------------------
        // IGNITION
        //------------------------------------

        let ignitionFactor = 0;

        if (furnace.temperature >= fuel.ignitionTemp) {
            ignitionFactor = clamp(
                (furnace.temperature - fuel.ignitionTemp) / 120,
                0.15,
                1.0
            );
        }

        if (furnace.temperature > fuel.ignitionTemp * 0.7) {
            ignitionFactor = Math.max(ignitionFactor, 0.08);
        }

        //------------------------------------
        // OXYGEN
        //------------------------------------

        const oxygenEfficiency = clamp(
            furnace.oxygen - furnace.ashLevel * 0.5,
            0,
            1
        );

        //------------------------------------
        // VOLATILITY
        //------------------------------------

        const fluctuation =
            1 + Math.sin(time * 0.4) * fuel.volatility;

        //------------------------------------
        // BURN RATE
        //------------------------------------

        const burnRate =
            fuel.burnRate *
            ignitionFactor *
            oxygenEfficiency *
            fuelBedFactor *
            fluctuation;

        let burned = burnRate * dt;
        burned = Math.min(burned, mass);

        fuelEntry.mass -= burned;

        //------------------------------------
        // HEAT
        //------------------------------------

        const heat =
            burned *
            fuel.calorificValueMJ *
            furnace.combustionEfficiency;

        totalHeat += heat;

        //------------------------------------
        // SMOKE (FIXED MODEL)
        //------------------------------------

        const baseSmoke =
            burnRate *
            fuel.smokeFactor;

        const inefficiency =
            (1 - oxygenEfficiency);

        // always some baseline smoke
        const efficiencySmoke = baseSmoke * (0.3 + inefficiency);

        totalSmoke += efficiencySmoke;

        //------------------------------------
        // ASH
        //------------------------------------

        totalAsh +=
            burnRate *
            fuel.ashFactor *
            0.002;

        totalBurning = totalBurning || burned > 0;
    }

    //----------------------------------------
    // EMBER HEAT (NO FUEL STATE)
    //----------------------------------------

    let emberHeat = 0;

    if (totalFuelMass <= 0 && furnace.temperature > 80) {
        emberHeat = furnace.temperature * 0.002;
    }

    const heatMJ = totalHeat + emberHeat;

    //----------------------------------------
    // ENERGY SYSTEM
    //----------------------------------------

    furnace.storedHeatMJ += heatMJ;
    furnace.storedHeatMJ -= furnace.engineDemandMJ * dt;
    furnace.storedHeatMJ = Math.max(0, furnace.storedHeatMJ);

    //----------------------------------------
    // TEMPERATURE
    //----------------------------------------

    const gain = heatMJ / furnace.thermalMass;

    const retention = clamp(furnace.temperature / 1000, 0.2, 1);

    const loss =
        (furnace.temperature - furnace.ambientTemperature) *
        furnace.coolingCoefficient *
        (1 - retention * 0.5) *
        dt;

    furnace.temperature += gain - loss;

    //----------------------------------------
    // PRESSURE
    //----------------------------------------

    if (furnace.temperature > 100) {
        furnace.pressure += (furnace.temperature - 100) * 0.015 * dt;
    }

    furnace.pressure *= 0.995;

    //----------------------------------------
    // OUTPUTS
    //----------------------------------------

    furnace.smokeOutput = totalSmoke;
    furnace.ashLevel = clamp(furnace.ashLevel + totalAsh - 0.0003 * dt, 0, 1);

    furnace.isBurning = totalBurning || emberHeat > 0;

    //----------------------------------------
    // RETURN DEBUG
    //----------------------------------------

    return {
        totalHeat,
        emberHeat,
        fuelLeft: totalFuelMass,
        smoke: totalSmoke
    };
}

//--------------------------------------------------
// FUELS
//--------------------------------------------------

const coal = new FuelType({
    name: "Coal",
    calorificValueMJ: 32,
    burnRate: 0.45,
    ignitionTemp: 180,
    volatility: 0.08,
    smokeFactor: 0.4,
    ashFactor: 0.5
});

const wood = new FuelType({
    name: "Wood",
    calorificValueMJ: 18,
    burnRate: 0.8,
    ignitionTemp: 120,
    volatility: 0.25,
    smokeFactor: 1.0,
    ashFactor: 0.2
});

//--------------------------------------------------
// SIM
//--------------------------------------------------

const furnace = new Furnace(
    [
        { type: coal, mass: 60 },
        { type: wood, mass: 40 },
        { type: wood, mass: 100 },
    ]    
);

const DT = 1;
const SIM = 1000;

console.log("MULTI-FUEL FURNACE SIM");

for (let t = 0; t < SIM; t++) {

    const d = updateFurnace(furnace, DT, t);

    console.clear();

    console.log("==== FURNACE ====");
    console.log(`t: ${t}s`);
    console.log(`temp: ${furnace.temperature.toFixed(2)} °C`);
    console.log(`fuel coal: ${furnace.fuels[0].mass.toFixed(2)} kg`);
    console.log(`fuel wood: ${furnace.fuels[1].mass.toFixed(2)} kg`);
    console.log(`burning: ${furnace.isBurning}`);
    console.log(`heat: ${furnace.storedHeatMJ.toFixed(2)} MJ`);
    console.log(`smoke: ${furnace.smokeOutput.toFixed(2)}`);
    console.log(`ash: ${furnace.ashLevel.toFixed(2)}`);

    if (furnace.temperature <= furnace.ambientTemperature + 0.1 &&
        furnace.fuels.every(f => f.mass <= 0)) {
        console.log("FULL COOLDOWN COMPLETE");
        break;
    }

    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 80);
}