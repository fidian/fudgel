// The SSI apps compile with useDefineForClassFields: true, which installs
// class fields with [[Define]] semantics after Fudgel has seen the instance.
// test/tsconfig.json uses the same setting, so this file proves a field
// declared without an initializer, and one with a default, both bind.
import { describe, it } from 'vitest';
import { Component } from '../../src/fudgel.js';
import { click, expectText, mount } from '../support/dom.js';

@Component('define-fields', {
    attr: ['label'],
    template: '<span id="label">{{label}}</span><span id="count">{{count}}</span><button @click="bump()">+</button>',
})
class DefineFields {
    count = 1;
    label!: string;

    bump() {
        this.count += 1;
    }
}

describe('class fields with [[Define]] semantics', () => {
    it('binds an uninitialized field that arrives as an attribute', async () => {
        await mount('<define-fields label="from attribute"></define-fields>');
        await expectText('#label', 'from attribute');
    });

    it('binds a field with an initializer and tracks its changes', async () => {
        await mount('<define-fields></define-fields>');
        await expectText('#count', '1');
        await click('button');
        await expectText('#count', '2');
    });
});
