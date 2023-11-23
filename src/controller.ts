export interface Controller {
    [key: string]: any;
    onChange?: (propName: string, oldValue: any, newValue: any) => void;
    onInit?: () => void;
    onViewInit?: () => void;
    onDestroy?: () => void;
};
