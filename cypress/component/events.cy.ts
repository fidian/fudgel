import { component, Controller } from '../../src/';
import { prototypeHook } from '../../src/prototype-hooks';

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

// This is a non-standard way to add a hook. They should be done interally and
// are actually added using @Attr or @Prop.
prototypeHook(LogEvents, function (instance) {
    trigger(instance, 'hook');
});

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
        template: '{{this.state}}',
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

describe('event order', () => {
    beforeEach(() => {
        console.log('Starting test run');
        cy.mount('<test-parent></test-parent>');
    });

    it('is in the correct order', () => {
        cy.get('test-child')
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
                    'TestParent constructor',
                    'TestParent hook',
                    'TestParent onInit',
                    'TestChild constructor',
                    'TestChild hook',
                    'TestChild onInit',
                    'TestChild onViewInit',
                    'TestParent onViewInit',
                    'TestChild onChange state',
                ]);
            });
    });
});
