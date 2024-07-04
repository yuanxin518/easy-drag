import { RendererContext } from "../renderer";
import { EventExtraType, EventNodeType } from "./interactive";

export type InteractiveEventsInfoType = {
    isMousedown: boolean;
    currentEventNode: EventNodeType | null;
    currentIncrement: null | {
        startX: number;
        currentX?: number;
        startY: number;
        currentY?: number;
        vertexOffsetX?: number;
        vertexOffsetY?: number;
    };
    nextContainerProperty: RendererContext["containerProperty"];
};

/**
 * 记录交互事件，一次完整交互所需要记录的状态量
 * @returns
 */
const initializeInteractiveEventsInfo = (): InteractiveEventsInfoType => {
    return {
        isMousedown: false, // 是否点击节点
        currentEventNode: null, // 当前点击节点的信息
        currentIncrement: null, // 当前交互的各种增量，位移、尺寸等
        nextContainerProperty: null,
    };
};

const mousedownCallback = (event?: MouseEvent, nodeInfo?: EventNodeType, extraInfo?: EventExtraType) => {
    if (!nodeInfo || !extraInfo) return;
    const { nodeProperty, node } = nodeInfo;
    const [left, top, translateX, translateY] = nodeProperty.value;

    if (left === 0 && top === 0) {
        console.log("左上", node);
    } else if (left !== 0 && top === 0) {
        console.log("右上", node);
    } else if (left === 0 && top !== 0) {
        console.log("左下", node);
    } else {
        console.log("右下", node);
    }
};

export { mousedownCallback };
export default initializeInteractiveEventsInfo;
