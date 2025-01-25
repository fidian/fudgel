import {
    component,
    defineSlotComponent,
    html,
    metadataControllerElement,
} from '../../src/fudgel.js';

defineSlotComponent();

component(
    'parent-element',
    {
        template: html`<child-element>{{name}}</child-element>`,
    },
    class {
        name = 'parent';
    }
);

component(
    'child-element',
    {
        template: html`<div id="unnamedSlot" style="border: 2px solid blue">
            <slot #ref="slot"></slot>
        </div>`,
        useShadow: true,
    },
    class {
        name = 'child';
        slot: HTMLSlotElement;

        onViewInit() {
            const element = metadataControllerElement.get(this);

            for (const childNode of element.childNodes as unknown as ChildNode[]) {
                this.slot.append(childNode.cloneNode(true));
            }
        }
    }
);

component(
    'parent-element-shadow',
    {
        template: html`<child-element-shadow
            >{{name}}<span slot="x">Correct</span></child-element-shadow
        >`,
    },
    class {
        name = 'parent';
    }
);

component(
    'child-element-shadow',
    {
        template: html`<div id="namedSlot" style="border: 1px solid red">
                <slot name="x">Default - was not replaced</slot>
            </div>
            <div id="unnamedSlot" style="border: 2px solid blue">
                <slot></slot>
            </div>`,
        useShadow: true,
    },
    class {
        name = 'child';
    }
);

component('content-projection', {
    template: html`<slot></slot>`,
});

component(
    'delayed-projection',
    {
        template: html`<content-projection *if="show"
            >${generateContentDivs()}</content-projection
        >`,
    },
    class {
        show = false;

        onViewInit() {
            this.show = true;
        }
    }
);

function generateContentDivs() {
    return 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').join(html`
        <div class="this-div-is-here-to-inject-extra-content">
            <div class="the-goal-is-to-consume-lots-of-space">
                <div class="abcdefghijklmnopqrstuvwxyz0123456789">
                    <div
                        class="many-many-many-many-many-many-many-many-many-bytes"
                    ></div>
                </div>
            </div>
        </div>
    `);
}

describe('basic initialization', () => {
    beforeEach(() => {
        cy.mount('<parent-element></parent-element>');
    });

    it('projects content manually', () => {
        cy.get('child-element')
            .find('slot')
            .then(element => {
                expect(element[0].assignedNodes()[0].textContent).to.equal(
                    'parent'
                );
            });
    });
});

describe('with shadow dom', () => {
    beforeEach(() => {
        cy.mount('<parent-element-shadow></parent-element-shadow>');
    });

    it('projects content into slots', () => {
        cy.get('#namedSlot')
            .find('slot')
            .then(element => {
                expect(element[0].assignedElements()[0].textContent).to.equal(
                    'Correct'
                );
            });

        // The interpretation of the parent's template should be done in the parent.
        cy.get('#unnamedSlot')
            .find('slot')
            .then(element => {
                expect(element[0].assignedNodes()[0].textContent).to.equal(
                    'parent'
                );
            });
    });
});

describe('with content supplied', () => {
    beforeEach(() => {
        cy.mount(`<content-projection>Is this italics? <i>YES</i></content-projection>`);
    });

    it('projects content', () => {
        cy.get('content-projection slot-like i').should(
            'contain.text',
            'YES'
        );
    });
});
