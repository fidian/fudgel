import { expect } from 'vitest';

// Fudgel applies templates in a microtask (see src/when-parsed.ts), so one
// macrotask is enough for a freshly mounted tree to reach viewInit.
export const tick = (ms = 0) =>
    new Promise<void>(resolve => setTimeout(resolve, ms));

export const mount = async (html: string) => {
    document.body.innerHTML = html;
    await tick();
};

export const $ = <T extends Element = HTMLElement>(
    selector: string,
    root: ParentNode = document
) => root.querySelector<T>(selector);

export const $$ = <T extends Element = HTMLElement>(
    selector: string,
    root: ParentNode = document
) => [...root.querySelectorAll<T>(selector)];

export const text = (selector: string, root: ParentNode = document) =>
    $(selector, root)?.textContent ?? null;

// Like cy.get(selector).click(): wait for the element, then click it. A
// route change after history.back() lands asynchronously, so the target of
// the next click may not exist yet.
export const click = async (selector: string, root: ParentNode = document) => {
    await expectExists(selector, root);
    $(selector, root)!.click();
};

// Retrying assertions, standing in for Cypress's should().
const poll = <T>(fn: () => T) => expect.poll(fn, { timeout: 3000, interval: 20 });

export const expectText = (selector: string, expected: string, root?: ParentNode) =>
    poll(() => text(selector, root)).toBe(expected);

export const expectContains = (selector: string, expected: string, root?: ParentNode) =>
    poll(() => text(selector, root)).toContain(expected);

export const expectExists = (selector: string, root?: ParentNode) =>
    poll(() => $(selector, root) !== null).toBe(true);

export const expectMissing = (selector: string, root?: ParentNode) =>
    poll(() => $(selector, root)).toBeNull();

export const expectAttr = (selector: string, name: string, expected: string | null) =>
    poll(() => $(selector)?.getAttribute(name) ?? null).toBe(expected);

export const expectCount = (selector: string, expected: number, root?: ParentNode) =>
    poll(() => $$(selector, root).length).toBe(expected);

export const expectValue = <T>(fn: () => T, expected: T) => poll(fn).toBe(expected);
