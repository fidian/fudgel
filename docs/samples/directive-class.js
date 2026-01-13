import { component } from '/fudgel.min.js';

component(
    'directive-class',
    {
        style: `
            .even { background-color: lightblue; }
            .notMultipleOfThree { border: 2px solid black; }
            .moreThanFive { font-weight: bold; }
        `,
        template: `
            <button @click="switchClasses()">Increment N</button>
            <p #class="{
                even: n % 2 === 0,
                notMultipleOfThree: n % 3,
                moreThanFive: n > 5
            }">N: {{n}}</p>
            <ul>
                <li>Blue background if even</li>
                <li>Black border if not a multiple of 3</li>
                <li>Bold text if greater than 5</li>
            </ul>
        `,
    },
    class {
        n = 1;

        switchClasses() {
            this.n = (this.n + 1) % 10;
        }
    }
);
