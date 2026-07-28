import * as React from 'react';
import {get} from 'lodash';

import {IListFieldProps} from '../../../interfaces';
import {superdeskApi} from '../../../superdeskApi';

import {Tag} from 'superdesk-ui-framework/react';
import {PreviewFormItem} from './base/PreviewFormItem';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';

interface IProps extends IListFieldProps {
    fieldName: string;
    testId?: string;
    renderEmpty?: boolean;
}

/**
 * Generic preview for a custom vocabulary field (field name == vocabulary id).
 * `field` is the path to the subject array within the item, defaults to `subject`.
 */
export const PreviewFieldCustomVocabulary: React.FunctionComponent<IProps> = (props) => {
    const {item, language, fieldName} = props;
    const vocabulary = superdeskApi.entities.vocabulary.getVocabulary(fieldName);

    if (vocabulary == null) {
        return null;
    }

    const values = (get(item, props.field ?? 'subject') ?? [])
        .filter((entry) => entry.scheme === fieldName);
    const label = vocabulary.translations?.display_name?.[language] ?? vocabulary.display_name;

    if (values.length === 0) {
        return (
            <PreviewFormItem
                testId={props.testId}
                label={label}
                light={true}
                renderEmpty={props.renderEmpty}
            />
        );
    }

    const names: Array<string> = values
        .map((entry) => getVocabularyItemFieldTranslated(entry, 'name', language) || entry.name);

    if (vocabulary.selection_type !== 'multi selection') {
        return (
            <PreviewFormItem
                testId={props.testId}
                label={label}
                light={true}
                value={names.join(', ')}
            />
        );
    }

    return (
        <PreviewFormItem
            testId={props.testId}
            label={label}
            light={true}
            renderEmpty={true}
        >
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--space--0-5)'}}>
                {names.map((name, index) => (
                    <Tag
                        key={index}
                        text={name}
                        readOnly={true}
                    />
                ))}
            </div>
        </PreviewFormItem>
    );
};
