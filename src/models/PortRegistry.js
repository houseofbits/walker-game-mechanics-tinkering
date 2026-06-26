import { reactive } from 'vue';

export default class PortRegistry
{
    constructor() {
        this.portElements = {} // { [portId]: HTMLElement }
        this.portPositions = reactive({})
    }

    register(id, element) {
        this.portElements[id] = element
        this.update(id)
    }

    unregister(id) {
        delete this.portElements[id]
        delete this.portPositions[id]
    }

    updateAll() 
    {
        for (const portId in this.portElements) {
            this.update(portId)
        }  
    }

    update(portId) {
        const el = this.portElements[portId];

        if (!el)
            return

        const rect = el.getBoundingClientRect()

        const x = rect.left
        const y = rect.top

        this.portPositions[portId] =
        {
            x: x + rect.width * 0.5,
            y: y + rect.height * 0.5
        };
    }

    get(id) {
        return this.portPositions[id]
    }
}