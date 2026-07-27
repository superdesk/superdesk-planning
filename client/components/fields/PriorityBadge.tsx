import React, {FunctionComponent} from 'react';
import {superdeskApi} from '../../superdeskApi';
import {DEFAULT_PRIORITY_COLORS} from '../../components/editor-standalone/field-definitions/priority-field';
import {getTextColor} from 'superdesk-ui-framework/react';

/**
 * The priority value as a coloured badge, shared by list views and previews.
 * Falls back to plain text when no colour is configured for the value.
 */
export const PriorityBadge: FunctionComponent<{priority: number | string}> = ({priority}) => {
    const vocabulary = superdeskApi.entities.vocabulary?.getAll()?.get('priority');
    const vocabularyItem = vocabulary?.items.find(({qcode}) => qcode.toString() === priority.toString());
    const label = vocabularyItem == null
        ? priority.toString()
        : superdeskApi.entities.vocabulary.getVocabularyItemNameTranslated(vocabularyItem);
    const backgroundColor = vocabularyItem?.color ?? DEFAULT_PRIORITY_COLORS[priority];

    if (backgroundColor == null) {
        return <span data-test-id="priority-badge">{label}</span>;
    }

    return (
        <div style={{display: 'flex', alignItems: 'center'}}>
            <div
                data-test-id="priority-badge"
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
    );
};
