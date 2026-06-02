import React from 'react';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';
import {stringUtils} from '../../utils';

const stylesForEllipsis: React.CSSProperties = {
    flexShrink: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

export const name = ({item, language}: IFieldsProps) => {
    if (item.name == null) {
        return null;
    }

    const value = stringUtils.convertHtmlToPlainText(getTranslatedValue(language, item, 'name') ?? item.name);

    return (
        <span className="sd-list-item__name" style={{...stylesForEllipsis, lineHeight: '1lh'}}>
            {value}
        </span>
    );
};
