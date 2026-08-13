import React from 'react';
import {Tag} from 'superdesk-ui-framework/react';
import {Spacer} from '@sourcefabric/common';
import {IFieldsProps} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';
import {WithMoreItems} from './with-more-items';
import {ILineConfigAnpaCategory} from 'globals';

type IProps = Omit<IFieldsProps, 'fieldOptions'> & ILineConfigAnpaCategory;

export const anpa_category: React.ComponentType<IProps> = (props) => {
    const {getVocabularyItemNameTranslated} = superdeskApi.entities.vocabulary;
    const {item} = props;

    const anpa_category = item.anpa_category;
    const vocabulary = superdeskApi.entities.vocabulary.getAll().get('categories');
    const showLabel = props.fieldOptions?.hideLabel !== true;

    if ((anpa_category ?? []).length < 1 || vocabulary == null) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap noGrow style={{whiteSpace: 'nowrap'}}>
            {showLabel && <div className="sd-list-item__text-label">{vocabulary.display_name}</div>}

            <WithMoreItems
                items={anpa_category}
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
