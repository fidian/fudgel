import { describe, beforeEach, it } from 'vitest';
import { component } from '../../src/fudgel.js';
import { expectText, mount } from '../support/dom.js';

component('test-element', {
    template: '<div #ref="child"></div><span id="name">{{child.nodeName}}</span>',
});

describe('ref', () => {
    beforeEach(() => mount('<test-element></test-element>'));

    it('creates a reference', async () => {
        await expectText('#name', 'DIV');
    });
});
