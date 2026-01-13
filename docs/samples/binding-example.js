import { component } from '/fudgel.min.js';

const links = [
    { siteName: 'Fudgel', url: 'https://fudgel.js.org/' },
    { siteName: 'Example (disabled)', url: 'https://example.com/', disabled: true },
    { siteName: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
    { siteName: 'W3C (disabled)', url: 'https://www.w3.org/', disabled: true },
];

component(
    'binding-example',
    {
        template: `
            <p>This rotates through sites every 4 seconds:</p>
            <p>
                {{ siteName }}
                <input
                    type="text"
                    disabled="{{ disabled }}"
                    value="{{ url }}" />
            </p>
        `,
    },
    class {
        onInit() {
            this.index = -1;
            const update = () => {
                this.index = (this.index + 1) % links.length;
                this.siteName = links[this.index].siteName;
                this.url = links[this.index].url;
                this.disabled = !!links[this.index].disabled;
            };
            update();
            this.interval = setInterval(update, 4000);
        }

        onDestroy() {
            clearInterval(this.interval);
        }
    }
);
