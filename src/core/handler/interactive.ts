import { RendererContext } from "../renderer";
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
    updateContainerProperty: (property: RendererContext["containerProperty"]) => RendererContext["containerProperty"];
    markContainer: (property: RendererContext["containerProperty"]) => void;
    setCanvasMaxSize: (maxWidth: number, maxHeight: number) => void;
    setCanvasOffset: (offsetX: number, offsetY: number) => void;
};

export const interactiveHandler: InteractiveHandler = (container: HTMLDivElement, canvas: HTMLCanvasElement, commitUpdateMonitor: () => void) => {
    const BORDER_WIDTH = 1;
    const BORDER_COLOR = "#8F00FF";
    const HANDLE_NODE_WIDTH = 6;
    const baseProperty = {
        baseOffsetX: canvas.offsetLeft,
        baseOffsetY: canvas.offsetTop,
        canvasMaxWidth: canvas.clientWidth,
        canvasMaxHeight: canvas.clientHeight,
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

    const setCanvasMaxSize = (maxWidth: number, maxHeight: number) => {
        baseProperty.canvasMaxWidth = maxWidth;
        baseProperty.canvasMaxHeight = maxHeight;
    };

    const setCanvasOffset = (offsetX: number, offsetY: number) => {
        baseProperty.baseOffsetX = offsetX;
        baseProperty.baseOffsetY = offsetY;
    };

    /**
     * 记录新的containerProperty
     * @param property 旧的containerProperty
     * @returns 新的containerProperty
     */
    const updateContainerProperty = (property: RendererContext["containerProperty"]) => {
        if (!interactiveEventsInfo.currentIncrement || !property) return null;
        const { vertexOffsetX, vertexOffsetY, startX, startY, currentX, currentY } = interactiveEventsInfo.currentIncrement;

        let pX = property.position.x,
            pY = property.position.y,
            sW = property.size.width,
            sH = property.size.height;

        const incrementX = Math.min(Math.max(-startX + baseProperty.baseOffsetX, vertexOffsetX), property.size.width);
        const incrementY = Math.min(Math.max(-startY + baseProperty.baseOffsetY, vertexOffsetY), property.size.height);

        // 不为零 则为第一或第三个点，改变了左上顶点的位置
        if (vertexOffsetX !== 0) {
            pX = pX + incrementX;
            sW = sW - incrementX;
        } else {
            const maxWidth = baseProperty.baseOffsetX + baseProperty.canvasMaxWidth - startX; //最大宽度增量
            const incrementWidth = currentX !== void 0 ? Math.max(currentX - startX, -sW) : 0;
            sW = sW + Math.min(incrementWidth, maxWidth);
        }
        if (vertexOffsetY !== 0) {
            pY = pY + incrementY;
            sH = sH - incrementY;
        } else {
            const maxHeight = baseProperty.baseOffsetY + baseProperty.canvasMaxHeight - startY; //最大高度增量
            const incrementHeight = currentY !== void 0 ? Math.max(currentY - startY, -sH) : 0;
            sH = sH + Math.min(incrementHeight, maxHeight);
        }

        interactiveEventsInfo.nextContainerProperty = {
            ...property,
            position: {
                x: pX,
                y: pY,
            },
            size: {
                width: sW,
                height: sH,
            },
        };

        return interactiveEventsInfo.nextContainerProperty;
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
            width: `${property.size.width}px`,
            height: `${property.size.height}px`,
            border: `${BORDER_WIDTH}px dashed ${BORDER_COLOR}`,
            display: "block",
        });
    };

    /**
     * 给渲染最外层容器绑定事件处理，用来控制节点点击状态等
     */
    const bindContainerEvents = () => {
        document.onmousedown = (event) => {
            event.preventDefault();
        };
        document.onmouseup = () => {
            if (interactiveEventsInfo.isMousedown) {
                interactiveEventsInfo.isMousedown = false;
                interactiveEventsInfo.currentIncrement = null;
                interactiveEventsInfo.currentEventNode = null;
            }
            commitUpdateMonitor();
        };

        /**
         * 用来控制节点move
         */
        document.onmousemove = (event) => {
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
        const extraWidth = HANDLE_NODE_WIDTH / 2 - BORDER_WIDTH;
        Array.from(nodes).forEach((eventNode, index) => {
            eventNode.node.onmousedown = (event: MouseEvent) => {
                const nodeX = eventNode.node.offsetLeft + interactiveElement.offsetLeft + ([1, 4].includes(eventNode.nodeProperty.position.value) ? extraWidth : 0);
                const nodeY = eventNode.node.offsetTop + interactiveElement.offsetTop + ([3, 4].includes(eventNode.nodeProperty.position.value) ? extraWidth : 0);

                interactiveEventsInfo.isMousedown = true;
                interactiveEventsInfo.currentEventNode = eventNode;
                interactiveEventsInfo.currentIncrement = {
                    startX: nodeX,
                    startY: nodeY,
                    currentX: nodeX,
                    currentY: nodeY,
                    vertexOffsetX: 0,
                    vertexOffsetY: 0,
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
            setCanvasMaxSize,
            setCanvasOffset,
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
