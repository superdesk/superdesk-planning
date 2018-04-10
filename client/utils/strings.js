import React from 'react';

const capitalize = (string) => !string ? '' : string.charAt(0).toUpperCase() + string.slice(1);

const firstCharUpperCase = (string) => string && string.replace(/\b\w/g, (l) => l.toUpperCase());

const convertNewlineToBreak = (string) => !string ? '' :
    string.split('\n')
        .map((item, key) => <span key={key}>{item}<br/></span>);

// eslint-disable-next-line consistent-this
const self = {
    capitalize,
    convertNewlineToBreak,
    firstCharUpperCase,
};

export default self;
