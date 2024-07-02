import { ContainerProperty } from "../element/container";
import { HandleNodesType, NodeFactory } from "./handlerFactory";

export const interactiveHandler = (
    container: HTMLDivElement,
    canvas: HTMLCanvasElement
) => {
    const BORDER_WIDTH = 1;
    const BORDER_COLOR = "blue";
    const HANDLE_NODE_WIDTH = 6;
    const baseProperty = {
        baseOffsetX: canvas.offsetLeft,
        baseOffsetY: canvas.offsetTop,
    };

    const { genNodes, genContainer } = NodeFactory();
    // 初始化容器
    const interactiveInstance = genContainer();
    container.appendChild(interactiveInstance);
    // 初始化四个操纵点
    const nodes = genNodes(HANDLE_NODE_WIDTH, BORDER_COLOR);
    nodes.forEach(({ nodeProperty, node }) => {
        interactiveInstance.append(node);
    });

    /**
     * 调用后，将操控容器渲染到指定property的渲染位置。在每次更新canvas的时候调用。
     * @param property
     */
    const surroundContainer = (property: ContainerProperty) => {
        Object.assign(interactiveInstance.style, {
            left: `${property.position.x + baseProperty.baseOffsetX}px`,
            top: `${property.position.y + baseProperty.baseOffsetY}px`,
            width: `${property.size.width - BORDER_WIDTH}px`,
            height: `${property.size.height - BORDER_WIDTH}px`,
            border: `${BORDER_WIDTH}px solid ${BORDER_COLOR}`,
            display: "block",
        });
    };

    /**
     * 为可操作节点绑定事件，用来操控位置大小变化等
     */
    const bindNodeEventCallback = (callbacks: {
        mousedownCallback: (
            nodeProperty?: HandleNodesType,
            node?: HTMLDivElement,
            event?: MouseEvent
        ) => void;
    }) => {
        Array.from(nodes).forEach(({ nodeProperty, node }, index) => {
            node.onmousedown = (event: MouseEvent) => {
                callbacks.mousedownCallback(nodeProperty, node, event);
            };
        });
    };

    return {
        surroundContainer,
        bindNodeEventCallback,
    };
};

export type InteractiveInstance = ReturnType<typeof interactiveHandler>;
