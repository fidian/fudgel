import { component, Controller, elementToController, html } from '../../src/fudgel.js';

const events = [];
const trigger = (obj: Controller, event: string) => {
    const className = obj.constructor.name;
    const message = `${className} ${event}`;
    events.push(message);
    console.log(message);
};

class LogEvents {
    constructor() {
        trigger(this, 'constructor');
    }
    onInit() {
        trigger(this, 'onInit');
    }
    onViewInit() {
        trigger(this, 'onViewInit');
    }
    onChange(propName: string) {
        trigger(this, `onChange ${propName}`);
    }
    onDestroy() {
        trigger(this, 'onDestroy');
    }
}

component(
    'test-parent',
    {
        template: '<test-child></test-child>',
    },
    class TestParent extends LogEvents {}
);
component(
    'test-child',
    {
        template: '{{state}}',
    },
    class TestChild extends LogEvents {
        state = 'starting';

        onInit() {
            super.onInit();

            // This should not trigger onChange
            this.state = 'working';

            // Triggers onChange after onInit
            setTimeout(() => (this.state = 'ready'));
        }
    }
);
component(
    'test-parent-shadow',
    {
        template: '<test-child-shadow></test-child-shadow>',
        useShadow: true,
    },
    class TestParentShadow extends LogEvents {}
);
component(
    'test-child-shadow',
    {
        template: '{{state}}',
        useShadow: true,
    },
    class TestChildShadow extends LogEvents {
        state = 'starting';

        onInit() {
            super.onInit();

            // This should not trigger onChange
            this.state = 'working';

            // Triggers onChange after onInit
            setTimeout(() => (this.state = 'ready'));
        }
    }
);
component(
    'test-parent-onchange',
    {
        template: `
            Parent A: <span id="parentA">{{a}}</span><br />
            Parent P: <span id="parentP">{{p}}</span><br />
            <test-child-onchange a="{{a}}" .p="p">
            </test-child-onchange>
            <button id="updateA" @click="updateA()">Update A</button><br />
            <button id="updateP" @click="updateP()">Update P</button><br />
        `,
    },
    class TestParentOnchange extends LogEvents {
        a = 0;
        p = 5;
        updateA() {
            this.a++;
        }
        updateP() {
            this.p++;
        }
    }
);
component(
    'test-child-onchange',
    {
        attr: ['a'],
        prop: ['p'],
        template: `
            Child A: <span id="childA">{{a}}</span><br />
            Child P: <span id="childP">{{p}}</span><br />
        `,
    },
    class TestChildOnchange extends LogEvents {}
);

describe('with light dom', () => {
    it('is in the correct order', () => {
        cy.log('Starting test run');
        events.splice(0, events.length);
        cy.mount('<test-parent></test-parent>');
        cy.get('test-child')
            .should('have.text', 'ready')
            .then(() => {
                console.groupCollapsed('Events after test ran');
                for (const event of events) {
                    console.log(event);
                }
                console.groupEnd();
                expect(events).to.deep.equal([
                    'TestParent constructor',
                    'TestParent onInit',
                    'TestChild constructor',
                    'TestChild onInit',
                    'TestChild onViewInit',
                    'TestParent onViewInit',
                ]);
            });
    });

    it('triggers only one onChange when attr and prop changes', () => {
        cy.log('Starting test run');
        events.splice(0, events.length);
        cy.mount('<test-parent-onchange></test-parent-onchange>');
        cy.get('#childA').should('have.text', '0');
        cy.get('#childP').should('have.text', '5');
        cy.get('#updateA').click();
        cy.get('#updateP').click();
        cy.get('#childA').should('have.text', '1');
        cy.get('#childP').should('have.text', '6');
        cy.get('test-child-onchange').then(() => {
            console.groupCollapsed('Events after test ran');
            for (const event of events) {
                console.log(event);
            }
            console.groupEnd();
            expect(events).to.deep.equal([
                'TestParentOnchange constructor',
                'TestParentOnchange onInit',
                'TestChildOnchange constructor',
                'TestChildOnchange onChange a',
                'TestChildOnchange onChange p',
                'TestChildOnchange onInit',
                'TestChildOnchange onViewInit',
                'TestParentOnchange onViewInit',
                'TestChildOnchange onChange a',
                'TestChildOnchange onChange p',
            ]);
        });
    });
});

describe('with shadow DOM', () => {
    beforeEach(() => {
        console.log('Starting test run');
        events.splice(0, events.length);
        cy.mount('<test-parent-shadow></test-parent-shadow>');
    });

    it('is in the correct order', () => {
        cy.get('test-child-shadow')
            .shadow()
            .should('have.text', 'ready')
            .then(() => {
                console.groupCollapsed('Events after test ran');
                for (const event of events) {
                    console.log(event);
                }
                console.groupEnd();
                expect(events).to.deep.equal([
                    // Create the parent
                    'TestParentShadow constructor',
                    'TestParentShadow onInit',
                    'TestChildShadow constructor',
                    'TestChildShadow onInit',
                    'TestChildShadow onViewInit',
                    'TestParentShadow onViewInit',
                ]);
            });
    });
});

component(
    'child-el',
    { prop: ['x'], template: 'Child' },
    class ChildElController {
        changeCount = 0;
        onChange() {
            this.changeCount += 1;
        }
    }
);

component(
    'parent-el',
    {
        template: html`
            <div>
                <button *if="x === 'one'" id="make-change" @click="makeChange()">
                    Make Change
                </button>
                <button *if="x === 'two'" id="test1" @click="hide()">Test 1 - Hide</button>
                <button *if="x === 'two'" id="test2" @click="hide()">Test 2 - Remove</button>
                <button id="get-count" @click="getCount()">Get Current Change Count</button>
                <button @click="reset()">Reset</button>
            </div>
            <div *if="changes != null">Change Count: <span id="changes">{{changes}}</span></div>
            <child-el #ref="child" *if="!hidden" .x="x" @on-change="onChange()"></child-el>
        `,
    },
    class ParentElController {
        changes?: number;
        child: HTMLElement;
        element: HTMLElement;
        hidden = false;
        x = 'one';

        onViewInit() {
            // Keep a reference to the element even if the child changes or is removed.
            this.element = this.child;
        }

        getCount() {
            this.changes = (elementToController(this.element) as any).changeCount;
        }

        reset() {
            this.changes = null;
            this.hidden = false;
            this.x = 'one';
        }

        makeChange() {
            this.changes = null;
            this.x = 'two';
        }

        hide() {
            this.changes = null;
            // Remove the element, which removes event listeners
            this.hidden = true;
            this.x = 'test1';
        }

        remove() {
            this.changes = null;
            // Remove the element, which removes event listeners
            const e = this.child;
            e.remove();
            (e as any).x = 'test2'
        }
    }
);

describe('Element removal', () => {
    it('removes bindings when hidden', () => {
        cy.mount('<parent-el></parent-el>');
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '1');
        cy.get('#make-change').click();
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '2');
        cy.get('#test1').click();
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '2');
    });
    it('removes bindings when removed', () => {
        cy.mount('<parent-el></parent-el>');
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '1');
        cy.get('#make-change').click();
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '2');
        cy.get('#test2').click();
        cy.get('#get-count').click();
        cy.get('#changes').should('have.text', '2');
    });
});
