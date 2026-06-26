

export default class Port {
    constructor(nodeId, type, color) {
        this.id = crypto.randomUUID();
        this.nodeId = nodeId;
        this.type = type;
        this.color = color ?? "#fff";
        this.ioType = null;
    }

}