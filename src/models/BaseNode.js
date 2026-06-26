import { markRaw, ref} from 'vue';

export default class BaseNode {
    constructor(inputs, outputs, component, settings = {}) {
        this.isThinComponent = settings?.isThinComponent ?? true;
        this.component = markRaw(component);
        this.width = '300px'
        this.height = '300px'
        this.id = crypto.randomUUID()
        this.type = ''
        this.x = ref(0)
        this.y = ref(0)
        this.inputs = inputs
        this.outputs = outputs

        for (const input of this.inputs) {
            input.ioType = 'input';
        }

        for (const output of this.outputs) {
            output.ioType = 'output';
        }        
    }    
}