import { reactive } from "vue";
import { useFurnaceSim } from "./useFurnaceSim";

const THRESHOLD_TEMP = 250; // Example threshold temperature for charging

const batteryState = reactive({
    level: 0,
    charging: false,
    capacity: 500, // Ah
}); 

let chargeInterval = null;

const { furnace } = useFurnaceSim();

export function useBatteryState() {
    function charge() {
        if (chargeInterval) return; // Prevent multiple intervals

        batteryState.charging = true;
        chargeInterval = setInterval(() => {
            if (batteryState.level < batteryState.capacity) {
                const furnaceTemp = furnace.temperature;
                if (furnaceTemp > THRESHOLD_TEMP) {
                    const tempFactor = Math.max(0.1, Math.min((furnaceTemp- THRESHOLD_TEMP) / 300, 1));
                    batteryState.level += tempFactor * 10;
                }
            } else {
                batteryState.level = batteryState.capacity;
                clearInterval(chargeInterval);
                batteryState.charging = false;
                chargeInterval = null;
            }
        }, 1000); // Update every second
    }

    function chargeOff() {
        batteryState.charging = false;
        clearInterval(chargeInterval);
        chargeInterval = null;
    }

    function upgradeBattery() {
        batteryState.capacity += 100; // Increase capacity by 100 Ah
    }

    return {
        state: batteryState,
        charge,
        chargeOff,
        upgradeBattery,
    };
}   