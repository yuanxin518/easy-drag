export type ContainerProperty = {
    position: {
        vertex: {
            x: number;
            y: number;
        };
    };
    size: {
        width: number;
        height: number;
    };
};

/**
 * 元素容器，作为任何渲染节点的容器
 */
export const ElementContainer = () => {
    const ELE_TYPE = "container";

    const property: ContainerProperty = {
        position: {
            vertex: {
                x: 0,
                y: 0,
            },
        },
        size: {
            width: 0,
            height: 0,
        },
    };

    return {
        property,
    };
};
