import React, {FunctionComponent} from 'react';
import {Spacer} from '@sourcefabric/common';
import {superdeskApi} from '../../superdeskApi';
import {IFieldsProps} from '../../interfaces';
import {DEFAULT_PRIORITY_COLORS} from '../../components/editor-standalone/field-definitions/priority-field';
import {getTextColor} from 'superdesk-ui-framework/react';
import {ILineConfigPriority} from 'globals';

type IProps = Omit<IFieldsProps, 'fieldOptions'> & ILineConfigPriority;

export const priority: FunctionComponent<IProps> = (props) => {
    const {gettext} = superdeskApi.localization;
    const {item} = props;

    if (item.priority == null) {
        return null;
    }

    const vocabulary = superdeskApi.entities.vocabulary.getAll().get('priority');
    const vocabularyItem = vocabulary.items.find(({qcode}) => qcode.toString() === item.priority.toString());
    const label = vocabularyItem == null
        ? item.priority.toString()
        : superdeskApi.entities.vocabulary.getVocabularyItemNameTranslated(vocabularyItem);

    const backgroundColor = vocabularyItem.color ?? DEFAULT_PRIORITY_COLORS[item.priority];
    const showFieldLabel = props.fieldOptions?.hideLabel !== true;

    return (
        <Spacer h gap="4" justifyContent="start" noWrap style={{whiteSpace: 'nowrap', width: 'auto'}}>
            {showFieldLabel && <span className="sd-list-item__text-label">{gettext('Priority:')}</span>}

            <div style={{display: 'flex', alignItems: 'center'}}>
                <div
                    style={{
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '1.2em',
                        minWidth: '1.2em',
                        paddingInline: 'var(--space--0-5)',
                        background: backgroundColor,
                        color: getTextColor(backgroundColor),
                        borderRadius: 'var(--b-radius--x-small)',
                    }}
                >
                    {label}
                </div>
            </div>
        </Spacer>
    );
};
