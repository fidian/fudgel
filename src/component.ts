/**
 * Set up config and define a custom element.
 */
import { camelToDash } from './util.js';
import { Constructor } from './constructor.js';
import { Controller } from './controller.js';
import {
    createTemplate,
    createTreeWalker,
    sandboxStyleRules
} from './elements.js';
import { CustomElement } from './custom-element.js';
import {
    CustomElementConfig,
    CustomElementConfigInternal,
} from './custom-element-config.js';
import {
    metadataComponentConfig,
    metadataComponentController,
} from './metadata.js';
import { bootstrap, nextN } from './global.js';

// Decorator to wire a class as a custom component
export const Component = (tag: string, config: CustomElementConfig) => {
    return (target: Constructor) => {
        component(tag, config, target);
    };
};

const ce = customElements;
let cssScopeMethod = () => {
    const result = sandboxStyleRules('@scope{}').length > 0;
    cssScopeMethod = () => result;

    return result;
}

export const component = (
    tag: string,
    configInitial: CustomElementConfig,
    constructor?: Constructor
) => {
    bootstrap();
    const className = `fudgel-${nextN()}`;
    const style = scopeStyle(configInitial.style || '', tag, className);
    const config = {
        ...configInitial,
        className,
        style,
    } as CustomElementConfigInternal;
    const base = class extends CustomElement {
        static observedAttributes: string[] = (config.attr || []).map(
            camelToDash
        );
    };
    metadataComponentConfig(base, config as CustomElementConfigInternal);
    metadataComponentController(
        base,
        constructor || class implements Controller {}
    );
    const template = createTemplate();
    template.innerHTML = config.template;
    updateClasses(template, className);
    config.template = template.innerHTML;
    ce.get(tag) || ce.define(tag, base);
};

const updateClasses = (templateNode: HTMLTemplateElement, id: string) => {
    const treeWalker = createTreeWalker(templateNode.content, 0x01);
    let currentNode;

    while ((currentNode = treeWalker.nextNode())) {
        if (currentNode.nodeName === 'TEMPLATE') {
            updateClasses(currentNode as HTMLTemplateElement, id);
        }

        (currentNode as HTMLElement).classList.add(id);
    }
};

// Scope the style to the component by adding the element name at the beginning
// (only if not using @scope) and adding a custom class name to the end. Once
// browsers universally support the :scope selector, this can be simplified.
const scopeStyle = (style: string, tag: string, className: string) => {
    let modified = '';

    for (const rule of sandboxStyleRules(style)) {
        const original = (rule as any).selectorText || '';

        // Once :scope is universally supported, this can be simplified
        // const modifiedSelector = original.replace(
        //     /(?<!(?:^|[^\\])(?:\\\\)*\\)\s*(,|$)/g,
        //     `.${className}$1`
        // );
        const modifiedSelector = original
            .split(/(?<!(?:^|[^\\])(?:\\\\)*\\)\s*,/)
            .map(
                cssScopeMethod()
                    ? (input: string) => `${input}.${className}`
                    : (input: string) =>
                          `${tag} ${input}.${className}`.replace(/ :scope/, '')
            )
            .join(',');
        modified += `${modifiedSelector}${rule.cssText.slice(original.length)}`;
    }

    return cssScopeMethod() ? `@scope{${modified}}` : modified;
};
