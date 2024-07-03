import { useCallback } from "react";
import { ContainerProperty } from "../element/container";

export type MonitorAdapter = (callback: (data: MonitorData) => void) => {
    updateMonitorData: (data: MonitorData) => void;
};
export type MonitorAdapterInstance = ReturnType<MonitorAdapter>;

const useReactMonitor: MonitorAdapter = (callback: (data: MonitorData) => void) => {
    const monitorCallback = useCallback(callback, [callback]);

    const updateMonitorData = (data: MonitorData) => {
        monitorCallback(data);
    };

    return {
        updateMonitorData,
    };
};

export { useReactMonitor };

export type MonitorData = {
    currentContainerId?: string;
    currentContainerProperty?: ContainerProperty;
};

type InteractiveMonitor = {
    updateData: (data: MonitorData) => void;
    addMonitor: (monitor: MonitorAdapterInstance) => void;
};

export const interacitiveMonitor = (): InteractiveMonitor => {
    const monitorBucket: MonitorAdapterInstance[] = [];
    const updateData = (data: MonitorData) => {
        monitorBucket.forEach((monitor) => {
            monitor.updateMonitorData(data);
        });
    };

    /**
     * 传入Adapter，获取
     * @param monitor
     */
    const addMonitor = (monitor: MonitorAdapterInstance) => {
        monitorBucket.push(monitor);
    };

    return {
        addMonitor,
        updateData,
    };
};
