import { RendererContext, SimpleRenderContextType } from "../renderer";
import initializeInteractiveEventsInfo, { InteractiveEventsInfoType } from "./handleEvents";
import { HandleNodesType, NodeFactory } from "./handlerFactory";
export type EventNodeType = {
    node: HTMLDivElement;
    nodeProperty: HandleNodesType;
};

export type EventExtraType = {
    interactiveContainerId: string | null;
};

export type NodeEventsCallback = {
    mousedownCallback?: (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => void;
    mouseupCallback?: (event?: MouseEvent) => void;
};

type InteractiveHandler = (
    container: HTMLDivElement,
    canvas: HTMLCanvasElement,
    sendMonitorData: () => void
) => {
    surroundContainer: (property: RendererContext["containerProperty"]) => void;
    bindDocumentEvents: () => void;
    bindNodeEventsCallback: (callbacks: NodeEventsCallback) => void;
    bindNodeEvents: () => void;
    interactiveContainerId: null | string;
    bindInteractiveContainerId: (id: string) => void;
    interactiveEventsInfo: InteractiveEventsInfoType;
    handleContainerMousedown: (event: MouseEvent, container: SimpleRenderContextType) => void;
    handleContainerMousemove: (event: MouseEvent) => void;
    handleContainerMouseup: () => void;
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
    let nodeEventsCallback: NodeEventsCallback | null = null;
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
        const { vertexOffsetX, vertexOffsetY, widthIncrement, heightIncrement, startX, startY, currentX, currentY } = interactiveEventsInfo.currentIncrement;

        let pX = property.position.x + vertexOffsetX,
            pY = property.position.y + vertexOffsetY,
            sW = property.size.width + widthIncrement,
            sH = property.size.height + heightIncrement;

        // // 约束容器位置
        pX = Math.min(Math.max(0, pX), baseProperty.canvasMaxWidth - property.size.width);
        pY = Math.min(Math.max(0, pY), baseProperty.canvasMaxHeight - property.size.height);
        sW = Math.min(baseProperty.canvasMaxWidth - property.position.x, Math.max(1, sW));
        sH = Math.min(baseProperty.canvasMaxHeight - property.position.y, Math.max(1, sH));
        if (pX === 0) {
            if (vertexOffsetX < 0) {
                sW = property.size.width;
            }
            if (widthIncrement !== 0) {
                sW += property.position.x;
            }
        }
        if (pY === 0) {
            if (vertexOffsetY < 0) {
                sH = property.size.height;
            }
            if (heightIncrement !== 0) {
                sW += property.position.y;
            }
        }
        if (sW === 1) {
            if (vertexOffsetX > 0) pX = property.position.x + property.size.width;
            else pX = property.position.x;
        }
        if (sH === 1) {
            if (vertexOffsetY > 0) pY = property.position.y + property.size.height;
            else pY = property.position.y;
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
    const surroundContainer = (property: RendererContext["containerProperty"]) => {
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

    const disableMarkContainer = () => {
        Object.assign(interactiveMarkElement.style, {
            display: "none",
        });
    };

    /**
     * 处理容器上mousedown逻辑
     */
    const handleContainerMousedown = (event: MouseEvent, target: SimpleRenderContextType) => {
        interactiveEventsInfo.isContainerMousedown = true;
        interactiveEventsInfo.mousedownEvent = event;
        recordIncrementStartOffset(event);
        bindInteractiveContainerId(target.id);
        surroundContainer(target.containerProperty);
        commitUpdateMonitor();
    };

    /**
     * 处理容器上mousedown逻辑
     */
    const handleContainerMouseup = () => {
        if (interactiveEventsInfo.isContainerMousedown) {
            interactiveEventsInfo.isContainerMousedown = false;
            interactiveEventsInfo.mousedownEvent = null;
        }
    };
    /**
     * 处理节点上mousedown逻辑
     */
    const handleNodeMouseup = () => {
        if (interactiveEventsInfo.isNodeMousedown) {
            interactiveEventsInfo.isNodeMousedown = false;
            interactiveEventsInfo.currentEventNode = null;
        }
    };

    /**
     * 处理容器上mousemove逻辑
     */
    const handleContainerMousemove = (event: MouseEvent) => {
        if (interactiveEventsInfo.isContainerMousedown && interactiveEventsInfo.mousedownEvent) {
            recordIncrementVertex(event);
            commitUpdateMonitor();
        }
    };

    /**
     * 处理节点上mousemove逻辑
     */
    const handleNodeMousemove = (event: MouseEvent) => {
        if (interactiveEventsInfo.isNodeMousedown && interactiveEventsInfo.currentIncrement) {
            recordIncrementVertex(event);
            commitUpdateMonitor();
        }
    };

    /**
     * 给渲染最外层容器绑定事件处理，用来控制节点点击状态等
     */
    const bindDocumentEvents = () => {
        document.onmousedown = (event) => {
            event.preventDefault();
        };
        document.onmouseup = (event) => {
            nodeEventsCallback?.mouseupCallback && nodeEventsCallback.mouseupCallback(event);
            interactiveEventsInfo.currentIncrement = null;
            handleContainerMouseup();
            handleNodeMouseup();
            disableMarkContainer();
            commitUpdateMonitor();
        };

        /**
         * 用来控制节点move
         */
        document.onmousemove = (event) => {
            handleContainerMousemove(event);
            handleNodeMousemove(event);
        };
    };

    /**
     * 记录交互开始的增量值
     * @param startX
     * @param startY
     */
    const recordIncrementStartOffset = (event: MouseEvent) => {
        const startX = event.clientX;
        const startY = event.clientY;
        interactiveEventsInfo.currentIncrement = {
            startX,
            startY,
            currentX: startX,
            currentY: startY,
            vertexOffsetX: 0,
            vertexOffsetY: 0,
            widthIncrement: 0,
            heightIncrement: 0,
        };
    };

    /**
     * 记录当前偏移并计算顶点偏移
     * @param event
     * @returns
     */
    const recordIncrementVertex = (event: MouseEvent) => {
        if (!interactiveEventsInfo.currentIncrement) return;
        interactiveEventsInfo.currentIncrement.currentX = event.clientX;
        interactiveEventsInfo.currentIncrement.currentY = event.clientY;

        const incrementX = interactiveEventsInfo.currentIncrement.currentX - interactiveEventsInfo.currentIncrement.startX;
        const incrementY = interactiveEventsInfo.currentIncrement.currentY - interactiveEventsInfo.currentIncrement.startY;

        const { isContainerMousedown, isNodeMousedown } = interactiveEventsInfo;
        if (isContainerMousedown) {
            interactiveEventsInfo.currentIncrement.vertexOffsetX = incrementX;
            interactiveEventsInfo.currentIncrement.vertexOffsetY = incrementY;
        }
        if (isNodeMousedown) {
            // 判断尺寸增量
            switch (interactiveEventsInfo.currentEventNode?.nodeProperty.position.value) {
                case 1:
                    interactiveEventsInfo.currentIncrement.vertexOffsetX = incrementX;
                    interactiveEventsInfo.currentIncrement.vertexOffsetY = incrementY;
                    interactiveEventsInfo.currentIncrement.widthIncrement = -incrementX;
                    interactiveEventsInfo.currentIncrement.heightIncrement = -incrementY;
                    break;
                case 2:
                    interactiveEventsInfo.currentIncrement.vertexOffsetX = 0;
                    interactiveEventsInfo.currentIncrement.vertexOffsetY = incrementY;
                    interactiveEventsInfo.currentIncrement.widthIncrement = incrementX;
                    interactiveEventsInfo.currentIncrement.heightIncrement = -incrementY;
                    break;
                case 3:
                    interactiveEventsInfo.currentIncrement.vertexOffsetX = incrementX;
                    interactiveEventsInfo.currentIncrement.vertexOffsetY = 0;
                    interactiveEventsInfo.currentIncrement.widthIncrement = -incrementX;
                    interactiveEventsInfo.currentIncrement.heightIncrement = incrementY;
                    break;

                case 4:
                    interactiveEventsInfo.currentIncrement.vertexOffsetX = 0;
                    interactiveEventsInfo.currentIncrement.vertexOffsetY = 0;
                    interactiveEventsInfo.currentIncrement.widthIncrement = incrementX;
                    interactiveEventsInfo.currentIncrement.heightIncrement = incrementY;
                    break;
                default:
            }
        }
    };

    const bindNodeEventsCallback = (callbacks?: NodeEventsCallback) => {
        if (callbacks) {
            nodeEventsCallback = callbacks;
        }
    };
    /**
     * 为可操作节点绑定事件，用来操控位置大小变化等
     */
    const bindNodeEvents = () => {
        Array.from(nodes).forEach((eventNode, index) => {
            eventNode.node.onmousedown = (event: MouseEvent) => {
                recordIncrementStartOffset(event);
                interactiveEventsInfo.isNodeMousedown = true;
                interactiveEventsInfo.currentEventNode = eventNode;

                nodeEventsCallback?.mousedownCallback &&
                    nodeEventsCallback?.mousedownCallback(event, eventNode, {
                        interactiveContainerId,
                    });
                commitUpdateMonitor();
            };
        });
    };

    return new Proxy(
        {
            surroundContainer,
            bindNodeEventsCallback,
            bindNodeEvents,
            bindDocumentEvents,
            interactiveEventsInfo,
            handleContainerMousedown,
            handleContainerMousemove,
            handleContainerMouseup,
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
