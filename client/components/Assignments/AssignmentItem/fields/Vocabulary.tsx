import React from 'react';
import {Tag} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {IAssignmentListItemField} from '../../interfaces';
import {superdeskApi} from '../../../../superdeskApi';
import {WithMoreItems} from '../../../../components/fields/with-more-items';

interface IProps extends IAssignmentListItemField {
    fieldOptions: {
        vocabularyId: string;
        hideVocabularyName?: boolean;
    };
}

export const VocabularyComponent: React.ComponentType<IProps> = (props) => {
    const {getVocabularyItemNameTranslated} = superdeskApi.entities.vocabulary;
    const vocabularyId = props.fieldOptions.vocabularyId;
    const vocabulary = superdeskApi.entities.vocabulary.getAll().get(vocabularyId);
    const showVocabularyName = props.fieldOptions.hideVocabularyName !== true;

    const vocabularyItems = (props.assignment?.planning?.subject ?? []).filter(({scheme}) => scheme === vocabularyId);

    if (vocabularyItems.length < 1 || vocabulary == null) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap style={{whiteSpace: 'nowrap'}}>
            {showVocabularyName && <div className="sd-list-item__text-label">{vocabulary.display_name}</div>}

            <WithMoreItems
                items={vocabularyItems}
                template={({items}) => (
                    <>
                        {
                            items.map((item, i) => (
                                <div key={i}>
                                    <Tag text={getVocabularyItemNameTranslated(item)} />
                                </div>
                            ))
                        }
                    </>
                )}
            />
        </Spacer>
    );
};
