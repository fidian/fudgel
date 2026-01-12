export interface CustomElementConfig {
    /**
     * Attributes to map to the controller's properties. When a value here
     * matches a value in `prop`, then it is a one-way binding from attribute
     * to internal property. Otherwise, a two-way binding is set up so changes
     * to the internal property is reflected in the DOM.
     *
     * Values in here should be property names in camelCase, without hyphens.
     */
    attr?: Iterable<string>;

    /**
     * Element properites to map to the controller's internal properties. This
     * is always a two-way binding.
     *
     * Values in here should be property names in camelCase, without hyphens.
     */
    prop?: Iterable<string>;

    /**
     * Content to add inside of a <style> element.
     */
    style?: string;

    /**
     * HTML template. Required.
     */
    template: string;

    /**
     * Whether or not the shadow DOM should be used.
     */
    useShadow?: boolean;
}

export interface CustomElementConfigInternal {
    attr: Set<string>;
    cssClassName: string;
    prop: Set<string>;
    style: string;
    template: string;
    useShadow?: boolean;
}
