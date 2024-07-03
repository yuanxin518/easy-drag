import { EventExtraType, EventNodeType } from "./interactive";

export type InteractiveEventsInfoType = {
    isMousedown: boolean;
};

const initializeInteractiveEventsInfo = (): InteractiveEventsInfoType => {
    return {
        isMousedown: false,
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
