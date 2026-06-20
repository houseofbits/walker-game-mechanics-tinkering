import { ref } from 'vue';

const nodes = ref([]);

export default function useBoardNodes() {

    function addNode(node) {
        nodes.value.push(node);
    }

    return {
        nodes,
        addNode,
    };
}