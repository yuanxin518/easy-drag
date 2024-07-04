import { ContainerProperty, ElementContainer } from "../element/container";
import { mousedownCallback } from "../handler/handleEvents";
import { interactiveHandler, InteractiveInstance } from "../handler/interactive";
import { interacitiveMonitor, MonitorAdapterInstance, MonitorData } from "../handler/monitor";
import { extractCanvas } from "../utils/extractCanvas";

export type InteractiveCallback = () => void;
export type ContainerTypeSupports = HTMLDivElement;
export type RendererContext = {
    id: string;
    isBase?: boolean;
    containerProperty: null | ContainerProperty;
    boundContainer: null | ContainerTypeSupports;
    isRender: boolean;
    drawable: boolean;
    children: RendererType[];
};

export type RendererType = {
    context: RendererContext;
    bindContainer: (container: ContainerTypeSupports, isBase?: boolean) => void;
    addChildren: (renderer: RendererType) => void;
    drawableRender: () => void;
    addMonitor: (monitorAdapter: MonitorAdapterInstance) => void;
    interactiveInstance: InteractiveInstance | null;
    commitUpdateMonitor: () => void;
};

export const initializeContainer = (baseContainer: ContainerTypeSupports) => {
    const renderer = Renderer();
    const { bindContainer } = renderer;
    bindContainer(baseContainer, true);

    return renderer;
};
/**
 * 渲染器
 * 通过bindContainer绑定当前元素的容器
 * 调用render，把子元素渲染到当前元素中
 */
const Renderer = (containerProperty?: ContainerProperty): RendererType => {
    let canvasElement: HTMLCanvasElement | null = null; //内容渲染层
    let interactiveInstance: InteractiveInstance | null = null; //交互层

    const monitor = interacitiveMonitor();
    const renderList = new Map<string, ContainerProperty>();
    const context: RendererContext = {
        id: crypto.randomUUID(),
        isBase: false,
        containerProperty: containerProperty || null,
        boundContainer: null,
        isRender: false,
        children: [],
        drawable: false, //是否可以渲染，如果可以渲染，则以这个容器为根节点向下渲染
    };

    /**
     *
     * @param container
     * @param isBase 是否是根节点
     */
    const bindContainer = (container: ContainerTypeSupports, isBase = false) => {
        context.boundContainer = container;
        context.isBase = isBase;

        if (isBase) {
            context.drawable = true;
        }

        if (markRender() && isBase && container) {
            // 初始化Canvas
            canvasElement = document.createElement("canvas");
            container?.appendChild(canvasElement);
            boundCanvasCallback();
            const width = container?.clientWidth || 0;
            const height = container?.clientHeight || 0;
            canvasElement.width = width;
            canvasElement.height = height;
            markRender();

            // 初始化交互层
            interactiveInstance = interactiveHandler(container, canvasElement, commitUpdateMonitor);
            bindInteractiveHandler();

            // 初始化容器参数
            const elementContainer = ElementContainer({
                position: {
                    x: 0,
                    y: 0,
                },
                size: {
                    width,
                    height,
                },
            });
            context.containerProperty = elementContainer.property;
        }
    };

    /**
     * 绑定完成Canvas在当前实例上之后，回调
     * 绑定交互处理器
     */
    const boundCanvasCallback = () => {
        if (!canvasElement || !context.isBase) return;

        console.log("绑定canvas内move交互回调函数");
        canvasElement.onmousemove = (event) => {
            if (!interactiveInstance || (interactiveInstance.interactiveEventsInfo.isMousedown && interactiveInstance.interactiveContainerId)) return;
            const canvasPos = canvasElement?.getBoundingClientRect();
            const offsetXToCanvas = event.clientX - (canvasPos?.left || 0);
            const offsetYToCanvas = event.clientY - (canvasPos?.top || 0);
            const targetProperties = findLastRenderContainer(offsetXToCanvas, offsetYToCanvas);

            if (targetProperties.length === 0) return;

            const topTarget = targetProperties[0];
            interactiveInstance.bindInteractiveContainerId(topTarget.id);

            if (!topTarget) return;
            interactiveInstance.surroundContainer(topTarget.id, topTarget.containerProperty);
            commitUpdateMonitor();
        };
    };

    const bindInteractiveHandler = () => {
        console.log("绑定交互处理器", interactiveInstance);
        interactiveInstance?.bindContainerEvents();
        interactiveInstance?.bindNodeEventCallback({
            mousedownCallback,
        });
    };

    /**
     * 父元素调用，添加子元素到渲染列表
     * @param property
     */
    const addChildren = (renderer: RendererType) => {
        if (context.children.findIndex((item) => item.context.id === renderer.context.id) === -1) {
            context.children.push(renderer);
        }
    };

    const markRender = () => {
        console.log("标记渲染完成");
        context.isRender = true;
        return context.isRender;
    };

    const drawableRender = () => {
        if (!context.drawable) return;

        function parseContainer(context: RendererContext) {
            if (context.containerProperty === null) return;
            renderList.set(context.id, context.containerProperty);
            context.children.forEach((item) => {
                parseContainer(item.context);
            });
        }
        parseContainer(context);
        render();
    };

    const render = () => {
        const { drawable } = context;
        if (!canvasElement || !drawable) return;
        const { ctx } = extractCanvas(canvasElement);
        if (!ctx) return;

        renderList.forEach((property, id) => {
            const moveToX = property.position?.x || 0;
            const moveToY = property.position?.y || 0;
            ctx.fillStyle = property.style?.backgroundColor || "rgb(200,0,0)";
            ctx.fillRect(moveToX, moveToY, property.size?.width || 0, property.size?.height || 0);
        });
    };

    /**
     * 根据点，找出最上层的容器
     */
    const findLastRenderContainer = (x: number, y: number): Pick<RendererContext, "id" | "containerProperty">[] => {
        const targetList = [];
        const renderListEntries = renderList.entries();
        for (let i = 0; i < renderList.size; i++) {
            const [id, property] = renderListEntries.next().value as [string, ContainerProperty];

            const isBase = context.id === id;
            const sx = property.position.x;
            const sy = property.position.y;
            const ex = property.position.x + property.size.width;
            const ey = property.position.y + property.size.height;
            // 判断在内部
            if (!isBase && sx <= x && sy <= y && ex > x && ey > y) {
                targetList.unshift({
                    id,
                    containerProperty: property,
                });
            }
        }
        return targetList;
    };

    const addMonitor = (monitorAdapter: MonitorAdapterInstance) => {
        monitor.addMonitor(monitorAdapter);
    };

    /**
     * 准备发布监视数据
     */
    const commitUpdateMonitor = () => {
        interactiveInstance?.markContainer(
            interactiveInstance?.updateContainerProperty((interactiveInstance?.interactiveContainerId && renderList.get(interactiveInstance.interactiveContainerId)) || null)
        );
        sendMonitorData();
    };

    /**
     * 在更新后调用。将数据暴露给所有Monitor
     */
    const sendMonitorData = () => {
        const sendData: MonitorData = {
            interactiveInfo: interactiveInstance?.interactiveEventsInfo,
            nextContainerProperty: interactiveInstance?.interactiveEventsInfo.nextContainerProperty,
        };
        const lastInteractiveContainerId = interactiveInstance?.interactiveContainerId;

        if (lastInteractiveContainerId) {
            Object.assign(sendData, {
                currentContainerId: lastInteractiveContainerId,
                currentContainerProperty: renderList.get(lastInteractiveContainerId),
            });
        }

        monitor.updateData(sendData);
    };

    return {
        context,
        bindContainer,
        drawableRender,
        addChildren,
        addMonitor,
        interactiveInstance,
        commitUpdateMonitor,
    };
};

export default Renderer;
