import * as React from 'react';
import {connect} from 'react-redux';

import {ISubject, IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IProfileSchemaTypeList} from '../../../interfaces';
import {SelectMetaTermsInput, Row} from '../../UI/Form';
import {getVocabularyItemNameFromString} from '../../../utils/vocabularies';
import {EditorFieldTreeSelect} from '../editor/base/treeSelect';

interface IProps extends IEditorFieldProps {
    schema?: IProfileSchemaTypeList;
    vocabularies: Array<IVocabulary>;
    popupContainer?(): HTMLElement;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

const mapStateToProps = (state) => ({
    vocabularies: state.customVocabularies,
});

class CustomVocabulariesComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
            vocabularies,
            schema,
            showErrors,
            errors,
            item,
            onChange,
            required,
            testId,
            language,
        } = this.props;

        const customVocabularies = vocabularies.filter((cv) =>
            (schema?.vocabularies ?? []).includes(cv._id)
        );

        return customVocabularies.map((cv) => {
            const cvFieldName = `custom_vocabularies.${cv._id}`;
            const parentField = cv.schema_field || 'subject';

            return (
                <Row
                    key={cv._id}
                    id={`form-row-${cvFieldName}`}
                    data-test-id={testId?.length ? `${testId}.${cv._id}` : cv._id}
                >
                    <EditorFieldTreeSelect
                        scheme={cv._id}
                        item={item}
                        field={parentField}
                        label={gettext(cv.display_name)}
                        required={required || schema?.required}
                        allowMultiple={true}
                        cvName={cv._id}
                        sortable={true}
                        getOptions={() => cv.items.map((item: ISubject) => ({value: {...item, scheme: cv._id}}))}
                        getId={(item: ISubject) => item.qcode}
                        getLabel={(item: ISubject) => (
                            getVocabularyItemNameFromString(
                                item.qcode,
                                cv.items,
                                'qcode',
                                'name',
                                language
                            )
                        )}
                        onChange={onChange}
                        errors={errors}
                    />
                </Row>
            );
        });
    }
}

export const EditorFieldCustomVocabularies = connect(mapStateToProps)(CustomVocabulariesComponent);
