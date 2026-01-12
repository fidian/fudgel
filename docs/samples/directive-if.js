import { component } from '/fudgel.min.js';

component(
    'directive-if',
    {
        template: `
            <button @click="toggleMessage()">Toggle Message</button>
            <div *if="showMessage">
                <p>The message is now visible!</p>
            </div>
            <div *if="!showMessage">
                <p>The message is hidden. Click the button to show it.</p>
            </div>
        `,
    },
    class {
        toggleMessage() {
            this.showMessage = !this.showMessage;
        }
    }
);
