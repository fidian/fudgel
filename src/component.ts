/**
 * Set up config and define a custom element.
 */
import { allControllers } from './all-controllers.js';
import { ComponentInfo, allComponents } from './all-components.js';
import {
    camelToDash,
    dashToCamel,
    getAttribute,
    hasOwn,
    setAttribute,
} from './util.js';
import {
    Controller,
    ControllerConstructor,
    ControllerMetadata,
} from './controller-types.js';
import {
    createElement,
    createTemplate,
    createTextNode,
    createTreeWalker,
    sandboxStyleRules,
    toggleClass,
} from './elements.js';
import {
    CustomElementConfig,
    CustomElementConfigInternal,
} from './custom-element-config.js';
import { hooksRun } from './hooks.js';
import { bootstrap, nextN } from './global.js';
import { metadata } from './symbols.js';
import { linkNodes } from './link-nodes.js';
import { patchSetter, removeSetters } from './setter.js';
import { whenParsed } from './when-parsed.js';

// Decorator to wire a class as a custom component
export const Component = (tag: string, config: CustomElementConfig) => (
    (target: ControllerConstructor) => component(tag, config, target)
);

export const component = (
    tag: string,
    configInitial: CustomElementConfig,
    constructor?: ControllerConstructor
): CustomElementConstructor => {
    bootstrap();
    const cssClassName = `fudgel-${nextN()}`;
    const style = scopeStyle(
        configInitial.style || '',
        tag,
        cssClassName,
        configInitial.useShadow
    );
    const config = {
        ...configInitial,
        attr: configInitial.attr || [],
        cssClassName,
        prop: configInitial.prop || [],
        style,
    } as CustomElementConfigInternal;
    const updateControllerProperty = (
        controller: Controller,
        propertyName: string,
        newValue: any
    ) => {
        const oldValue = controller[propertyName];

        if (oldValue !== newValue) {
            console.log(`setting ${propertyName} to`, newValue);
            controller[propertyName] = newValue;
            controller.onChange?.(propertyName, oldValue, newValue);
        }
    };
    constructor = constructor || class implements Controller {};
    const template = createTemplate();
    const updateClasses = (templateNode: HTMLTemplateElement) => {
        const treeWalker = createTreeWalker(templateNode.content, 0x01);
        let currentNode;

        while ((currentNode = treeWalker.nextNode())) {
            if (currentNode.nodeName === 'TEMPLATE') {
                updateClasses(currentNode as HTMLTemplateElement);
            }

            toggleClass(currentNode as HTMLElement, cssClassName, true);
        }
    };
    template.innerHTML = config.template;
    updateClasses(template);
    config.template = template.innerHTML;

    class CustomElement extends HTMLElement {
        [metadata]?: Controller;
        static observedAttributes: string[] = config.attr.map(camelToDash);

        attributeChangedCallback(
            attributeName: string,
            _oldValue: string,
            newValue: string
        ) {
            if (this[metadata]) {
                updateControllerProperty(
                    this[metadata],
                    dashToCamel(attributeName),
                    newValue
                );
            }
        }

        connectedCallback() {
            // The root is the element where our template content will be placed.
            const root = config.useShadow
                ? this.shadowRoot || this.attachShadow({ mode: 'open' })
                : this;

            // Create the controller and set up links between element and controller
            const controllerMetadata: ControllerMetadata = {
                ...config,
                host: this,
                root,
            };
            const controller = new constructor!(controllerMetadata);
            this[metadata] = controller;
            controller[metadata] = controllerMetadata;
            allControllers.add(controller);

            // Set the class on the host element. Child elements will have
            // it set through the preprocessed template string.
            toggleClass(this, cssClassName, true);

            // Set up bindings before adding child nodes
            for (const propertyName of config.attr) {
                const attributeName = camelToDash(propertyName);

                // Set initial value - updates are tracked with
                // attributeChangedCallback.
                updateControllerProperty(
                    controller,
                    propertyName,
                    getAttribute(this, attributeName)
                );

                // When the internal property changes, update the attribute but only
                // if it is a string or null.
                patchSetter(
                    controller,
                    propertyName,
                    (controller: Controller, newValue: any) => {
                        if (
                            (typeof newValue === 'string' ||
                                newValue === null) &&
                            controller[metadata]
                        ) {
                            setAttribute(this, attributeName, newValue);
                        }
                    }
                );
            }

            for (const propertyName of config.prop) {
                if (hasOwn(this, propertyName)) {
                    updateControllerProperty(
                        controller,
                        propertyName,
                        (this as any)[propertyName]
                    );
                }

                // When element changes, update controller
                patchSetter(
                    this,
                    propertyName,
                    (_thisRef: HTMLElement, newValue: any) => {
                        updateControllerProperty(
                            controller,
                            propertyName,
                            newValue
                        );
                    }
                );

                // When controller changes, update element
                patchSetter(
                    controller,
                    propertyName,
                    (_thisRef: Controller, newValue: any) => {
                        (this as any)[propertyName] = newValue;
                    }
                );

                // Assign the property back to the element in case it was
                // listed as both a property and an attribute.
                (this as any)[propertyName] = controller[propertyName];
            }

            // Initialize before adding child nodes
            controller.onInit?.();

            whenParsed(this, root, () => {
                // Verify that the controller is still bound to an element. Avoids
                // a race condition where an element is added but not "parsed"
                // immediately, then removed before this callback can fire.
                if (controller[metadata]) {
                    controller.onParse?.();

                    // Create initial child elements from the template.
                    const template = createTemplate();
                    template.innerHTML = config.template;
                    linkNodes(template.content, controller);

                    // Remove all existing content when not using a shadow DOM to simulate
                    // the same behavior shown when using a shadow DOM.
                    root.innerHTML = '';

                    // With a shadow DOM, append styling within the element.
                    // Add styling to either the parent document or the parent shadow root.
                    const styleParent = root.getRootNode() as
                        | Document
                        | ShadowRoot;

                    if (
                        config.style &&
                        !styleParent.querySelector('style.' + cssClassName)
                    ) {
                        const s = createElement('style');
                        toggleClass(s, cssClassName, true);
                        s.prepend(createTextNode(config.style));
                        ((styleParent as any).body || styleParent).prepend(s);
                    }

                    // Finally, add the processed nodes
                    root.append(template.content);
                    controller.onViewInit?.();
                }
            });
        }

        disconnectedCallback() {
            // Remove the controller from the global list
            allControllers.delete(this[metadata]!);

            // Remove setters on the element.
            // It is not necessary to remove setters on the controller because
            // all references will be lost.
            removeSetters(this);

            // Remove the controller's metadata
            delete this[metadata]?.[metadata];

            // Remove the link to the controller
            delete this[metadata];
        }
    }

    try {
        customElements.define(tag, CustomElement);
        const componentInfo: ComponentInfo = [
            CustomElement,
            constructor!,
            config,
        ];
        allComponents.add(componentInfo);
        // FIXME change hooks to events
        hooksRun('component', CustomElement, ...componentInfo);
    } catch (_) {}

    return CustomElement;
};

export const scopeStyle = (
    style: string,
    tag: string,
    className: string,
    useShadow?: boolean
) => {
    const selectorText = 'selectorText';
    const scopeStyleRule = (rule: CSSRule, tagForScope: string) => {
        if ((rule as CSSStyleRule)[selectorText]) {
            (rule as CSSStyleRule)[selectorText] = (rule as CSSStyleRule)[
                selectorText
            ]
                .split(',')
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
