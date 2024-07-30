import React from 'react';
import {getTranslatedValue} from '.';
import {IFieldsProps} from '../../interfaces';

export const name = ({item, language}: IFieldsProps) => {
    if (item.name == null) {
        return null;
    }

    return (
        <span className="sd-list-item__name">
            {getTranslatedValue(language, item, 'name') ?? item.name}
        </span>
    );
}
