import hljs from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/highlight.min.js';
import css from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/css.min.js';
import javascript from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/javascript.min.js';
import json from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/json.min.js';
import shell from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/shell.min.js';
import typescript from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/typescript.min.js';
import xml from 'https://unpkg.com/@highlightjs/cdn-assets@11.9.0/es/languages/xml.min.js';
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

export { hljs };
