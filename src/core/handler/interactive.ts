import { InteractiveCallback, RendererContext } from "../renderer";
import initializeInteractiveEventsInfo, { InteractiveEventsInfoType } from "./handleEvents";
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
    canvas: HTMLCanvasElement,
    sendMonitorData: () => void
) => {
    surroundContainer: (id: RendererContext["id"], property: RendererContext["containerProperty"]) => void;
    bindContainerEvents: () => void;
    bindNodeEventCallback: (callbacks: { mousedownCallback: (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => void }) => void;
    interactiveContainerId: null | string;
    bindInteractiveContainerId: (id: string) => void;
    interactiveEventsInfo: InteractiveEventsInfoType;
    updateContainerProperty: () => InteractiveEventsInfoType["currentIncrement"];
    markContainer: (property: RendererContext["containerProperty"]) => void;
};

export const interactiveHandler: InteractiveHandler = (container: HTMLDivElement, canvas: HTMLCanvasElement, commitUpdateMonitor: () => void) => {
    const BORDER_WIDTH = 1;
    const BORDER_COLOR = "skyblue";
    const HANDLE_NODE_WIDTH = 6;
    const baseProperty = {
        baseOffsetX: canvas.offsetLeft,
        baseOffsetY: canvas.offsetTop,
    };
    let interactiveContainerId: string | null = null;
    // 记录交互状态
    const interactiveEventsInfo = initializeInteractiveEventsInfo();

    const { genNodes, genContainer, genMarkContainer } = NodeFactory();
    // 初始化容器
    const interactiveElement = genContainer();
    const interactiveMarkElement = genMarkContainer();
    container.appendChild(interactiveElement);
    container.appendChild(interactiveMarkElement);

    // 初始化四个操纵点
    const nodes = genNodes(HANDLE_NODE_WIDTH, BORDER_COLOR);
    nodes.forEach(({ nodeProperty, node }) => {
        interactiveElement.append(node);
    });

    const bindInteractiveContainerId = (id: string) => {
        interactiveContainerId = id;
    };

    const getInteractiveContainerId = () => {
        return interactiveContainerId;
    };

    const updateContainerProperty = () => {
        return interactiveEventsInfo.currentIncrement;
    };

    /**
     * 调用后，将操控容器渲染到指定property的渲染位置。在每次更新canvas的时候调用。
     * @param property
     */
    const surroundContainer = (id: RendererContext["id"], property: RendererContext["containerProperty"]) => {
        if (!property) return;
        Object.assign(interactiveElement.style, {
            left: `${property.position.x + baseProperty.baseOffsetX}px`,
            top: `${property.position.y + baseProperty.baseOffsetY}px`,
            width: `${property.size.width}px`,
            height: `${property.size.height}px`,
            border: `${BORDER_WIDTH}px solid ${BORDER_COLOR}`,
            display: "block",
        });
    };
    /**
     * 调用后渲染交互容器到指定property的渲染位置，用来标记下一次渲染所在的位置
     */
    const markContainer = (property: RendererContext["containerProperty"]) => {
        if (!property) return;
        Object.assign(interactiveMarkElement.style, {
            left: `${property.position.x + baseProperty.baseOffsetX}px`,
            top: `${property.position.y + baseProperty.baseOffsetY}px`,
            width: `${property.size.width + 10}px`,
            height: `${property.size.height}px`,
            border: `${BORDER_WIDTH}px dashed ${BORDER_COLOR}`,
            display: "block",
        });
    };

    /**
     * 给渲染最外层容器绑定事件处理，用来控制节点点击状态等
     */
    const bindContainerEvents = () => {
        container.onmousedown = (event) => {
            event.preventDefault();
        };
        container.onmouseup = () => {
            commitUpdateMonitor();
            if (interactiveEventsInfo.isMousedown) {
                interactiveEventsInfo.isMousedown = false;
                interactiveEventsInfo.currentIncrement = null;
                interactiveEventsInfo.currentEventNode = null;
            }
        };

        /**
         * 用来控制节点move
         */
        container.onmousemove = (event) => {
            if (interactiveEventsInfo.isMousedown && interactiveEventsInfo.currentIncrement) {
                interactiveEventsInfo.currentIncrement.currentX = event.clientX;
                interactiveEventsInfo.currentIncrement.currentY = event.clientY;

                const incrementX = interactiveEventsInfo.currentIncrement.currentX - interactiveEventsInfo.currentIncrement.startX;
                const incrementY = interactiveEventsInfo.currentIncrement.currentY - interactiveEventsInfo.currentIncrement.startY;
                // 判断尺寸增量
                switch (interactiveEventsInfo.currentEventNode?.nodeProperty.position.value) {
                    case 1:
                        interactiveEventsInfo.currentIncrement.vertexOffsetX = incrementX;
                        interactiveEventsInfo.currentIncrement.vertexOffsetY = incrementY;
                        break;

                    case 2:
                        interactiveEventsInfo.currentIncrement.vertexOffsetX = 0;
                        interactiveEventsInfo.currentIncrement.vertexOffsetY = incrementY;
                        break;

                    case 3:
                        interactiveEventsInfo.currentIncrement.vertexOffsetX = incrementX;
                        interactiveEventsInfo.currentIncrement.vertexOffsetY = 0;
                        break;

                    case 4:
                        interactiveEventsInfo.currentIncrement.vertexOffsetX = 0;
                        interactiveEventsInfo.currentIncrement.vertexOffsetY = 0;
                        break;
                    default:
                }

                commitUpdateMonitor();
            }
        };
    };

    /**
     * 为可操作节点绑定事件，用来操控位置大小变化等
     */
    const bindNodeEventCallback = (callbacks: { mousedownCallback: (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => void }) => {
        Array.from(nodes).forEach((eventNode, index) => {
            eventNode.node.onmousedown = (event: MouseEvent) => {
                interactiveEventsInfo.isMousedown = true;
                interactiveEventsInfo.currentEventNode = eventNode;
                interactiveEventsInfo.currentIncrement = {
                    startX: event.clientX,
                    startY: event.clientY,
                    currentX: event.clientX,
                    currentY: event.clientY,
                };
                callbacks.mousedownCallback(event, eventNode, {
                    interactiveContainerId,
                });

                commitUpdateMonitor();
            };
        });
    };

    return new Proxy(
        {
            surroundContainer,
            bindNodeEventCallback,
            bindContainerEvents,
            interactiveEventsInfo,
            bindInteractiveContainerId,
            interactiveContainerId,
            updateContainerProperty,
            markContainer,
        },
        {
            get: (obj, prop) => {
                if (prop === "interactiveContainerId") {
                    return getInteractiveContainerId();
                }
                return (obj as { [index: string | symbol]: InteractiveInstance[keyof InteractiveInstance] })[prop];
            },
        }
    );
};
export type InteractiveInstance = ReturnType<InteractiveHandler>;
