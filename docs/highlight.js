import hljs from './highlight/highlight.min.js';
import css from './highlight/css.min.js';
import javascript from './highlight/javascript.min.js';
import json from './highlight/json.min.js';
import shell from './highlight/shell.min.js';
import typescript from './highlight/typescript.min.js';
import xml from './highlight/xml.min.js';
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

export { hljs };
