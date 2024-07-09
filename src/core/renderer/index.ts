import { ContainerProperty, ElementContainer } from "../element/container";
import { interactiveHandler, InteractiveInstance } from "../handler/interactive";
import { interacitiveMonitor, MonitorAdapterInstance, MonitorData } from "../handler/monitor";
import { extractCanvas } from "../utils/extractCanvas";

export type InteractiveCallback = () => void;
export type ContainerTypeSupports = HTMLDivElement;
export type RendererContext = {
    id: string;
    parrentId: string | null;
    containerProperty: null | ContainerProperty;
    canvas: null | HTMLCanvasElement;
    container: null | ContainerTypeSupports;
    isRender: boolean;
    renderContainerWidth: number;
    renderContainerHeight: number;
    interactiveInstance: InteractiveInstance | null;
};
export type SimpleRenderContextType = Pick<RendererContext, "id" | "containerProperty">;

export type RendererType = {
    context: RendererContext;
    initialize: (container: ContainerTypeSupports) => void;
    addChildren: (renderer: RendererType) => void;
    addMonitor: (monitorAdapter: MonitorAdapterInstance) => void;
    refreshRender: () => void;
};

/**
 * 初始化渲染器
 * @param baseContainer 容器DOM
 * @returns 渲染器
 */
export const initializeContainer = (baseContainer: ContainerTypeSupports) => {
    const renderer = Renderer();
    const { initialize } = renderer;
    initialize(baseContainer);
    return renderer;
};

/**
 * 渲染器
 * @param containerProperty
 * @returns
 */
const Renderer = (containerProperty?: ContainerProperty): RendererType => {
    const monitor = interacitiveMonitor();
    const renderList = new Map<string, RendererType>(); // 当前渲染的所有容器
    const context: RendererContext = {
        id: crypto.randomUUID(),
        parrentId: null,
        containerProperty: containerProperty || null,
        container: null,
        canvas: null,
        isRender: false,
        renderContainerWidth: 0, // 记录的渲染容器尺寸。记录后避免每次从DOM元素获取尺寸
        renderContainerHeight: 0,
        interactiveInstance: null,
    };

    /**
     * 初始化整个渲染器
     * @param container
     */
    const initialize = (container: ContainerTypeSupports) => {
        bindContainerDOM(container);

        createCanvas();
        setCanvasProperty();
        bindCanvasEventsCallback();

        bindInteraction();
        markRender();
    };

    /**
     * 绑定DOM元素到container，用来约束canvas的渲染
     * @param container
     */
    const bindContainerDOM = (container: ContainerTypeSupports) => {
        console.log("开始绑定容器");
        context.container = container;

        if (container) {
            // 初始化容器参数
            const elementContainer = ElementContainer({
                position: {
                    x: 0,
                    y: 0,
                },
                size: {
                    width: context.renderContainerWidth,
                    height: context.renderContainerHeight,
                },
            });
            context.containerProperty = elementContainer.property;
        }
    };

    const createCanvas = () => {
        console.log("创建canvas元素");
        // 初始化Canvas
        context.canvas = document.createElement("canvas");
        context.container?.appendChild(context.canvas);
    };

    const bindInteraction = () => {
        console.log("绑定交互层内容");
        if (context.container && context.canvas) {
            // 初始化交互层
            context.interactiveInstance = interactiveHandler(context.container, context.canvas, commitUpdateMonitor);
            bindInteractiveHandler();
        }
    };

    /**
     * 记录并设置canvas元素的DOM属性
     */
    const setCanvasProperty = () => {
        if (!context.canvas) throw new Error("canvas has not been intialized.");
        const interactiveInstance = context.interactiveInstance;

        console.log("开始设置canvas属性");
        const canvasWidth = context.container?.clientWidth || 0;
        const canvasHeight = context.container?.clientHeight || 0;
        let canvasOffsetLeft = 0;
        let canvasOffsetTop = 0;
        context.renderContainerWidth = canvasWidth;
        context.renderContainerHeight = canvasHeight;
        // 设置canvas元素尺寸等
        if (context.canvas) {
            context.canvas.width = context.renderContainerWidth;
            context.canvas.height = context.renderContainerHeight;

            canvasOffsetLeft = context.canvas?.offsetLeft;
            canvasOffsetTop = context.canvas?.offsetTop;
        }

        if (context.containerProperty) {
            context.containerProperty.size = {
                width: canvasWidth,
                height: canvasHeight,
            };
            interactiveInstance?.setCanvasMaxSize(canvasWidth, canvasHeight);
            interactiveInstance?.setCanvasOffset(canvasOffsetLeft, canvasOffsetTop);
        }
    };

    /**
     * 绑定完成Canvas在当前实例上之后，回调
     * 绑定交互处理器
     */
    const bindCanvasEventsCallback = () => {
        if (!context.canvas) throw new Error("canvas has not been intialized.");

        context.canvas.onmousedown = (event) => {
            const topTarget = findTargetContainer(event);
            const interactiveInstance = context.interactiveInstance;
            // 找到交互的节点
            if (!interactiveInstance || !topTarget || topTarget.length === 0) return;

            const target = topTarget[0];
            interactiveInstance.handleContainerMousedown(event, target);
            commitUpdateMonitor();
        };
        context.canvas.onmousemove = (event) => {
            const topTarget = findTargetContainer(event);
            const body = document.querySelector("body");
            if (!body) return;

            // 绑定鼠标样式
            if (topTarget) {
                body.style.cursor = "pointer";
            } else {
                body.style.cursor = "auto";
            }

            context.interactiveInstance?.handleContainerMousemove(event);
        };
    };

    const bindInteractiveHandler = () => {
        console.log("绑定交互处理器");
        const interactiveInstance = context.interactiveInstance;
        interactiveInstance?.bindDocumentEvents();
        interactiveInstance?.bindNodeEventsCallback({
            mouseupCallback: () => {
                const info = context.interactiveInstance?.interactiveEventsInfo;
                if (!info) return;
                const { isNodeMousedown, isContainerMousedown } = info;
                if (isNodeMousedown || isContainerMousedown) {
                    refreshRender();
                }
            },
        });
        interactiveInstance?.bindNodeEvents();
    };

    /**
     * 添加渲染内容到列表
     * @param renderer
     */
    const addChildren = (renderer: RendererType) => {
        renderList.set(renderer.context.id, renderer);
        refreshRender();
    };

    const markRender = () => {
        console.log("标记渲染完成");
        context.isRender = true;
        return context.isRender;
    };

    /**
     * 更新渲染
     */
    const refreshRender = () => {
        console.log("重新渲染canvas");
        if (context.canvas) {
            setCanvasProperty();
        }
        updateInteractiveContainer();
        render();
    };

    /**
     * 更新交互容器的属性
     * @returns
     */
    const updateInteractiveContainer = () => {
        const { interactiveInstance } = context;
        const containerId = interactiveInstance?.interactiveContainerId;
        if (!containerId) return;
        const containerProperty = renderList.get(containerId)?.context.containerProperty;
        if (!containerProperty) return;

        Object.assign(containerProperty, interactiveInstance.interactiveEventsInfo.nextContainerProperty);
        context.interactiveInstance?.surroundContainer(containerProperty);
    };

    /**
     * 实际渲染canvas内容
     * @returns
     */
    const render = () => {
        if (!context.canvas) return;
        const { ctx } = extractCanvas(context.canvas);
        if (!ctx) return;

        renderList.forEach((renderer, id) => {
            const property = renderer.context.containerProperty;
            if (!property) return;
            const moveToX = property.position?.x || 0;
            const moveToY = property.position?.y || 0;
            ctx.fillStyle = property.style?.backgroundColor || "rgb(247,247,247)";
            ctx.fillRect(moveToX, moveToY, property.size?.width || 0, property.size?.height || 0);
        });
    };

    const findTargetContainer = (event: MouseEvent) => {
        const interactiveInstance = context.interactiveInstance;
        if (!interactiveInstance || (interactiveInstance.interactiveEventsInfo.isNodeMousedown && interactiveInstance.interactiveContainerId)) return;
        const canvasPos = context.canvas?.getBoundingClientRect();
        const offsetXToCanvas = event.clientX - (canvasPos?.left || 0);
        const offsetYToCanvas = event.clientY - (canvasPos?.top || 0);
        const targetProperties = findLastRenderContainer(offsetXToCanvas, offsetYToCanvas);

        if (targetProperties.length === 0) return;
        return targetProperties;
    };

    /**
     * 根据坐标，找出最上层的容器
     */
    const findLastRenderContainer = (x: number, y: number): SimpleRenderContextType[] => {
        const targetList: SimpleRenderContextType[] = [];
        const renderListEntries = renderList.entries();

        const priorityList: ({
            priority: number;
        } & SimpleRenderContextType)[] = [];
        for (let i = 0; i < renderList.size; i++) {
            const [id, renderer] = renderListEntries.next().value as [string, RendererType];
            const property = renderer.context.containerProperty;
            if (!property) break;

            const isBase = context.id === id;
            const sx = property.position.x;
            const sy = property.position.y;
            const ex = property.position.x + property.size.width;
            const ey = property.position.y + property.size.height;
            // 判断在内部
            if (!isBase && sx <= x && sy <= y && ex > x && ey > y) {
                let priority = 10;
                if (id === context.interactiveInstance?.interactiveContainerId) {
                    priority = 9;
                }
                priorityList.push({
                    priority: priority,
                    id,
                    containerProperty: property,
                });
            }
        }
        priorityList
            .sort((pre, cur) => pre.priority - cur.priority)
            .forEach((item) => {
                targetList.push({
                    id: item.id,
                    containerProperty: item.containerProperty,
                });
            });
        return targetList;
    };

    const addMonitor = (monitorAdapter: MonitorAdapterInstance) => {
        monitor.addMonitor(monitorAdapter);
    };

    /**
     * 准备发布监视数据
     */
    const commitUpdateMonitor = () => {
        const interactiveInstance = context.interactiveInstance;
        interactiveInstance?.markContainer(
            interactiveInstance?.updateContainerProperty(
                (interactiveInstance?.interactiveContainerId && renderList.get(interactiveInstance.interactiveContainerId)?.context.containerProperty) || null
            )
        );
        sendMonitorData();
    };

    /**
     * 在更新后调用。将数据暴露给所有Monitor
     */
    const sendMonitorData = () => {
        const interactiveInstance = context.interactiveInstance;
        const sendData: MonitorData = {
            interactiveInfo: interactiveInstance?.interactiveEventsInfo,
            nextContainerProperty: interactiveInstance?.interactiveEventsInfo.nextContainerProperty,
        };
        const lastInteractiveContainerId = interactiveInstance?.interactiveContainerId;

        if (lastInteractiveContainerId) {
            Object.assign(sendData, {
                currentContainerId: lastInteractiveContainerId,
                currentContainerProperty: renderList.get(lastInteractiveContainerId)?.context.containerProperty,
            });
        }

        monitor.updateData(sendData);
    };

    return {
        context,
        initialize,
        addChildren,
        addMonitor,
        refreshRender,
    };
};

export default Renderer;
