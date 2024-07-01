export type ContainerTypeSupports = HTMLDivElement;

type RendererContext = {
    isBase?: boolean;
    boundContainer: null | ContainerTypeSupports;
    isRender: boolean;
};

export const initializeContainer = (baseContainer: ContainerTypeSupports) => {
    const { bindContainer, render } = Renderer();
    bindContainer(baseContainer, true);
    render();
};
/**
 * 渲染器
 * 通过bindContainer绑定当前元素的容器
 * 调用render，把子元素渲染到当前元素中
 */
const Renderer = () => {
    const context: RendererContext = {
        isBase: false,
        boundContainer: null,
        isRender: false,
    };

    /**
     *
     * @param container
     * @param isBase 是否是根节点，如果是根节点，则默认把
     */
    const bindContainer = (
        container: ContainerTypeSupports,
        isBase = false
    ) => {
        context.boundContainer = container;
        context.isBase = isBase;

        // 避免开发环境重复渲染
        if (process.env.NODE_ENV === "development") {
            if (container?.querySelectorAll("canvas").length !== 0) return;
        }

        if (markRender() && isBase && container) {
            const canvas = document.createElement("canvas");
            container?.appendChild(canvas);

            canvas.width = container?.clientWidth || 0;
            canvas.height = container?.clientHeight || 0;
            markRender();
        }
    };

    const render = () => {
        
    };

    const markRender = () => {
        context.isRender = true;
        return context.isRender;
    };

    return {
        bindContainer,
        render,
    };
};

export default Renderer;
