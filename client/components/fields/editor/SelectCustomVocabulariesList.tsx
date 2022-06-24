import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IVocabulary} from 'superdesk-api';
import {IEditorFieldProps} from '../../../interfaces';

import {EditorFieldVocabulary} from './base/vocabulary';

interface IProps extends IEditorFieldProps {
    vocabularies: Array<IVocabulary>;
    onChange(field: string, value: string): void;
}

const mapStateToProps = (state) => ({
    vocabularies: state.customVocabularies
});

class SelectCustomVocabulariesListComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <EditorFieldVocabulary
                {...this.props}
                defaultValue={[]}
                label={this.props.label ?? gettext('Vocabularies')}
                field={this.props.field ?? 'vocabularies'}
                valueAsString={true}
                options={this.props.vocabularies.map((cv) => ({
                    qcode: cv._id,
                    name: cv.display_name,
                }))}
            />
        );
    }
}

export const SelectCustomVocabulariesList = connect(mapStateToProps)(SelectCustomVocabulariesListComponent);
