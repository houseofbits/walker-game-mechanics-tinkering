import { markRaw, ref} from 'vue';

export default class BaseNode {
    constructor(component, title, state) {
        this.id = crypto.randomUUID();
        this.title = ref(title);
        this.state = state;
        this.component = markRaw(component);
        this.inputs = [];
        this.linked = null;
        this.hasOutputs = true;
        this.width = '300px';
        this.height = '300px';
        this.outputX = ref(0);
        this.outputY = ref(0);
    }
}