import { ref } from 'vue';

const connecting = ref(false);
const connectionStart = ref(null);

function resetConnection() {
    connecting.value = false;
    connectionStart.value = null;
}

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    resetConnection();
});

export function useNodeConnector() {

    function startConnection(node,) {
        connecting.value = true;
        connectionStart.value = node;
    }

    function endConnection(node) {
        if (connecting.value) {
            if (!node.inputs.find(input => input.id === connectionStart.value.id)) {
                node.inputs.push(connectionStart.value);
            }
            connectionStart.value.linked = node;
            
            resetConnection();
        }
    }

    return {
        connecting,
        connectionStart,
        startConnection,
        endConnection,
        resetConnection
    };
}