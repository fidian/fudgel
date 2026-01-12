import { component, emit } from './fudgel.min.js';

component(
    'utility-emit',
    {
        template: `
            <button @click.stop.prevent="clicked()">Click me</button>
            to send a custom event
        `,
    },
    class {
        clicked() {
            emit(this, 'button-sample-event', {
                extraData: 'can go in here',
                youCanUse: 'whatever you like',
                when: new Date(),
            });
        }
    }
);
