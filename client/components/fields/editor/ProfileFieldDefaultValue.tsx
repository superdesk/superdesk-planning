import * as React from 'react';

import {IEditorFieldProps, IProfileFieldEntry} from '../../../interfaces';

import {renderFieldsForPanel} from '../index';

interface IProps extends IEditorFieldProps {
    item: IProfileFieldEntry;
    onChange(field: string, value: string | number): void;
}

export function ProfileFieldDefaultValue({item, onChange, ...props}: IProps) {
    return renderFieldsForPanel(
        'editor',
        {[item.name]: {enabled: true, index: 1}},
        {
            item: item,
            onChange: onChange,
        },
        {
            [item.name]: {
                ...props,
                field: 'schema.default_value',
            },
        }
    );
}
