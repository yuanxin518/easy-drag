import { RendererContext } from "../renderer";
import { HandleNodesType, NodeFactory } from "./handlerFactory";
export type EventNodeType = {
    node: HTMLDivElement;
    nodeProperty: HandleNodesType;
};

export type EventExtraType = {
    interactiveContainerId: string | null;
};

type InteractiveHandler = (
    container: HTMLDivElement,
    canvas: HTMLCanvasElement
) => {
    surroundContainer: (id: RendererContext["id"], property: RendererContext["containerProperty"]) => void;
    bindNodeEventCallback: (callbacks: { mousedownCallback: (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => void }) => void;
    interactiveContainerId: string | null;
};

export const interactiveHandler: InteractiveHandler = (container: HTMLDivElement, canvas: HTMLCanvasElement) => {
    const BORDER_WIDTH = 1;
    const BORDER_COLOR = "skyblue";
    const HANDLE_NODE_WIDTH = 6;
    const baseProperty = {
        baseOffsetX: canvas.offsetLeft,
        baseOffsetY: canvas.offsetTop,
    };
    let interactiveContainerId: string | null = null;

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
    const surroundContainer = (id: RendererContext["id"], property: RendererContext["containerProperty"]) => {
        if (!property) return;
        interactiveContainerId = id;

        Object.assign(interactiveInstance.style, {
            left: `${property.position.x + baseProperty.baseOffsetX}px`,
            top: `${property.position.y + baseProperty.baseOffsetY}px`,
            width: `${property.size.width}px`,
            height: `${property.size.height}px`,
            border: `${BORDER_WIDTH}px solid ${BORDER_COLOR}`,
            display: "block",
        });
    };

    /**
     * 为可操作节点绑定事件，用来操控位置大小变化等
     */
    const bindNodeEventCallback = (callbacks: { mousedownCallback: (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => void }) => {
        Array.from(nodes).forEach((eventNode, index) => {
            eventNode.node.onmousedown = (event: MouseEvent) => {
                callbacks.mousedownCallback(event, eventNode, {
                    interactiveContainerId,
                });
            };
        });
    };

    return {
        surroundContainer,
        bindNodeEventCallback,
        interactiveContainerId,
    };
};

export type InteractiveInstance = ReturnType<InteractiveHandler>;
