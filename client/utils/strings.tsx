import React from 'react';
import {IEventOrPlanningItem, IProfileSchemaTypeString} from '../interfaces';
import {planningApi} from '../superdeskApi';

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

function convertStringFieldForProfileFieldType(
    srcItemType: IEventOrPlanningItem['type'] | 'coverage',
    destItemType: IEventOrPlanningItem['type'] | 'coverage',
    srcField: string,
    destField: string,
    value?: string
): string {
    if (value == null || !value.length) {
        return undefined;
    }

    const srcProfile = planningApi.contentProfiles.get(srcItemType)?.schema?.[srcField];
    const destProfile = planningApi.contentProfiles.get(destItemType)?.schema?.[destField];

    if (srcProfile?.type !== 'string' || destProfile?.type !== 'string') {
        console.error(`Cannot convert ${srcItemType}.${srcField} to ${destItemType}.${destField}, incompatible types`);
        return value;
    }

    const srcFormat = srcProfile.field_type;
    const destFormat = destProfile.field_type;

    if (srcFormat === destFormat) {
        return value;
    } else if (srcFormat === 'single_line') {
        return destFormat === 'multi_line' ?
            value :
            `<p>${value}</p>`;
    } else if (srcFormat === 'multi_line') {
        return destFormat === 'single_line' ?
            value.replace(/\n/g, ' ') :
            value.split('\n')
                .map((line) => `<p>${line || '<br>'}</p>`)
                .join('');
    } else if (srcFormat === 'editor_3') {
        return destFormat === 'single_line' ?
            convertHtmlToPlainText(value.replace(/\n/g, ' ')) :
            convertHtmlToPlainText(value);
    }

    return value;
}

// eslint-disable-next-line consistent-this
const self = {
    convertNewlineToBreak,
    firstCharUpperCase,
    convertHtmlToPlainText,
    convertStringFieldForProfileFieldType,
};

export default self;
