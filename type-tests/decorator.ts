/**
 * Compile-time checks for the `@Component` decorator.
 *
 * TypeScript lets a class decorator return the class it decorated, or nothing
 * at all. It may not return something else, and `component()` returns the
 * custom element it defined -- a different class from the controller. Handing
 * that back would rebind the name to the wrong type.
 *
 * Nothing here runs. It fails the build instead, which is the point.
 */
import { Component, component, html } from '../src/fudgel.js';

@Component('type-test-element', {
    template: html`<span>{{value}}</span>`,
})
class TypeTestController {
    static origin = 'controller';
    value = 'ok';

    describe(): string {
        return this.value;
    }
}

// The name still refers to the controller: its statics, its instance type and
// its methods all survive the decorator.
export const origin: string = TypeTestController.origin;
export const instance: TypeTestController = new TypeTestController();
export const described: string = instance.describe();

// Calling `component()` directly still hands back the custom element, which is
// what the decorator must not substitute for the class it decorated.
export const defined: CustomElementConstructor = component(
    'type-test-defined',
    { template: '' }
);
