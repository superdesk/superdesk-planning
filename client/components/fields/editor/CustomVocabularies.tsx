import * as React from 'react';
import {connect} from 'react-redux';

import {IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IProfileSchemaTypeList} from '../../../interfaces';
import {SelectMetaTermsInput, Row} from '../../UI/Form';
import {getUserInterfaceLanguageFromCV} from '../../../utils/users';

interface IProps extends IEditorFieldProps {
    schema?: IProfileSchemaTypeList;
    vocabularies: Array<IVocabulary>;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

const mapStateToProps = (state) => ({
    vocabularies: state.customVocabularies
});

class CustomVocabulariesComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const customVocabularies = this.props.vocabularies.filter((cv) => (
            (this.props.schema.vocabularies ?? []).includes(cv._id)
        ));

        return customVocabularies.map((cv) => {
            const cvFieldName = `custom_vocabularies.${cv._id}`;
            const error = this.props.showErrors ? this.props.errors?.[cvFieldName] : undefined;
            const parentField = cv.schema_field || 'subject';

            return (
                <Row
                    key={cv._id}
                    id={`form-row-${cvFieldName}`}
                    data-test-id={this.props.testId?.length ? `${this.props.testId}.${cv._id}` : cv._id}
                >
                    <SelectMetaTermsInput
                        options={cv.items.map((item) => Object.assign({scheme: cv._id}, item))}
                        value={this.props.item[parentField]}
                        label={gettext(cv.display_name)}
                        readOnly={this.props.disabled}
                        onChange={this.props.onChange}
                        required={this.props.required || this.props.schema.required}
                        field={parentField}
                        scheme={cv._id}
                        popupContainer={this.props.popupContainer}
                        onPopupOpen={this.props.onPopupOpen}
                        onPopupClose={this.props.onPopupClose}
                        language={this.props.language}
                        invalid={!!error}
                        message={error}
                        noMargin={true}
                    />
                </Row>
            );
        });
    }
}

export const EditorFieldCustomVocabularies = connect(mapStateToProps)(CustomVocabulariesComponent);
