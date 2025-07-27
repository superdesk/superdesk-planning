import React from 'react';
import {Tag} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {IFieldsProps} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {WithMoreItems} from './with-more-items';

interface IProps extends IFieldsProps {
    fieldsProps: {
        vocabulary: {
            id: string;
        };
    };
}

export const vocabulary: React.ComponentType<IProps> = (props) => {
    const {getVocabularyItemNameTranslated} = superdeskApi.entities.vocabulary;
    const {item} = props;
    const vocabularyId = props.fieldOptions.vocabulary.vocabularyId;
    const vocabulary = superdeskApi.entities.vocabulary.getAll().get(vocabularyId);

    const vocabularyItems = (item.subject ?? []).filter(({scheme}) => scheme === vocabularyId);

    if (vocabularyItems.length < 1) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap style={{whiteSpace: 'nowrap'}}>
            <div>{vocabulary.display_name}</div>

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
