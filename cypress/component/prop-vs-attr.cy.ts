import { component } from '../../src/fudgel.js';

// Make a simple string for easy testing
function str(value: any): string {
    if (value === undefined) {
        return 'undefined';
    }

    return JSON.stringify(value);
}

// Three components to show how attributes and properties come into a child.
component('show-value-attr', {
    attr: ['value'],
    template: '{{str(value)}}',
}, class ChildElement {
    str = str;
    value: any = 'initial';
});
component('show-value-prop', {
    prop: ['value'],
    template: '{{str(value)}}',
}, class ChildElement {
    str = str;
    value: any = 'initial';
});
component('show-value-attr-prop', {
    attr: ['value'],
    prop: ['value'],
    template: '{{str(value)}}',
}, class ChildElement {
    str = str;
    value: any = 'initial';
});

// Different ways that parents can interact with the child elements
component('parent-element', {
    template: `
        <show-value-attr></show-value-attr><br />
        <show-value-prop></show-value-prop><br />
        <show-value-attr-prop></show-value-attr-prop>
    `
});
component('parent-element-attr', {
    template: `
        <show-value-attr value="ok"></show-value-attr><br />
        <show-value-prop value="ok"></show-value-prop><br />
        <show-value-attr-prop value="ok"></show-value-attr-prop>
    `
});
component('parent-element-attr-interpolated', {
    template: `
        <show-value-attr value="{{value}}"></show-value-attr><br />
        <show-value-prop value="{{value}}"></show-value-prop><br />
        <show-value-attr-prop value="{{value}}"></show-value-attr-prop>
    `
}, class { value = 'ok' });
component('parent-element-prop', {
    template: `
        <show-value-attr .value="value"></show-value-attr><br />
        <show-value-prop .value="value"></show-value-prop><br />
        <show-value-attr-prop .value="value"></show-value-attr-prop>
    `
}, class { value = 'ok' });
component('parent-element-attr-prop-interpolated', {
    template: `
        <show-value-attr value="{{one}}" .value="two"></show-value-attr><br />
        <show-value-prop value="{{one}}" .value="two"></show-value-prop><br />
        <show-value-attr-prop value="{{one}}" .value="two"></show-value-attr-prop>
    `
}, class { one = '1'; two = '2' });

describe('prop vs attr', () => {
    it('works with no incoming values', () => {
        cy.mount('<parent-element></parent-element>');
        cy.get('show-value-attr').should('have.text', 'null');
        cy.get('show-value-prop').should('have.text', '"initial"');
        cy.get('show-value-attr-prop').should('have.text', 'null');
    });
    it('works with attr', () => {
        cy.mount('<parent-element-attr></parent-element-attr>');
        cy.get('show-value-attr').should('have.text', '"ok"');
        cy.get('show-value-prop').should('have.text', '"initial"');
        cy.get('show-value-attr-prop').should('have.text', '"ok"');
    });
    it('works with attr (interpolated)', () => {
        cy.mount('<parent-element-attr-interpolated></parent-element-attr-interpolated>');
        cy.get('show-value-attr').should('have.text', '"ok"');
        cy.get('show-value-prop').should('have.text', '"initial"');
        cy.get('show-value-attr-prop').should('have.text', '"ok"');
    });
    it('works with prop', () => {
        cy.mount('<parent-element-prop></parent-element-prop>');
        cy.get('show-value-attr').should('have.text', 'null');
        cy.get('show-value-prop').should('have.text', '"ok"');
        cy.get('show-value-attr-prop').should('have.text', '"ok"');
    });
    it('works with attr and prop (interpolated)', () => {
        cy.mount('<parent-element-attr-prop-interpolated></parent-element-attr-prop-interpolated>');
        cy.get('show-value-attr').should('have.text', '"1"');
        cy.get('show-value-prop').should('have.text', '"2"');
        cy.get('show-value-attr-prop').should('have.text', '"2"');
    });
});
