import React from 'react';
import {IEventItem, IEventOrPlanningItem, IPlanningItem, IProfileSchemaTypeString} from '../interfaces';
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

const SHIFT_OUT_REGEXP = new RegExp(String.fromCharCode(14), 'g');

function formatHTML(html) {
    return html.replace(SHIFT_OUT_REGEXP, html.indexOf('<pre>') === -1 ? '<br>' : '\n');
}

function convertHtmlToPlainText(html?: string): string {
    if (html == null || html.length === 0) {
        return '';
    } else if (html[0] !== '<') {
        // No need to convert if the string doesn't start with a tag
        return html;
    }

    const div = document.createElement('div');

    div.innerHTML = formatHTML(html);

    const tree = document.createTreeWalker(div, NodeFilter.SHOW_TEXT, null, false);
    const text = [];

    while (tree.nextNode()) {
        text.push(tree.currentNode.textContent);
        if (tree.currentNode.nextSibling) {
            switch (tree.currentNode.nextSibling.nodeName) {
            case 'BR':
            case 'HR':
                text.push('\n');
            }

            continue;
        }

        switch (tree.currentNode.parentNode.nodeName) {
        case 'P':
        case 'LI':
        case 'H1':
        case 'H2':
        case 'H3':
        case 'H4':
        case 'H5':
        case 'DIV':
        case 'TABLE':
        case 'BLOCKQUOTE':
            text.push('\n');
        }
    }

    return text.join('');
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


export function convertStringFields<Src extends IEventOrPlanningItem, Dest extends IEventOrPlanningItem>(
    itemSrc: Partial<Src>,
    _itemDest: Partial<Dest>,
    srcItemType: IEventOrPlanningItem['type'] | 'coverage',
    destItemType: IEventOrPlanningItem['type'] | 'coverage',
    fieldsToCopy: Array<[keyof Src, keyof Dest]>, // array of tuples [srcField, destField]
): Partial<Dest> {
    const itemDest: Partial<Dest> = {..._itemDest};

    for (const [srcField, destField] of fieldsToCopy) {
        const valSrc = itemSrc[srcField] as string;
        const valDest = convertStringFieldForProfileFieldType(
            srcItemType,
            destItemType,
            srcField as string,
            destField as string,
            valSrc,
        );

        itemDest[destField as string] = valDest;
    }

    const fieldsToCopyMap = fieldsToCopy.reduce((acc, [srcField, destField]) => {
        acc[srcField as string] = destField;

        return acc;
    }, {});

    const translationsDest: IPlanningItem['translations'] = (itemSrc.translations ?? [])
        .filter((itemSrc) => fieldsToCopyMap[itemSrc.field] != null)
        .map((translationSrc: IPlanningItem['translations']['0']) => ({
            ...translationSrc,
            field: fieldsToCopyMap[translationSrc.field],
        }));

    if (translationsDest.length > 0) {
        itemDest.translations = (itemDest.translations ?? []).concat(translationsDest);
    }

    return itemDest;
}

// eslint-disable-next-line consistent-this
const self = {
    convertNewlineToBreak,
    firstCharUpperCase,
    convertHtmlToPlainText,
    convertStringFieldForProfileFieldType,
};

export default self;
