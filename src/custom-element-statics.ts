export interface CustomElementStatics {
    /**
     * Use a shadow root.
     */
    shadow?: boolean;

    /**
     * Content to add inside of a <style> element.
     */
    style?: string | ((tag: string) => string);

    /**
     * HTML template.
     */
    template?: string;
}

export interface CustomElementStaticsMetadata extends CustomElementStatics {
    /**
     * Always a string at this point, not a function.
     */
    style?: string;
}
