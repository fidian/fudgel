export const cleanText = (str) => {
    // Handle unescaping escaped text.
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    str = textarea.value;

    // Clean leading spaces using first line's indentation as our key.
    const pattern = str.match(/\s*\n[\t\s]*/);
    return str.replace(new RegExp(pattern, 'g'), '\n');
};
