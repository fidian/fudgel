import { component } from './fudgel.min.js';

component(
    'test-key-value-events',
    {
        template: `
            <div>
                <input type="text"
                       @keypress.code-32="changeSpaceCount()"
                       @keydown.enter="input2.focus()"
                       @keydown.tab.stop.prevent="message($event)"
                       #ref="input1"
                       />
                ({{spaceCount}} spaces pressed)
            </div>
            <input type="text"
                   @keypress.code-32="changeSpaceCount()"
                   @keydown.enter="input1.focus()"
                   @keydown.tab.stop.prevent="message($event)"
                   #ref="input2"
                   />
            <div>Press enter to switch between fields</div>
            <div>Press tab for silly messages</div>
        `,
    },
    class {
        spaceCount = 0;
        changeSpaceCount() {
            this.spaceCount += 1;
        }
        message(event) {
            this.input1.value = 'You pressed tab!';
            this.input2.value = 'Congratulations!';
            alert('Here is a silly message!');
        }
    }
);
