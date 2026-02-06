describe('Event order is correct', () => {
    const tests = [
        {
            // Content is ready immediately.
            name: 'Child-only, async',
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
            // only: true,
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
        const testMethod = 'only' in test ? it.only : it;
        testMethod(test.name, () => {
            cy.visit(test.url);
            cy.get('#events').should(
                'have.text',
                test.events.join('\n') + '\n'
            );
        });
    }

    it('handles onChange events', () => {
        cy.visit('/e2e/event-parent-onchange.html');
        cy.get('#childA').should('have.text', '0');
        cy.get('#childP').should('have.text', '5');
        cy.get('#updateA').click();
        cy.get('#updateP').click();
        cy.get('#childA').should('have.text', '1');
        cy.get('#childP').should('have.text', '6');
        cy.get('#events').should(
            'have.text',
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
