import { useEffect, useRef, useState } from "react";
import { ContainerTypeSupports, initializeContainer, RendererType } from "./core/renderer";
import { testProperty, testProperty2 } from ".";
import { MonitorData, useReactMonitor } from "./core/handler/monitor";
import PropertyItem from "./core/component/propertyItem";

const App = () => {
    const isRenderBase = useRef(false);
    const containerRef = useRef<ContainerTypeSupports | null>(null);
    const [baseContainer, setBaseContainer] = useState<RendererType | null>(null);
    const [monitorData, setMonitorData] = useState<MonitorData>();

    const [monitorInfo, setMonitorInfo] = useState<{
        containerId?: string;
        leftToScreen?: number;
        topToScreen?: number;
        containerWidth?: number;
        containerHeight?: number;
        isInteractive?: boolean;
        interactiveNodeDesc?: string;
        interactiveStartX?: number;
        interactiveStartY?: number;
        interactiveIncrementX?: number;
        interactiveIncrementY?: number;
        interactiveIncrementWidth?: number;
        interactiveIncrementHeight?: number;
        vertexIncrementX?: number;
        vertexIncrementY?: number;
    }>(); // 展示的信息
    // 创建监视器，监听渲染器内部数据
    const reactMonitor = useReactMonitor((data: MonitorData) => {
        setMonitorData({ ...monitorData, ...data });
    });

    useEffect(() => {
        // const incrementX = !monitorData?.interactiveInfo?.currentIncrement
        //     ? undefined
        //     : (monitorData?.interactiveInfo?.currentIncrement?.currentX || 0) - (monitorData?.interactiveInfo?.currentIncrement?.startX || 0);
        // const incrementY = !monitorData?.interactiveInfo?.currentIncrement
        //     ? undefined
        //     : (monitorData?.interactiveInfo?.currentIncrement?.currentY || 0) - (monitorData?.interactiveInfo?.currentIncrement?.startY || 0);

        setMonitorInfo({
            containerId: monitorData?.currentContainerId,
            leftToScreen: monitorData?.currentContainerProperty?.position.x,
            topToScreen: monitorData?.currentContainerProperty?.position.y,
            containerWidth: monitorData?.currentContainerProperty?.size.width,
            containerHeight: monitorData?.currentContainerProperty?.size.height,
            isInteractive: monitorData?.interactiveInfo?.isMousedown,
            interactiveNodeDesc: monitorData?.interactiveInfo?.currentEventNode?.nodeProperty.position.desc,
            interactiveStartX: monitorData?.interactiveInfo?.currentIncrement?.startX,
            interactiveStartY: monitorData?.interactiveInfo?.currentIncrement?.startY,
            // interactiveIncrementX: incrementX,
            // interactiveIncrementY: incrementY,
            // interactiveIncrementWidth: !monitorData?.interactiveInfo?.currentIncrement
            //     ? undefined
            //     : (monitorData?.interactiveInfo?.currentIncrement?.currentX || 0) - (monitorData?.interactiveInfo?.currentIncrement?.startX || 0),
            // interactiveIncrementHeight: !monitorData?.interactiveInfo?.currentIncrement
            //     ? undefined
            //     : (monitorData?.interactiveInfo?.currentIncrement?.currentY || 0) - (monitorData?.interactiveInfo?.currentIncrement?.startY || 0),
            vertexIncrementX: monitorData?.interactiveInfo?.currentIncrement?.vertexOffsetX,
            vertexIncrementY: monitorData?.interactiveInfo?.currentIncrement?.vertexOffsetY,
        });
    }, [monitorData]);

    useEffect(() => {
        if (!baseContainer) return;
        baseContainer?.addMonitor(reactMonitor);
    }, [baseContainer]);

    // 初始化渲染器
    useEffect(() => {
        if (containerRef.current && !isRenderBase.current) {
            const baseContainer = initializeContainer(containerRef.current);
            setBaseContainer(baseContainer);
            isRenderBase.current = true;
        }
    }, [isRenderBase]);

    // 渲染部分自定义内容
    useEffect(() => {
        if (containerRef.current) {
            baseContainer?.addChildren(testProperty);

            baseContainer?.addChildren(testProperty2);
            baseContainer?.drawableRender();
        }
    }, [baseContainer]);

    return (
        <>
            <div className="container" ref={containerRef}></div>
            <div className="info">
                <PropertyItem type="input" property={[["当前选中控制节点所在容器id", monitorInfo?.containerId]]} />
                <PropertyItem
                    type="input"
                    property={[
                        ["距离左边界(px)", monitorInfo?.leftToScreen],
                        ["距离上边界(px)", monitorInfo?.topToScreen],
                    ]}
                />
                <PropertyItem
                    type="input"
                    property={[
                        ["宽度(px)", monitorInfo?.containerWidth],
                        ["高度(px)", monitorInfo?.containerHeight],
                    ]}
                />
                <PropertyItem type="status" property={[["是否交互", monitorInfo?.isInteractive]]} />
                <PropertyItem type="input" property={[["控制节点", monitorInfo?.interactiveNodeDesc]]} />
                <PropertyItem
                    type="input"
                    property={[
                        ["起始偏移X", monitorInfo?.interactiveStartX],
                        ["起始偏移Y", monitorInfo?.interactiveStartY],
                    ]}
                />
                <PropertyItem
                    type="input"
                    property={[
                        ["左上顶点X偏移", monitorInfo?.vertexIncrementX],
                        ["左上顶点Y偏移", monitorInfo?.vertexIncrementY],
                    ]}
                />
                {/* <PropertyItem
                    type="input"
                    property={[
                        ["偏移X增量", monitorInfo?.interactiveIncrementX],
                        ["偏移Y增量", monitorInfo?.interactiveIncrementY],
                        ["宽度增量", monitorInfo?.interactiveIncrementWidth],
                        ["高度增量", monitorInfo?.interactiveIncrementHeight],
                    ]}
                /> */}
            </div>
        </>
    );
};

export default App;
