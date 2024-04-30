import hljs from './highlight.min.js';
import css from './css.min.js';
import javascript from './javascript.min.js';
import json from './json.min.js';
import shell from './shell.min.js';
import typescript from './typescript.min.js';
import xml from './xml.min.js';
hljs.registerLanguage('css', css);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);

export { hljs };
