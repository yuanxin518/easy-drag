import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Renderer from "./core/renderer";

const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement
);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

export const testProperty = Renderer({
    position: {
        x: 10,
        y: 10,
    },
    size: {
        width: 50,
        height: 50,
    },
    style: {
        backgroundColor: "rgb(0,0,0)",
    },
});

export const testProperty2 = Renderer({
    position: {
        x: 80,
        y: 10,
    },
    size: {
        width: 50,
        height: 50,
    },
    style: {
        backgroundColor: "rgb(0,0,0)",
    },
});
