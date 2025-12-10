import React from 'react';
import {Tag} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {IFieldsProps} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {WithMoreItems} from './with-more-items';

type IProps = Omit<IFieldsProps, 'fieldOptions'> & ILineConfigVocabulary;

export const vocabulary: React.ComponentType<IProps> = (props) => {
    const {getVocabularyItemNameTranslated} = superdeskApi.entities.vocabulary;
    const {item} = props;
    const vocabularyId = props.fieldOptions.vocabularyId;
    const vocabulary = superdeskApi.entities.vocabulary.getAll().get(vocabularyId);
    const showVocabularyName = props.fieldOptions.hideVocabularyName !== true;

    const vocabularyItems = (item.subject ?? []).filter(({scheme}) => scheme === vocabularyId);

    if (vocabularyItems.length < 1 || vocabulary == null) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap noGrow style={{whiteSpace: 'nowrap'}}>
            {showVocabularyName && <div className="sd-list-item__text-label">{vocabulary.display_name}</div>}

            <WithMoreItems
                items={vocabularyItems}
                template={({items}) => (
                    <>
                        {
                            items.map((item, i) => (
                                <div key={i}>
                                    <Tag size="small" text={getVocabularyItemNameTranslated(item)} />
                                </div>
                            ))
                        }
                    </>
                )}
            />
        </Spacer>
    );
};
