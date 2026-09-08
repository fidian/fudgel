import { describe, expect, it } from 'vitest';
import { Component, html } from '../../src/fudgel.js';
import { expectText, mount } from '../support/dom.js';

@Component('decorated-element', {
    template: html`<span id="value">{{value}}</span>`,
})
class DecoratedController {
    static origin = 'controller';
    value = 'from the controller';

    describe() {
        return this.value;
    }
}

describe('the Component decorator', () => {
    it('defines a working custom element', async () => {
        await mount('<decorated-element></decorated-element>');
        await expectText('#value', 'from the controller');
    });

    it('leaves the decorated name bound to the controller', () => {
        // component() returns the custom element it defined, which is a
        // different class. A decorator returning that would rebind the name to
        // the wrong thing, and TypeScript rejects it outright -- see
        // type-tests/decorator.ts.
        expect(DecoratedController.origin).toBe('controller');
        expect(new DecoratedController().describe()).toBe('from the controller');
    });

    it('does not replace the controller with the custom element', () => {
        const element = customElements.get('decorated-element');

        expect(element).not.toBe(DecoratedController);
        expect(new DecoratedController()).not.toBeInstanceOf(HTMLElement);
    });
});
