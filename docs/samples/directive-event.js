import { component } from '/fudgel.min.js';

component(
    'directive-event',
    {
        template: `
            <input
                type="text"
                placeholder="Type in here"
                @input="contentChange($event)" />
            <div #ref="output"></div>
        `,
    },
    class {
        contentChange(event) {
            this.output.textContent = `You typed: ${event.target.value}`;
        }
    }
);
