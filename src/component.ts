/**
 * Set up config and define a custom element.
 */
import { newSet } from './sets.js';
import { events } from './events.js';
import { Emitter } from './emitter.js';
import { allControllers } from './all-controllers.js';
import { lifecycle } from './lifecycle.js';
import { ComponentInfo, allComponents } from './all-components.js';
import {
    camelToDash,
    dashToCamel,
    getAttribute,
    hasOwn,
    setAttribute,
    isTemplate,
    isString,
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
import { metadata } from './symbols.js';
import { linkNodes } from './link-unlink.js';
import { patchSetter, removeSetters } from './setter.js';
import { whenParsed } from './when-parsed.js';
import { change } from './change.js';

// Decorator to wire a class as a custom component
export const Component =
    (tag: string, config: CustomElementConfig) =>
    (target: ControllerConstructor) =>
        component(tag, config, target);

export const component = (
    tag: string,
    configInitial: CustomElementConfig,
    constructor?: ControllerConstructor
): CustomElementConstructor => {
    const cssClassName = `fudgel_${tag}`;
    const style = scopeStyle(
        configInitial.style || '',
        tag,
        cssClassName,
        configInitial.useShadow
    );
    constructor = constructor || class implements Controller {};
    const template = createTemplate();
    const updateClasses = (templateNode: HTMLTemplateElement) => {
        const treeWalker = createTreeWalker(templateNode.content, 0x01);
        let currentNode;

        while ((currentNode = treeWalker.nextNode())) {
            if (isTemplate(currentNode)) {
                updateClasses(currentNode as HTMLTemplateElement);
            }

            toggleClass(currentNode as HTMLElement, cssClassName, true);
        }
    };
    template.innerHTML = configInitial.template;
    updateClasses(template);
    const config = {
        ...configInitial,
        attr: newSet(configInitial.attr || []),
        cssClassName,
        prop: newSet(configInitial.prop || []),
        style,
        tag,
        template: template.innerHTML,
    } as CustomElementConfigInternal;

    class CustomElement extends HTMLElement {
        [metadata]?: Controller;
        static observedAttributes: string[] = [...config.attr].map(camelToDash);

        attributeChangedCallback(
            attributeName: string,
            _oldValue: string,
            newValue: string
        ) {
            change(this[metadata], dashToCamel(attributeName), newValue);
        }

        connectedCallback() {
            // The root is the element where our template content will be placed.
            const root = config.useShadow
                ? this.shadowRoot || this.attachShadow({ mode: 'open' })
                : this;

            // Create the controller and set up links between element and controller
            const controllerMetadata: ControllerMetadata = {
                ...config,
                events: new Emitter<string>(),
                host: this,
                root,
                tagName: tag,
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
                change(
                    controller,
                    propertyName,
                    getAttribute(this, attributeName)
                );

                // When the internal property changes, update the attribute but only
                // if it is a string or null.
                patchSetter(controller, propertyName, (newValue: any) => {
                    if (
                        (isString(newValue) || newValue === null) &&
                        controller[metadata]
                    ) {
                        setAttribute(this, attributeName, newValue);
                    }
                });
            }

            for (const propertyName of config.prop) {
                if (hasOwn(this, propertyName)) {
                    change(
                        controller,
                        propertyName,
                        (this as any)[propertyName]
                    );
                }

                // When element changes, update controller
                patchSetter(this, propertyName, (newValue: any) =>
                    change(controller, propertyName, newValue)
                );

                // When controller changes, update element
                patchSetter(
                    controller,
                    propertyName,
                    (newValue: any) => ((this as any)[propertyName] = newValue)
                );

                // Assign the property back to the element in case it was
                // listed as both a property and an attribute.
                (this as any)[propertyName] = controller[propertyName];
            }

            // Initialize before adding child nodes
            lifecycle(controller, 'init');

            whenParsed(this, root, (wasAsync) => {
                // Verify that the controller is still bound to an element. Avoids
                // a race condition where an element is added but not "parsed"
                // immediately, then removed before this callback can fire.
                if (controller[metadata]) {
                    lifecycle(controller, 'parse', wasAsync);

                    // Create initial child elements from the template. This creates them
                    // and adds them to the DOM, so do not use `link()`.
                    const template = createTemplate();
                    template.innerHTML = config.template;
                    linkNodes(controller, template.content);

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
                    lifecycle(controller, 'viewInit', wasAsync);
                }
            });
        }

        disconnectedCallback() {
            const controller = this[metadata]!;
            lifecycle(controller, 'destroy');

            // Remove the controller from the global list
            allControllers.delete(controller);

            // Remove setters on the element.
            // It is not necessary to remove setters on the controller because
            // all references will be lost.
            removeSetters(this);

            // Remove the controller's metadata
            delete controller[metadata];

            // Remove the link to the controller
            delete this[metadata];
        }
    }

    try {
        const componentInfo: ComponentInfo = [
            CustomElement,
            constructor!,
            config,
        ];
        events.emit('component', ...componentInfo);
        customElements.define(tag, CustomElement); // throws
        allComponents.add(componentInfo);
    } catch (_ignore) {}

    return CustomElement;
};

const scopeStyleRule = (
    rule: CSSRule,
    tagForScope: string,
    className: string,
    useShadow?: boolean
) => {
    if ((rule as CSSStyleRule).selectorText) {
        (rule as CSSStyleRule).selectorText = (
            rule as CSSStyleRule
        ).selectorText
            .split(',')
            .map((selector: string) => {
                selector = selector.trim();
                const addSuffix = (x: string) => `${x}.${className}`;
                const replaceScope = (x: string, withThis: string) =>
                    x.replace(/:host/, withThis);
                const doesNotHaveScope = replaceScope(selector, '') == selector;

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
            })
            .join(',');
        tagForScope = ''; // Don't need to scope children selectors
    }

    for (const childRule of (rule as CSSGroupingRule).cssRules ?? []) {
        scopeStyleRule(childRule, tagForScope, className, useShadow);
    }

    return rule.cssText;
};

// Exported for easier testing
export const scopeStyle = (
    style: string,
    tag: string,
    className: string,
    useShadow?: boolean
) =>
    [...sandboxStyleRules(style)]
        .map(rule => scopeStyleRule(rule, tag, className, useShadow))
        .join('');
