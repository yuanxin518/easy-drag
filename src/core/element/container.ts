export type ContainerProperty = {
    position?: {
        x: number;
        y: number;
    };
    size?: {
        width: number;
        height: number;
    };
    style?: {
        backgroundColor: string;
    };
};

/**
 * 元素容器，作为任何渲染节点的容器
 */
export const ElementContainer = (containerProperty?: ContainerProperty) => {
    let property: ContainerProperty | null = Object.assign(
        {},
        {
            ...{
                position: {
                    x: 0,
                    y: 0,
                },
                size: {
                    width: 0,
                    height: 0,
                },
            },
            ...(containerProperty || {}),
        }
    );

    return {
        property,
    };
};
