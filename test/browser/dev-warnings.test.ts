import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../src/dev.js';
import { component, defineRouterComponent, html } from '../../src/fudgel.js';
import { expectText, mount, tick } from '../support/dom.js';

defineRouterComponent('dev-router');

component('dev-child', { attr: ['parentSection'], prop: ['isSaveable'], template: 'child' });

let warnings: string[];

beforeEach(() => {
    warnings = [];
    vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
        warnings.push(args.join(' '));
    });
});

afterEach(() => {
    vi.restoreAllMocks();
});

const warningAbout = (text: string) => warnings.find(w => w.includes(text));

describe('fudgel/dev', () => {
    it('points out a lifecycle hook that is nearly spelled right', () => {
        component(
            'dev-misspelled-hook',
            { template: '' },
            class {
                onViewInitt() {}
                onDestory() {}
                onSave() {}
            }
        );
        expect(warningAbout('onViewInitt()')).toContain('Did you mean onViewInit()?');
        expect(warningAbout('onDestory()')).toContain('Did you mean onDestroy()?');
        expect(warningAbout('onSave')).toBeUndefined();
    });

    it('points out a <slot> that cannot project in the light DOM', async () => {
        component('dev-light-slot', { template: '<slot></slot>' });
        await mount('<dev-light-slot>content</dev-light-slot>');
        expect(warningAbout('<dev-light-slot> uses <slot>')).toContain('defineSlotComponent()');
    });

    it('points out a property or attribute name that HTML lowercased', async () => {
        component('dev-lowercased', {
            template: html`<dev-child .isSaveable="true" parentSection="x"></dev-child>`,
        });
        await mount('<dev-lowercased></dev-lowercased>');
        expect(warningAbout('.issaveable on <dev-child>')).toContain('Write .is-saveable');
        expect(warningAbout('parentsection on <dev-child>')).toContain('Write parent-section');
    });

    it('points out an identifier that resolves to nothing', async () => {
        component(
            'dev-typo',
            { template: '{{ nmae }} {{ name }} {{ Math.max(1, 2) }}' },
            class {
                name = 'ok';
            }
        );
        await mount('<dev-typo></dev-typo>');
        expect(warningAbout('"nmae"')).toContain('undefined');
        expect(warningAbout('"name"')).toBeUndefined();
        expect(warningAbout('"Math"')).toBeUndefined();
    });

    it('points out *for written with "in"', async () => {
        component(
            'dev-for-in',
            { template: '<i *for="x in list">{{x}}</i>' },
            class {
                list = [1];
            }
        );
        await mount('<dev-for-in></dev-for-in>');
        expect(warningAbout('*for="x in list"')).toContain('"of"');
    });

    it('points out a route shadowed by an earlier, shorter one', async () => {
        component('dev-shadowed-routes', {
            template: html`
                <dev-router>
                    <div path="/config"></div>
                    <div path="/config/pay-policy"></div>
                    <div path="/other"></div>
                </dev-router>
            `,
        });
        await mount('<dev-shadowed-routes></dev-shadowed-routes>');
        expect(warningAbout('"/config/pay-policy" can never match')).toContain('"/config" comes before it');
        expect(warningAbout('"/other"')).toBeUndefined();
    });

    it('stays quiet for correct code', async () => {
        component(
            'dev-correct',
            {
                template: html`
                    <dev-child .is-saveable="true" parent-section="x"></dev-child>
                    <i *for="x of list">{{ x }}</i>
                    <span>{{ name }}</span>
                    <dev-router>
                        <div path="/config/pay-policy"></div>
                        <div path="/config"></div>
                        <div path="**"></div>
                    </dev-router>
                `,
            },
            class {
                list = [1];
                name = 'ok';

                onInit() {}
                onSave() {}
            }
        );
        await mount('<dev-correct></dev-correct>');
        await expectText('span', 'ok');
        await tick();
        expect(warnings).toEqual([]);
    });
});
