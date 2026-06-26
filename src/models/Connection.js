
export default class Connection {
    constructor(portA, portB) {
        this.id = crypto.randomUUID();
        this.sourcePortId = portA.id;
        this.targetPortId = portB.id;
    }
}