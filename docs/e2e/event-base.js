// Written for the UMD version of Fudgel. Do not use modules because they can
// load asynchronously.
//
// Usage for E2E event tests - put these INSIDE <body>
//     <script src="fudgel.umd.js"></script>
//     <script src="event-base.js"></script>
(() => {
    Fudgel.defineSlotComponent();
    const logMessage = msg => {
        const element = document.getElementById('events');
        element.textContent += msg + '\n';
    };
    const triggerEvent = (obj, event) => {
        const className = obj.constructor.name;
        const id = obj[Fudgel.metadata]?.host?.id;
        logMessage(`${className} [${id}] ${event}`);
    };

    window.LogEvents = class LogEvents {
        constructor() {
            triggerEvent(this, 'constructor');
        }
        onInit() {
            triggerEvent(this, 'onInit');
        }
        onParse(wasAsync) {
            triggerEvent(this, `onParse ${wasAsync ? 'async' : 'sync'}`);
        }
        onViewInit(wasAsync) {
            triggerEvent(this, `onViewInit ${wasAsync ? 'async' : 'sync'}`);
        }
        onChange(propName) {
            triggerEvent(this, `onChange ${propName}`);
        }
        onDestroy() {
            triggerEvent(this, 'onDestroy');
        }
    };

    Fudgel.component(
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

    Fudgel.component(
        'test-child-slot',
        {
            template: '<slot></slot>',
            useShadow: true,
        },
        class TestChildSlot extends LogEvents {}
    );

    Fudgel.component(
        'test-parent',
        {
            template: '<test-child-slot id="from-template"></test-child-slot>',
        },
        class TestParent extends LogEvents {
            onParse(...args) {
                super.onParse(...args);

                if (
                    this[Fudgel.metadata].host.innerHTML.includes(
                        'SEES-CONTENT'
                    )
                ) {
                    logMessage('Parent sees content');
                } else {
                    logMessage('Parent does NOT see content');
                }
            }
        }
    );

    Fudgel.component(
        'test-parent-onchange',
        {
            template: `
            Parent A: <span id="parentA">{{a}}</span><br />
            Parent P: <span id="parentP">{{p}}</span><br />
            <test-child-onchange id="child-onchange" a="{{a}}" .p="p">
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

    Fudgel.component(
        'test-parent-slot',
        {
            template:
                '<test-child-slot id="from-template"><slot></slot></test-child-slot>',
            useShadow: true,
        },
        class TestParentSlot extends LogEvents {}
    );

    Fudgel.component(
        'test-parent-slot-like',
        {
            template:
                '<test-child-slot id="from-template"><slot></slot></test-child-slot>',
        },
        class TestParentSlotLike extends LogEvents {}
    );

    Fudgel.component(
        'test-grandparent',
        {
            template:
                '<test-parent id="from-template"><test-child id="from-template"></test-child></test-parent>',
        },
        class TestGrandparent extends LogEvents {
            onParse(...args) {
                super.onParse(...args);

                if (
                    this[Fudgel.metadata].host.innerHTML.includes(
                        'SEES-CONTENT'
                    )
                ) {
                    logMessage('Grandparent sees content');
                } else {
                    logMessage('Grandparent does NOT see content');
                }
            }
        }
    );

    const div = document.createElement('div');
    div.innerHTML = `
        <p>Events, oldest first:</p>
        <div id="events" style="white-space: pre"></div>
        <hr />
    `;
    document.body.prepend(div);
})();
