export const extractCanvas = (canvas: HTMLCanvasElement) => {
    const canvasInstance = canvas;

    const context = canvasInstance.getContext("2d");
    return {
        ctx: context,
    };
};
