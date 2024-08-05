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
            disabled,
            onChange,
            required,
            testId,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            language,
        } = this.props;

        const customVocabularies = vocabularies.filter((cv) =>
            (schema?.vocabularies ?? []).includes(cv._id)
        );

        return customVocabularies.map((cv) => {
            const cvFieldName = `custom_vocabularies.${cv._id}`;
            const error = showErrors ? errors?.[cvFieldName] : undefined;
            const parentField = cv.schema_field || 'subject';

            return (
                <Row
                    key={cv._id}
                    id={`form-row-${cvFieldName}`}
                    data-test-id={testId?.length ? `${testId}.${cv._id}` : cv._id}
                >
                    {!schema.sortable ? (
                        <SelectMetaTermsInput
                            options={cv.items.map((item) => Object.assign({scheme: cv._id}, item))}
                            value={item[parentField]}
                            label={gettext(cv.display_name)}
                            readOnly={disabled}
                            onChange={onChange}
                            required={required || schema?.required}
                            field={parentField}
                            scheme={cv._id}
                            popupContainer={popupContainer}
                            onPopupOpen={onPopupOpen}
                            onPopupClose={onPopupClose}
                            language={language}
                            invalid={!!error}
                            message={error}
                            noMargin={true}
                        />
                    ) : (
                        <EditorFieldTreeSelect
                            item={item}
                            field={parentField}
                            label={gettext(cv.display_name)}
                            required={required || schema?.required}
                            allowMultiple={true}
                            sortable={true}
                            getOptions={() => cv.items.map((item: ISubject) => ({value: item}))}
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
                    )}
                </Row>
            );
        });
    }
}

export const EditorFieldCustomVocabularies = connect(mapStateToProps)(CustomVocabulariesComponent);
