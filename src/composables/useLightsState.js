import { reactive } from "vue";
import { useBatteryState } from "./useBatteryState";

export function useLightsState() {
    const lightsState = reactive({
        isOn: false,
        ampsDrain: 5, // Amps consumed per second when on
        isLit: false, // Whether light is currently visually lit (flickers when low battery)
        name: "Light", // Name of the light source
    });

    let drainInterval = null;
    let lastFlickerTime = 0;
    const batteryState = useBatteryState();

    function toggle() {
        lightsState.isOn = !lightsState.isOn;
        if (lightsState.isOn && batteryState.state.level > 0) {
            lightsState.isLit = true;
            startDrain();
        } else {
            lightsState.isLit = false;
            stopDrain();
        }
    }

    function setAmpsDrain(amps) {
        lightsState.ampsDrain = Math.max(0, amps);
    }

    function calculateFlickerInterval(batteryLevel, batteryCapacity) {
        const batteryPercent = (batteryLevel / batteryCapacity) * 100;
        
        if (batteryPercent > 10) {
            return null; // No flicker, lights stay on
        }

        if (batteryPercent === 0) {
            return null; // Battery empty, no flicker, lights off
        }

        // At 10%: 1000ms interval
        // As battery approaches 0: interval approaches 0 (very fast flicker)
        // Formula: interval = 1000 * (batteryPercent / 10)
        return Math.max(50, (batteryPercent / 10) * 1000); // Min 50ms to prevent browser strain
    }

    function startDrain() {
        if (drainInterval) return; // Prevent multiple intervals

        lastFlickerTime = Date.now();

        drainInterval = setInterval(() => {
            if (lightsState.isOn && batteryState.state.level > 0) {
                // Drain battery at the configured amp rate per minute (divide by 60 for per-second rate)
                batteryState.state.level = Math.max(0, batteryState.state.level - (lightsState.ampsDrain / 60 / 10));

                // Calculate flicker behavior
                const flickerInterval = calculateFlickerInterval(batteryState.state.level, batteryState.state.capacity);
                
                if (flickerInterval !== null) {
                    // Battery is low, handle flickering
                    const now = Date.now();
                    if (now - lastFlickerTime >= flickerInterval) {
                        lightsState.isLit = !lightsState.isLit;
                        lastFlickerTime = now;
                    }
                } else {
                    // Battery is OK, lights stay on
                    lightsState.isLit = true;
                }
            } else if (batteryState.state.level <= 0) {
                // Battery depleted, lights flicker off (stay in flicker mode but dark)
                lightsState.isLit = false;
            }
        }, 100); // Update more frequently to support fast flicker
    }

    function stopDrain() {
        if (drainInterval) {
            clearInterval(drainInterval);
            drainInterval = null;
        }
    }

    function turnOff() {
        lightsState.isOn = false;
        lightsState.isLit = false;
        stopDrain();
    }

    return {
        state: lightsState,
        toggle,
        setAmpsDrain,
        turnOff,
    };
}
