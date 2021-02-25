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

// eslint-disable-next-line consistent-this
const self = {
    convertNewlineToBreak,
    firstCharUpperCase,
};

export default self;
