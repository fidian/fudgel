import { component, Controller } from '../../src/fudgel.js';

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

describe('event order', () => {
    beforeEach(() => {
        console.log('Starting test run');
        events.splice(0, events.length);
        cy.mount('<test-parent></test-parent>');
    });

    it('is in the correct order', () => {
        cy.get('test-child')
            .should('have.text', 'ready')
            .then(() => {
                console.groupCollapsed('Events after test ran');
                for (const event of events) {
                    console.log(event);
                }
                console.groupEnd();
                expect(events).to.deep.equal([
                    // Create the parent
                    'TestParent constructor',
                    'TestParent onInit',
                    'TestChild constructor',
                    'TestChild onInit',
                    'TestChild onViewInit',
                    'TestParent onViewInit',
                    'TestChild onChange state',
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
                    'TestChildShadow onChange state',
                ]);
            });
    });
});
