import React from 'react';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';
import {stringUtils} from '../../utils';

export const name = ({item, language}: IFieldsProps) => {
    if (item.name == null) {
        return null;
    }

    return (
        <span className="sd-list-item__name">
            {stringUtils.convertHtmlToPlainText(getTranslatedValue(language, item, 'name') ?? item.name)}
        </span>
    );
};
