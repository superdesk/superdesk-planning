import * as React from 'react';

import {IListFieldProps} from '../../../interfaces';
import {IVocabulary} from 'superdesk-api';

import {PreviewFormItem} from './base/PreviewFormItem';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {planningApi} from '../../../superdeskApi';

interface IProps extends IListFieldProps {
    customVocabularies: Array<IVocabulary>;
}

export class PreviewFieldCustomVocabularies extends React.PureComponent<IProps> {
    render() {
        if (!this.props.item?.subject?.length) {
            return null;
        }

        return planningApi.vocabularies.getCustomVocabularies().map((vocab) => {
            const values = (this.props.item?.subject ?? [])
                .filter((item) => item.scheme === vocab._id);

            if (values.length) {
                return (
                    <PreviewFormItem
                        key={vocab._id}
                        label={vocab.display_name}
                        light={true}
                        value={values.map((item) => (
                            getVocabularyItemFieldTranslated(item, 'name', this.props.language) || item.name
                        )).join(', ')}
                    />
                );
            }

            return null;
        });
    }
}
