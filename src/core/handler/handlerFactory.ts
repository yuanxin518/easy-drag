export type HandleNodesType = {
    value: (string | number)[];
};
const HANDLER_NODES: HandleNodesType[] = [
    {
        value: [0, 0, "-50%", "-50%"],
    }, //left,top,translateX,translateY
    {
        value: ["100%", 0, "-50%", "-50%"],
    },
    {
        value: [0, "100%", "-50%", "-50%"],
    },
    {
        value: ["100%", "100%", "-50%", "-50%"],
    },
];

export const NodeFactory = () => {
    const genContainer = () => {
        const interactiveInstance = document.createElement("div");
        interactiveInstance.style.position = "absolute";
        interactiveInstance.style.display = "none";
        return interactiveInstance;
    };

    const genNodes = (nodeWidth: number, nodeColor: string) => {
        return HANDLER_NODES.map((nodeProperty) => {
            const {
                value: [left, top, transX, transY],
            } = nodeProperty;
            const node = document.createElement("div");
            Object.assign(node.style, {
                position: "absolute",
                left,
                top,
                width: `${nodeWidth}px`,
                height: `${nodeWidth}px`,
                "background-color": `${nodeColor}`,
                "border-radius": "5px",
                transform: `translate(${transX}, ${transY})`,
                cursor: "pointer",
            });
            return {
                nodeProperty,
                node,
            };
        });
    };

    return { genContainer, genNodes };
};
