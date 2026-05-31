import { reactive } from "vue";

export function useBatteryState() {
    const batteryState = reactive({
        level: 0,
        charging: false,
        capacity: 500, // Ah
    }); 

    let chargeInterval = null;

    function charge() {
        if (chargeInterval) return; // Prevent multiple intervals

        batteryState.charging = true;
        chargeInterval = setInterval(() => {
            if (batteryState.level < batteryState.capacity) {
                batteryState.level += 1; // Charge rate: 10 Ah per interval
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

    return {
        state: batteryState,
        charge,
        chargeOff,
    };
}   