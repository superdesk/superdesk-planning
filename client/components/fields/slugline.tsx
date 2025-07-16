import React from 'react';
import {get} from 'lodash';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';
import {stringUtils} from '../../utils';

const stylesForEllipsis: React.CSSProperties = {
    flexShrink: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

export const slugline = ({item, language}: IFieldsProps) => {
    if (!get(item, 'slugline', '')) {
        return null;
    }

    const value = stringUtils.convertHtmlToPlainText(
        getTranslatedValue(language, item, 'slugline') || item.slugline,
    );

    return (
        <span className="sd-list-item__slugline" style={{...stylesForEllipsis, lineHeight: 1}}>
            {value}
        </span>
    );
};
