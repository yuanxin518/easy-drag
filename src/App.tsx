import { useEffect, useRef, useState } from "react";
import { ContainerTypeSupports, initializeContainer, RendererType } from "./core/renderer";
import { testProperty, testProperty2 } from ".";
import { MonitorData, useReactMonitor } from "./core/handler/monitor";

const App = () => {
    const isRenderBase = useRef(false);
    const containerRef = useRef<ContainerTypeSupports | null>(null);
    const [baseContainer, setBaseContainer] = useState<RendererType | null>(null);

    const [monitorData, setMonitorData] = useState<MonitorData>();

    // 创建监视器，监听渲染器内部数据
    const reactMonitor = useReactMonitor((data: MonitorData) => {
        setMonitorData({ ...monitorData, ...data });
    });

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
                <p>当前选中容器id:{monitorData?.currentContainerId}</p>
                <p>当前信息:{monitorData?.currentContainerProperty?.position.x}</p>
            </div>
        </>
    );
};

export default App;
