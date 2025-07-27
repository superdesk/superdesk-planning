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

export const anpa_category: React.ComponentType<IProps> = (props) => {
    const {getVocabularyItemNameTranslated} = superdeskApi.entities.vocabulary;
    const {gettext} = superdeskApi.localization;
    const {item} = props;

    const anpa_category = item.anpa_category;

    if ((anpa_category ?? []).length < 1) {
        return null;
    }

    return (
        <Spacer h gap="4" noWrap style={{whiteSpace: 'nowrap'}}>
            <div>{gettext('ANPA Category')}</div>

            <WithMoreItems
                items={anpa_category}
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
