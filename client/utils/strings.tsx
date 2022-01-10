import React from 'react';

function firstCharUpperCase(string?: string): string {
    return !string?.length ?
        '' :
        string
            .toLowerCase()
            .replace(
                /\b\w/g,
                (l) => l.toUpperCase()
            );
}

function convertNewlineToBreak(string?: string) {
    return !string?.length ?
        '' :
        string.replace(/\r/g, '')
            .split('\n')
            .map((item, key) => (
                <span key={key}>
                    {item}
                    <br />
                </span>
            ));
}

function convertHtmlToPlainText(html?: string): string {
    if (html == null || html.length === 0) {
        return '';
    } else if (html[0] !== '<') {
        // No need to convert if the string doesn't start with a tag
        return html;
    }

    const node = document.createElement('div');

    node.innerHTML = html;
    return node.textContent;
}

// eslint-disable-next-line consistent-this
const self = {
    convertNewlineToBreak,
    firstCharUpperCase,
    convertHtmlToPlainText,
};

export default self;
