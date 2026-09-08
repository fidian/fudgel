// Lifecycle order during a real page load. Each case is a static page under
// docs/e2e/ that logs every constructor and lifecycle hook into #events;
// what matters is how classic <script> tags interleave with the HTML parser,
// so the pages are loaded in an iframe exactly as written (see the
// serve-docs-e2e plugin in vitest.config.ts).
import { describe, expect, it } from 'vitest';

const loadPage = (url: string) =>
    new Promise<Document>((resolve, reject) => {
        document.body.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width: 800px; height: 600px';
        iframe.onload = () => resolve(iframe.contentDocument!);
        iframe.onerror = reject;
        iframe.src = url;
        document.body.append(iframe);
    });

const events = (doc: Document) => doc.getElementById('events')?.textContent;
const poll = <T>(fn: () => T) => expect.poll(fn, { timeout: 4000, interval: 25 });

describe('Event order is correct', () => {
    const tests = [
        {
            // Content is ready immediately.
            name: 'Child-only, async',
            url: '/e2e/event-child-slot-async.html',
            events: [
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse',
                'TestChildSlot [test-child-slot-async] onViewInit',
                'TestChildSlot [test-child-slot-async] onDestroy',
            ],
        },
        {
            // Content is ready immediately.
            name: 'Child-only, sync',
            url: '/e2e/event-child-slot-sync.html',
            events: [
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-sync] onInit',
                'TestChildSlot [test-child-slot-sync] onParse',
                'TestChildSlot [test-child-slot-sync] onViewInit',
                'TestChildSlot [test-child-slot-sync] onDestroy',
            ],
        },
        {
            // Async loading will throw all of the content in at once, so the
            // parent will see the content earlier and the mutation observer is
            // not used.
            name: 'Parent, async',
            url: '/e2e/event-parent-async.html',
            events: [
                'TestParent [undefined] constructor',
                'TestParent [test-parent-async] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestParent [test-parent-async] onParse',
                'Parent sees content',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParent [test-parent-async] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestParent [test-parent-async] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
        {
            // The parent's onViewInit happens after the child is loaded. This
            // is triggered by a mutation observer in `whenParsed()`. It is
            // important that the parent sees all content before `onParse()`
            // is called.
            name: 'Parent, sync',
            url: '/e2e/event-parent-sync.html',
            events: [
                'TestParent [undefined] constructor',
                'TestParent [test-parent-sync] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse',
                'TestChildSlot [test-child-slot] onViewInit',
                'TestParent [test-parent-sync] onParse',
                'Parent sees content',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParent [test-parent-sync] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestParent [test-parent-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
        {
            // There will be two TestChildSlot elements. The one
            // "from-template" contains "test-child-slot" through content
            // projection and <slot>.
            name: 'Parent, slot, async',
            url: '/e2e/event-parent-slot-async.html',
            events: [
                'TestParentSlot [undefined] constructor',
                'TestParentSlot [test-parent-slot-async] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestParentSlot [test-parent-slot-async] onParse',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParentSlot [test-parent-slot-async] onViewInit',
                'TestChildSlot [test-child-slot-async] onParse',
                'TestChildSlot [test-child-slot-async] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestParentSlot [test-parent-slot-async] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot-async] onDestroy',
            ],
        },
        {
            // There will be two TestChildSlot elements. The one
            // "from-template" contains "test-child-slot" through content
            // projection and <slot>.
            name: 'Parent, slot, sync',
            url: '/e2e/event-parent-slot-sync.html',
            events: [
                'TestParentSlot [undefined] constructor',
                'TestParentSlot [test-parent-slot-sync] onInit',
                'TestParentSlot [test-parent-slot-sync] onParse',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParentSlot [test-parent-slot-sync] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse',
                'TestChildSlot [test-child-slot] onViewInit',
                'TestParentSlot [test-parent-slot-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
            ],
        },
        {
            // The first TestChildSlot will be created because of the light DOM
            // emulation of the slot element. It's destroyed, then the
            // template's TestChildSlot is created. Finally, the content will
            // be "projected" through <slot-like> and create another
            // TestChildSlot.
            //
            // * onDestroy calls go from top to bottom.
            name: 'Parent, slot-like, async',
            url: '/e2e/event-parent-slot-like-async.html',
            events: [
                'TestParentSlotLike [undefined] constructor',
                'TestParentSlotLike [test-parent-slot-like-async] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestParentSlotLike [test-parent-slot-like-async] onParse',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestParentSlotLike [test-parent-slot-like-async] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestChildSlot [test-child-slot-async] onParse',
                'TestChildSlot [test-child-slot-async] onViewInit',
                'TestParentSlotLike [test-parent-slot-like-async] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot-async] onDestroy',
            ],
        },
        {
            // The first TestChildSlot will be created because of the light DOM
            // emulation of the slot element. It's destroyed, then the
            // template's TestChildSlot is created. Finally, the content will
            // be "projected" through <slot-like> and create another
            // TestChildSlot.
            //
            // * onDestroy calls go from top to bottom.
            name: 'Parent, slot-like, sync',
            url: '/e2e/event-parent-slot-like-sync.html',
            events: [
                'TestParentSlotLike [undefined] constructor',
                'TestParentSlotLike [test-parent-slot-like-sync] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse',
                'TestChildSlot [test-child-slot] onViewInit',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestParentSlotLike [test-parent-slot-like-sync] onParse',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestParentSlotLike [test-parent-slot-like-sync] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestChildSlot [test-child-slot] onParse',
                'TestChildSlot [test-child-slot] onViewInit',
                'TestParentSlotLike [test-parent-slot-like-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
            ],
        },
        {
            // The important parts to check:
            // * Grandparent sees content
            // * onDestroy calls are from grandparent to parent to child
            name: 'Grandparent, async',
            url: '/e2e/event-grandparent-async.html',
            events: [
                'TestGrandparent [undefined] constructor',
                'TestGrandparent [test-grandparent-async] onInit',
                'TestParent [undefined] constructor',
                'TestParent [test-parent-async] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestGrandparent [test-grandparent-async] onParse',
                'Grandparent sees content',
                'TestParent [test-parent-async] onDestroy',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestParent [undefined] constructor',
                'TestParent [from-template] onInit',
                'TestGrandparent [test-grandparent-async] onViewInit',
                'TestParent [from-template] onParse',
                'Parent does NOT see content',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParent [from-template] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestGrandparent [test-grandparent-async] onDestroy',
                'TestParent [from-template] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
        {
            // The important parts to check:
            // * Grandparent sees content
            // * onDestroy calls are from grandparent to parent to child
            name: 'Grandparent, sync',
            url: '/e2e/event-grandparent-sync.html',
            events: [
                'TestGrandparent [undefined] constructor',
                'TestGrandparent [test-grandparent-sync] onInit',
                'TestParent [undefined] constructor',
                'TestParent [test-parent-sync] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse',
                'TestChildSlot [test-child-slot] onViewInit',
                'TestGrandparent [test-grandparent-sync] onParse',
                'Grandparent sees content',
                'TestParent [test-parent-sync] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestParent [undefined] constructor',
                'TestParent [from-template] onInit',
                'TestGrandparent [test-grandparent-sync] onViewInit',
                'TestParent [from-template] onParse',
                'Parent does NOT see content',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestParent [from-template] onViewInit',
                'TestChildSlot [from-template] onParse',
                'TestChildSlot [from-template] onViewInit',
                'TestGrandparent [test-grandparent-sync] onDestroy',
                'TestParent [from-template] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
    ];

    for (const test of tests) {
        it(test.name, async () => {
            const doc = await loadPage(test.url);
            await poll(() => events(doc)).toBe(test.events.join('\n') + '\n');
        });
    }

    it('handles onChange events', async () => {
        const doc = await loadPage('/e2e/event-parent-onchange.html');
        const text = (id: string) => doc.getElementById(id)?.textContent;
        await poll(() => text('childA')).toBe('0');
        await poll(() => text('childP')).toBe('5');
        doc.getElementById('updateA')!.click();
        doc.getElementById('updateP')!.click();
        await poll(() => text('childA')).toBe('1');
        await poll(() => text('childP')).toBe('6');
        await poll(() => text('events')).toBe(
            `TestParentOnchange [undefined] constructor
TestParentOnchange [parent-onchange] onInit
TestParentOnchange [parent-onchange] onParse
TestChildOnchange [undefined] constructor
TestChildOnchange [child-onchange] onChange a
TestChildOnchange [child-onchange] onChange p
TestChildOnchange [child-onchange] onInit
TestParentOnchange [parent-onchange] onViewInit
TestChildOnchange [child-onchange] onParse
TestChildOnchange [child-onchange] onViewInit
TestChildOnchange [child-onchange] onChange a
TestChildOnchange [child-onchange] onChange p
`
        );
    });
});
