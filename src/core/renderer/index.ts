import { ContainerProperty, ElementContainer } from "../element/container";
import { extractCanvas } from "../utils/extractCanvas";

export type ContainerTypeSupports = HTMLDivElement;

type RendererContext = {
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
    let canvasElement: HTMLCanvasElement | null = null;
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
    const bindContainer = (
        container: ContainerTypeSupports,
        isBase = false
    ) => {
        context.boundContainer = container;
        context.isBase = isBase;

        if (isBase) {
            context.drawable = true;
        }

        if (markRender() && isBase && container) {
            const canvas = document.createElement("canvas");

            canvasElement = canvas;
            container?.appendChild(canvas);

            // 初始化Canvas
            const width = container?.clientWidth || 0;
            const height = container?.clientHeight || 0;
            canvas.width = width;
            canvas.height = height;
            markRender();

            // 初始化容器参数
            const elementContainer = ElementContainer({
                size: {
                    width,
                    height,
                },
            });
            context.containerProperty = elementContainer.property;
        }
    };

    /**
     * 父元素调用，添加子元素到渲染列表
     * @param property
     */
    const addChildren = (renderer: RendererType) => {
        if (
            context.children.findIndex(
                (item) => item.context.id === renderer.context.id
            ) === -1
        ) {
            context.children.push(renderer);
        }
    };

    const markRender = () => {
        context.isRender = true;
        return context.isRender;
    };

    const drawableRender = () => {
        if (!context.drawable) return;
        const renderArr: ContainerProperty[] = [];

        function parseContainer(context: RendererContext) {
            if (context.containerProperty === null) return;
            renderArr.push(context.containerProperty);
            context.children.forEach((item) => {
                parseContainer(item.context);
            });
        }
        parseContainer(context);

        render(renderArr);
    };

    const render = (containerProperties: ContainerProperty[]) => {
        const { drawable } = context;
        if (!canvasElement || !drawable) return;
        const { ctx } = extractCanvas(canvasElement);
        if (!ctx) return;

        for (let i = 0; i < containerProperties.length; i++) {
            const property = containerProperties[i];
            const moveToX = property.position?.x || 0;
            const moveToY = property.position?.y || 0;
            ctx.fillStyle = property.style?.backgroundColor || "rgb(200,0,0)";
            ctx.fillRect(
                moveToX,
                moveToY,
                property.size?.width || 0,
                property.size?.height || 0
            );
        }
    };

    return {
        context,
        bindContainer,
        drawableRender,
        addChildren,
    };
};

export default Renderer;
