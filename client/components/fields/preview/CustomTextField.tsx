import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {PreviewFormItem} from './base/PreviewFormItem';

interface IProps extends IListFieldProps {
    fieldName: string;
    testId?: string;
    renderEmpty?: boolean;
}

/**
 * Generic preview for a custom text field (field name == vocabulary id).
 * `field`, when provided, points to a coverage style `fields` array
 * (`[{field, value}]`); otherwise the value is read from `item[fieldName]`.
 */
export const PreviewFieldCustomTextField: React.FunctionComponent<IProps> = (props) => {
    const {item, language, fieldName} = props;
    const vocabulary = superdeskApi.entities.vocabulary.getVocabulary(fieldName);

    if (vocabulary == null) {
        return null;
    }

    let value: string | undefined;

    if (props.field != null) {
        const fieldsArray = get(item, props.field);

        value = Array.isArray(fieldsArray) ?
            fieldsArray.find((entry) => entry.field === fieldName)?.value :
            undefined;
    } else {
        value = get(item, fieldName);
    }

    return (
        <PreviewFormItem
            testId={props.testId}
            label={vocabulary.translations?.display_name?.[language] ?? vocabulary.display_name}
            light={true}
            value={value}
            renderEmpty={props.renderEmpty}
            convertNewlineToBreak={true}
        />
    );
};
