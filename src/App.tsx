import { useEffect, useRef, useState } from "react";
import { ContainerTypeSupports, initializeContainer } from "./core/renderer";

const App = () => {
    const [isRenderBase, setIsRenderBase] = useState(false);
    const containerRef = useRef<ContainerTypeSupports | null>(null);

    useEffect(() => {
        if (containerRef.current && !isRenderBase) {
            initializeContainer(containerRef.current);
            setIsRenderBase(true);
        }
    }, [isRenderBase]);

    return <div className="container" ref={containerRef}></div>;
};

export default App;
