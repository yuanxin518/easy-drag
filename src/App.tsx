import { useEffect, useRef, useState } from "react";
import {
    ContainerTypeSupports,
    initializeContainer,
    RendererType,
} from "./core/renderer";
import { testProperty, testProperty2 } from ".";

const App = () => {
    const isRenderBase = useRef(false);
    const containerRef = useRef<ContainerTypeSupports | null>(null);
    const [baseContainer, setBaseContainer] = useState<RendererType | null>(
        null
    );
    useEffect(() => {
        if (containerRef.current && !isRenderBase.current) {
            const baseContainer = initializeContainer(containerRef.current);
            setBaseContainer(baseContainer);
            isRenderBase.current = true;
        }
    }, [isRenderBase]);

    useEffect(() => {
        if (containerRef.current) {
            baseContainer?.addChildren(testProperty);

            baseContainer?.addChildren(testProperty2);
            baseContainer?.drawableRender();
        }
    }, [baseContainer]);

    return <div className="container" ref={containerRef}></div>;
};

export default App;
