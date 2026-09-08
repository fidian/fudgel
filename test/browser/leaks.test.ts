// Content that *if and *for create is also destroyed, and everything the
// bindings and event directives attached must go with it.
import { describe, expect, it } from 'vitest';
import { component, html, metadata } from '../../src/fudgel.js';
import { $, expectMissing, expectText, mount, tick } from '../support/dom.js';

component(
    'leaky-if',
    { template: html`<div *if="flag"><span id="inner">{{ read(flag) }}</span></div>` },
    class {
        flag = true;
        reads = 0;

        read(value: boolean) {
            this.reads += 1;
            return value;
        }
    }
);

component(
    'outside-host',
    {
        template: html`
            <div *if="shown" id="box" @click.outside="hit()">box</div>
            <div *if="shown" @resize.window="resized()">listens to resize</div>
        `,
    },
    class {
        hits = 0;
        resizes = 0;
        shown = true;

        hit() {
            this.hits += 1;
        }

        resized() {
            this.resizes += 1;
        }
    }
);

describe('bindings inside *if', () => {
    it('stop being evaluated once their content is removed', async () => {
        await mount('<leaky-if></leaky-if>');
        await expectText('#inner', 'true');
        const controller = $('leaky-if')![metadata];
        expect(controller.reads).toBe(1);

        // Ten toggles: the content is rebuilt five times, and each build
        // evaluates its one binding once. Stale callbacks from earlier
        // builds would make this grow with the square of the toggles.
        for (let i = 0; i < 10; i += 1) {
            controller.flag = !controller.flag;
            await tick();
        }

        await expectText('#inner', 'true');
        expect(controller.reads).toBe(6);
    });
});

describe('event directives on window and document', () => {
    it('are removed with the element that declared them', async () => {
        await mount('<outside-host></outside-host>');
        const controller = $('outside-host')![metadata];

        document.body.click();
        window.dispatchEvent(new Event('resize'));
        await tick();
        expect(controller.hits).toBe(1);
        expect(controller.resizes).toBe(1);

        controller.shown = false;
        await expectMissing('#box');

        document.body.click();
        window.dispatchEvent(new Event('resize'));
        await tick();
        expect(controller.hits).toBe(1);
        expect(controller.resizes).toBe(1);

        // Showing it again attaches exactly one listener each, not one more
        // on top of the old ones.
        controller.shown = true;
        await expectText('#box', 'box');
        document.body.click();
        window.dispatchEvent(new Event('resize'));
        await tick();
        expect(controller.hits).toBe(2);
        expect(controller.resizes).toBe(2);
    });
});
