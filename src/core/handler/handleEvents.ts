import { RendererContext } from "../renderer";
import { EventNodeType } from "./interactive";

export type InteractiveEventsInfoType = {
    isContainerMousedown: boolean;
    isNodeMousedown: boolean;
    mousedownEvent: MouseEvent | null;
    currentEventNode: EventNodeType | null;
    currentIncrement: null | {
        startX: number;
        currentX?: number;
        startY: number;
        currentY?: number;
        vertexOffsetX: number;
        vertexOffsetY: number;
        widthIncrement: number;
        heightIncrement: number;
    };
    nextContainerProperty: RendererContext["containerProperty"];
};

/**
 * 记录交互事件，一次完整交互所需要记录的状态量
 * @returns
 */
const initializeInteractiveEventsInfo = (): InteractiveEventsInfoType => {
    return {
        isContainerMousedown: false, //是否点击某个渲染容器节点
        isNodeMousedown: false, // 是否点击节点
        mousedownEvent: null, //点击事件后记录的property
        currentEventNode: null, // 当前点击节点的信息
        currentIncrement: null, // 当前交互的各种增量，位移、尺寸等
        nextContainerProperty: null, // increment计算后的property值
    };
};

export default initializeInteractiveEventsInfo;
