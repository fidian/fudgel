import { component, metadataControllerElement } from './fudgel.min.js';
import { cleanText } from './clean-text.js';

component(
    'live-playground',
    {
        style: `
            .wrapper {
                display: flex;
            }

            @media (max-width:768px) {
                .wrapper {
                    flex-direction: column;
                }
            }

            .full {
                height: 300px;
                width: 100%;
                resize: none;
            }
        `,
        template: `
            <div class="wrapper">
                <textarea #ref="ta" class="full"></textarea>
                <div #ref="demo" class="full">Output</div>
            </div>
        `,
    },
    class {
        onViewInit() {
            const elem = metadataControllerElement.get(this);
            const template = elem.querySelector('template');
            for (const child of elem.childNodes) {
                console.log(child);
            }

            setTimeout(() => {
            for (const child of elem.childNodes) {
                console.log(child);
            }
            }, 1000);

            if (!template) {
                console.error('<live-playground>:', 'Content must be provided inside a <template> tag');
                return;
            }

            this.ta.value = cleanText(template.innerHTML);
        }
    }
);
