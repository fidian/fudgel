import { Component, metadataControllerElement } from '../../src/fudgel.js';

const date = new Date();

@Component('custom-element', {
    template: '<span id="test">^{{output}}$</span>'
})
class CustomElement {
    array = [ 1, "test" ];
    date = date;
    emptyString = '';
    false = false;
    null = null;
    number = 1;
    object = {
        testObject: true
    };
    output: any = 'This was not changed during the constructor';
    string = 'a string';
    stringWithSpaces = ' space before and after ';
    stringWithTabs = '\ttab before and after\t';
    true = true;
    undefined = undefined;
    zero = 0;

    onInit() {
        const desired = metadataControllerElement.get(this)!.attributes.getNamedItem('property').value;
        this.output = this[desired];
    }
}

describe('stringification', () => {
    const scenarios = {
        array: '^1,test$',
        date: `^${date.toString()}$`,
        emptyString: '^$',
        false: '^false$',
        null: '^$',
        number: '^1$',
        object: '^[object Object]$',
        string: '^a string$',
        stringWithSpaces: '^ space before and after $',
        stringWithTabs: '^\ttab before and after\t$',
        true: '^true$',
        undefined: '^$',
        zero: '^0$',
    };

    for (const [property, expected] of Object.entries(scenarios)) {
        it(`works with ${property}`, () => {
            cy.mount(`<custom-element property="${property}"></custom-element>`);
            cy.get('#test').should('have.text', expected);
        });
    }
});
