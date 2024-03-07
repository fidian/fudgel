import { component, metadataControllerElement } from '../../src/fudgel.js';

component('link-child', {
    template: 'value:"{{this.childValue}}"'
}, class {
    childValue = 'initialized';
    onViewInit() {
        const template = metadataControllerElement.get(this)!.querySelector('template');
        this.childValue = template.innerHTML;
    }
});

component('link-parent', {
    template: '<link-child><template>{{this.parentValue}}</template></link-child>'
}, class {
    parentValue = 'ok';
});

describe('Template linking', () => {
    it('replaces placeholders in templates in parent elements using parent element data', () => {
        cy.mount('<link-parent></link-parent>');
        cy.get('link-child').should('have.text', 'value:"ok"');
    });
});
