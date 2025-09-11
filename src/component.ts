/**
 * Set up config and define a custom element.
 */
import { camelToDash } from './util.js';
import { Constructor } from './constructor.js';
import { Controller } from './controller.js';
import {
    createTemplate,
    createTreeWalker,
    sandboxStyleRules,
    toggleClass,
} from './elements.js';
import { CustomElement } from './custom-element.js';
import {
    CustomElementConfig,
    CustomElementConfigInternal,
} from './custom-element-config.js';
import { hooksRun } from './hooks.js';
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

export const component = (
    tag: string,
    configInitial: CustomElementConfig,
    constructor?: Constructor
) => {
    bootstrap();
    const className = `fudgel-${nextN()}`;
    const style = scopeStyle(
        configInitial.style || '',
        tag,
        className,
        configInitial.useShadow
    );
    const config = {
        ...configInitial,
        className,
        style,
    } as CustomElementConfigInternal;

    // Define the class and use the older method of defining a static property
    // to support more browsers.
    class Base extends CustomElement {};
    (Base as any).observedAttributes = (config.attr || []).map(camelToDash);
    metadataComponentConfig(Base, config as CustomElementConfigInternal);
    metadataComponentController(
        Base,
        constructor || class implements Controller {}
    );
    const template = createTemplate();
    template.innerHTML = config.template;
    updateClasses(template, className);
    config.template = template.innerHTML;
    hooksRun('component', Base, Base, config);
    ce.get(tag) || ce.define(tag, Base);
};

const updateClasses = (templateNode: HTMLTemplateElement, id: string) => {
    const treeWalker = createTreeWalker(templateNode.content, 0x01);
    let currentNode;

    while ((currentNode = treeWalker.nextNode())) {
        if (currentNode.nodeName === 'TEMPLATE') {
            updateClasses(currentNode as HTMLTemplateElement, id);
        }

        toggleClass(currentNode as HTMLElement, id, true);
    }
};

export const scopeStyle = (
    style: string,
    tag: string,
    className: string,
    useShadow?: boolean
) => {
    const scopeStyleRule = (rule: CSSRule, tagForScope: string) => {
        if ((rule as CSSStyleRule)[SELECTOR_TEXT]) {
            (rule as CSSStyleRule)[SELECTOR_TEXT] = (rule as CSSStyleRule)[
                SELECTOR_TEXT
            ].split(',')
                .map((selectorText: string) =>
                    updateSelectorText(selectorText, tagForScope)
                )
                .join(',');
            tagForScope = ''; // Don't need to scope children selectors
        }

        for (const childRule of (rule as CSSGroupingRule).cssRules ?? []) {
            scopeStyleRule(childRule, tagForScope);
        }

        return rule.cssText;
    };

    const updateSelectorText = (selector: string, tagForScope: string) => {
        selector = selector.trim();
        const addSuffix = (x: string) => `${x}.${className}`;
        const replaceScope = (x: string, withThis: string) =>
            x.replace(/:host/, withThis);
        const doesNotHaveScope = replaceScope(selector, '') === selector;

        if (useShadow) {
            if (doesNotHaveScope || selector.includes(' ')) {
                selector = addSuffix(selector);
            }
        } else {
            selector = replaceScope(selector, tagForScope);

            if (doesNotHaveScope) {
                selector = `${tagForScope} ${addSuffix(selector)}`;
            }
        }

        return selector;
    };

    return [...sandboxStyleRules(style)]
        .map(rule => scopeStyleRule(rule, tag))
        .join('');
};

const SELECTOR_TEXT = 'selectorText';
