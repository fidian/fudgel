import { component, controllerToElement } from '../../src/fudgel.js';

component('link-child', {
    template: 'value:"{{childValue}}"'
}, class {
    childValue = 'initialized';
    template: HTMLTemplateElement;
    onInit() {
        this.template = controllerToElement(this)!.querySelector('template');
    }
    onViewInit() {
        this.childValue = this.template.innerHTML;
    }
});

component('link-parent', {
    template: '<link-child><template>{{parentValue}}</template></link-child>'
}, class {
    parentValue = 'ok';
});

describe('Template linking', () => {
    it('replaces placeholders in templates in parent elements using parent element data', () => {
        cy.mount('<link-parent></link-parent>');
        cy.get('link-child').should('have.text', 'value:"ok"');
    });
});
