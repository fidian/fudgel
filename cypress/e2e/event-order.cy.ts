// import { component, Controller, emit, html, metadata } from '../../src/fudgel.js';
//
// const events = [];
// const trigger = (obj: Controller, event: string) => {
//     const className = obj.constructor.name;
//     const message = `${className} ${event}`;
//     events.push(message);
//     console.log(message);
// };
//
// class LogEvents {
//     constructor() {
//         trigger(this, 'constructor');
//     }
//     onInit() {
//         trigger(this, 'onInit');
//     }
//     onViewInit() {
//         trigger(this, 'onViewInit');
//     }
//     onChange(propName: string) {
//         trigger(this, `onChange ${propName}`);
//     }
//     onDestroy() {
//         trigger(this, 'onDestroy');
//     }
// }
//
// component(
//     'test-parent',
//     {
//         template: '<test-child></test-child>',
//     },
//     class TestParent extends LogEvents {}
// );
// component(
//     'test-parent-shadow-slot',
//     {
//         template: `<slot></slot>`,
//         useShadow: true,
//     },
//     class TestParent extends LogEvents {}
// );
// component(
//     'test-child',
//     {
//         template: '{{state}}',
//     },
//     class TestChild extends LogEvents {
//         state = 'starting';
//
//         onInit() {
//             super.onInit();
//
//             // This should not trigger onChange
//             this.state = 'working';
//
//             // Triggers onChange after onInit
//             setTimeout(() => (this.state = 'ready'));
//         }
//     }
// );
// component(
//     'test-parent-shadow',
//     {
//         template: '<test-child-shadow></test-child-shadow>',
//         useShadow: true,
//     },
//     class TestParentShadow extends LogEvents {}
// );
// component(
//     'test-child-shadow',
//     {
//         template: '{{state}}',
//         useShadow: true,
//     },
//     class TestChildShadow extends LogEvents {
//         state = 'starting';
//
//         onInit() {
//             super.onInit();
//
//             // This should not trigger onChange
//             this.state = 'working';
//
//             // Triggers onChange after onInit
//             setTimeout(() => (this.state = 'ready'));
//         }
//     }
// );
// component(
//     'test-parent-onchange',
//     {
//         template: `
//             Parent A: <span id="parentA">{{a}}</span><br />
//             Parent P: <span id="parentP">{{p}}</span><br />
//             <test-child-onchange a="{{a}}" .p="p">
//             </test-child-onchange>
//             <button id="updateA" @click="updateA()">Update A</button><br />
//             <button id="updateP" @click="updateP()">Update P</button><br />
//         `,
//     },
//     class TestParentOnchange extends LogEvents {
//         a = 0;
//         p = 5;
//         updateA() {
//             this.a++;
//         }
//         updateP() {
//             this.p++;
//         }
//     }
// );
// component(
//     'test-child-onchange',
//     {
//         attr: ['a'],
//         prop: ['p'],
//         template: `
//             Child A: <span id="childA">{{a}}</span><br />
//             Child P: <span id="childP">{{p}}</span><br />
//         `,
//     },
//     class TestChildOnchange extends LogEvents {}
// );
//
// describe('with light dom', () => {
//     it('is in the correct order', () => {
//         cy.log('Starting test run');
//         events.length = 0;
//         cy.mount('<test-parent></test-parent>');
//         cy.get('test-child')
//             .should('have.text', 'ready')
//             .then(() => {
//                 console.groupCollapsed('Events after test ran');
//                 for (const event of events) {
//                     console.log(event);
//                 }
//                 console.groupEnd();
//                 expect(events).to.deep.equal([
//                     'TestParent constructor',
//                     'TestParent onInit',
//                     'TestChild constructor',
//                     'TestChild onInit',
//                     'TestChild onViewInit',
//                     'TestParent onViewInit',
//                 ]);
//             });
//     });
//
//     it.only('is in the correct order when there is a lot of content', () => {
//         cy.log('Starting test run');
//         events.length = 0;
//         const content = '<div><span><b></b></span></div>'.repeat(10000);
//         cy.mount(`
//             ${content}
//             <test-parent>
//             ${content}
//             </test-parent>
//             ${content}
//         `);
//         cy.get('test-child')
//             .should('have.text', 'ready')
//             .then(() => {
//                 console.groupCollapsed('Events after test ran');
//                 for (const event of events) {
//                     console.log(event);
//                 }
//                 console.groupEnd();
//                 expect(events).to.deep.equal([
//                     'TestParent constructor',
//                     'TestParent onInit',
//                     'TestChild constructor',
//                     'TestChild onInit',
//                     'TestChild onViewInit',
//                     'TestParent onViewInit',
//                 ]);
//             });
//     });
//
//     it('is in the correct order when using slots', () => {
//         console.clear();
//         cy.log('Starting test run');
//         events.length = 0;
//         cy.mount('<test-parent-shadow-slot><test-child></test-child></test-parent-shadow-slot>');
//         cy.get('test-child')
//             .should('have.text', 'ready')
//             .then(() => {
//                 console.groupCollapsed('Events after test ran');
//                 for (const event of events) {
//                     console.log(event);
//                 }
//                 console.groupEnd();
//                 expect(events).to.deep.equal([
//                     'TestParent constructor',
//                     'TestParent onInit',
//                     'TestParent onViewInit', // Parent view initializes first in this case
//                     'TestChild constructor',
//                     'TestChild onInit',
//                     'TestChild onViewInit',
//                 ]);
//             });
//     });
//
//     it('triggers only one onChange when attr and prop changes', () => {
//         cy.log('Starting test run');
//         events.length = 0;
//         cy.mount('<test-parent-onchange></test-parent-onchange>');
//         cy.get('#childA').should('have.text', '0');
//         cy.get('#childP').should('have.text', '5');
//         cy.get('#updateA').click();
//         cy.get('#updateP').click();
//         cy.get('#childA').should('have.text', '1');
//         cy.get('#childP').should('have.text', '6');
//         cy.get('test-child-onchange').then(() => {
//             console.groupCollapsed('Events after test ran');
//             for (const event of events) {
//                 console.log(event);
//             }
//             console.groupEnd();
//             expect(events).to.deep.equal([
//                 'TestParentOnchange constructor',
//                 'TestParentOnchange onInit',
//                 'TestChildOnchange constructor',
//                 'TestChildOnchange onChange a',
//                 'TestChildOnchange onChange p',
//                 'TestChildOnchange onInit',
//                 'TestChildOnchange onViewInit',
//                 'TestParentOnchange onViewInit',
//                 'TestChildOnchange onChange a',
//                 'TestChildOnchange onChange p',
//             ]);
//         });
//     });
// });
//
// describe('with shadow DOM', () => {
//     beforeEach(() => {
//         console.log('Starting test run');
//         events.length = 0;
//         cy.mount('<test-parent-shadow></test-parent-shadow>');
//     });
//
//     it('is in the correct order', () => {
//         cy.get('test-child-shadow')
//             .shadow()
//             .should('have.text', 'ready')
//             .then(() => {
//                 console.groupCollapsed('Events after test ran');
//                 for (const event of events) {
//                     console.log(event);
//                 }
//                 console.groupEnd();
//                 expect(events).to.deep.equal([
//                     // Create the parent
//                     'TestParentShadow constructor',
//                     'TestParentShadow onInit',
//                     'TestChildShadow constructor',
//                     'TestChildShadow onInit',
//                     'TestChildShadow onViewInit',
//                     'TestParentShadow onViewInit',
//                 ]);
//             });
//     });
// });
describe('Event order is correct', () => {
    const tests = [
        {
            // onParse and onViewInit are called sync here because content was
            // ready immediately.
            name: 'Child-only, async',
            // only: true,
            url: '/e2e/event-child-slot-async.html',
            events: [
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
                'TestChildSlot [test-child-slot-async] onDestroy',
            ],
        },
        {
            // onParse and onViewInit are called sync here because content was
            // ready immediately.
            name: 'Child-only, sync',
            // only: true,
            url: '/e2e/event-child-slot-sync.html',
            events: [
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-sync] onInit',
                'TestChildSlot [test-child-slot-sync] onParse sync',
                'TestChildSlot [test-child-slot-sync] onViewInit sync',
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
                'TestParent [test-parent-async] onParse sync',
                'Parent sees content',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParent [test-parent-async] onViewInit sync',
                'TestParent [test-parent-async] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
        {
            // The parent's onViewInit happens after the child is loaded. This
            // is triggered by a mutation observer in `whenParsed()`. It is
            // important that the parent sees the content before `onParse()`
            // is called.
            //
            // Only the parent's onParse and onViewInit need to be async.
            name: 'Parent, sync',
            // only: true,
            url: '/e2e/event-parent-sync.html',
            events: [
                'TestParent [undefined] constructor',
                'TestParent [test-parent-sync] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse sync',
                'TestChildSlot [test-child-slot] onViewInit sync',
                'TestParent [test-parent-sync] onParse async',
                'Parent sees content',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParent [test-parent-sync] onViewInit async',
                'TestParent [test-parent-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ]
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
                'TestParentSlot [test-parent-slot-async] onParse sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParentSlot [test-parent-slot-async] onViewInit sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
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
                'TestParentSlot [test-parent-slot-sync] onParse sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParentSlot [test-parent-slot-sync] onViewInit sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse sync',
                'TestChildSlot [test-child-slot] onViewInit sync',
                'TestParentSlot [test-parent-slot-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
            ]
        },
        {
            // The first TestChildSlot will be created because of the light DOM
            // emulation of the slot element. It's destroyed, then the
            // template's TestChildSlot is created. Finally, the content will
            // be "projected" through <slot-like> and create another
            // TestChildSlot.
            //
            // * onViewInit from the disposed child is first, then
            //   "from-template", then "test-child-slot-async" and finally the
            //   parent. It's out of order because "from-template" uses a real
            //   slot and the content projection of <slot-like>.
            // * onDestroy calls go from top to bottom.
            name: 'Parent, slot-like, async',
            // only: true,
            url: '/e2e/event-parent-slot-like-async.html',
            events: [
                'TestParentSlotLike [undefined] constructor',
                'TestParentSlotLike [test-parent-slot-like-async] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestParentSlotLike [test-parent-slot-like-async] onParse sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
                'TestParentSlotLike [test-parent-slot-like-async] onViewInit sync',
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
            // * onViewInit from the disposed child is first, then
            //   "from-template", then "test-child-slot-async" and finally the
            //   parent. It's out of order because "from-template" uses a real
            //   slot and the content projection of <slot-like>.
            // * onDestroy calls go from top to bottom.
            name: 'Parent, slot-like, sync',
            // only: true,
            url: '/e2e/event-parent-slot-like-sync.html',
            events: [
                'TestParentSlotLike [undefined] constructor',
                'TestParentSlotLike [test-parent-slot-like-sync] onInit',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse sync',
                'TestChildSlot [test-child-slot] onViewInit sync',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestParentSlotLike [test-parent-slot-like-sync] onParse sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot] onInit',
                'TestChildSlot [test-child-slot] onParse sync',
                'TestChildSlot [test-child-slot] onViewInit sync',
                'TestParentSlotLike [test-parent-slot-like-sync] onViewInit async',
                'TestParentSlotLike [test-parent-slot-like-sync] onDestroy',
                'TestChildSlot [from-template] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
            ]
        },
        {
            // The important parts to check:
            // * Grandparent sees content
            // * onViewInit calls are from child to parent to grandparent
            // * onDestroy calls are from grandparent to parent to child
            // * onParse and onViewInit are sync throughout
            name: 'Grandparent, async',
            // only: true,
            url: '/e2e/event-grandparent-async.html',
            events: [
                'TestGrandparent [undefined] constructor',
                'TestGrandparent [test-grandparent-async] onInit',
                'TestGrandparent [test-grandparent-async] onParse sync',
                'Grandparent sees content',
                'TestParent [undefined] constructor',
                'TestParent [test-parent-async] onInit',
                'TestParent [test-parent-async] onDestroy',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [test-child-slot-async] onInit',
                'TestChildSlot [test-child-slot-async] onParse sync',
                'TestChildSlot [test-child-slot-async] onViewInit sync',
                'TestChildSlot [test-child-slot-async] onDestroy',
                'TestParent [undefined] constructor',
                'TestParent [from-template] onInit',
                'TestParent [from-template] onParse sync',
                'Parent does NOT see content',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParent [from-template] onViewInit sync',
                'TestGrandparent [test-grandparent-async] onViewInit sync',
                'TestGrandparent [test-grandparent-async] onDestroy',
                'TestParent [from-template] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ],
        },
        {
            // The important parts to check:
            // * Grandparent sees content
            // * onViewInit calls are from child to parent to grandparent
            // * onDestroy calls are from grandparent to parent to child
            // * onParse and onViewInit must be async for the grandparent
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
                'TestChildSlot [test-child-slot] onParse sync',
                'TestChildSlot [test-child-slot] onViewInit sync',
                'TestGrandparent [test-grandparent-sync] onParse async',
                'Grandparent sees content',
                'TestParent [test-parent-sync] onDestroy',
                'TestChildSlot [test-child-slot] onDestroy',
                'TestParent [undefined] constructor',
                'TestParent [from-template] onInit',
                'TestParent [from-template] onParse sync',
                'Parent does NOT see content',
                'TestChildSlot [undefined] constructor',
                'TestChildSlot [from-template] onInit',
                'TestChildSlot [from-template] onParse sync',
                'TestChildSlot [from-template] onViewInit sync',
                'TestParent [from-template] onViewInit sync',
                'TestGrandparent [test-grandparent-sync] onViewInit async',
                'TestGrandparent [test-grandparent-sync] onDestroy',
                'TestParent [from-template] onDestroy',
                'TestChildSlot [from-template] onDestroy',
            ]
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
        cy.get('#events').should('have.text', `TestParentOnchange [undefined] constructor
TestParentOnchange [parent-onchange] onInit
TestParentOnchange [parent-onchange] onParse async
TestChildOnchange [undefined] constructor
TestChildOnchange [child-onchange] onChange a
TestChildOnchange [child-onchange] onChange p
TestChildOnchange [child-onchange] onInit
TestChildOnchange [child-onchange] onParse sync
TestChildOnchange [child-onchange] onViewInit sync
TestParentOnchange [parent-onchange] onViewInit async
TestChildOnchange [child-onchange] onChange a
TestChildOnchange [child-onchange] onChange p
`);
    });
});
