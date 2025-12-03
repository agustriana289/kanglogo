// types/global.d.ts
declare global {
    interface Window {
        grecaptcha: {
            render: (element: HTMLElement, options: any) => number;
            reset: (widgetId?: number) => void;
            getResponse: (widgetId?: number) => string;
        };
    }
}

export { };