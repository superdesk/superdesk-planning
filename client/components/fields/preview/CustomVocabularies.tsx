import * as React from 'react';
import {connect} from 'react-redux';

import {IListFieldProps} from '../../../interfaces';
import {IVocabulary} from 'superdesk-api';

import {PreviewFormItem} from './base/PreviewFormItem';

interface IProps extends IListFieldProps {
    customVocabularies: Array<IVocabulary>;
}

const mapStateToProps = (state) => ({
    customVocabularies: state.customVocabularies,
});

export class PreviewFieldCustomVocabulariesComponent extends React.PureComponent<IProps> {
    render() {
        if (!this.props.item?.subject?.length) {
            return null;
        }

        return this.props.customVocabularies.map((vocab) => {
            const values = (this.props.item?.subject ?? [])
                .filter((item) => item.scheme === vocab._id);

            if (values.length) {
                return (
                    <PreviewFormItem
                        label={vocab.display_name}
                        light={true}
                        value={values.map((item) => item.name).join(', ')}
                    />
                );
            }

            return null;
        });
    }
}

export const PreviewFieldCustomVocabularies = connect(mapStateToProps)(PreviewFieldCustomVocabulariesComponent);
