import * as React from 'react';
import {connect} from 'react-redux';

import {ISubject, IVocabulary} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps, IProfileSchemaTypeList} from '../../../interfaces';
import {Row} from '../../UI/Form';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {arrayToTree} from 'superdesk-core/scripts/core/helpers/tree';
import {TreeSelect} from 'superdesk-ui-framework/react';

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
            disabled,
            invalid,
        } = this.props;

        const customVocabularies = vocabularies.filter((cv) =>
            (schema?.vocabularies ?? []).includes(cv._id)
        );

        return customVocabularies.map((cv) => {
            const cvFieldName = `custom_vocabularies.${cv._id}`;
            const itemFieldName = cv.schema_field ?? 'subject';

            return (
                <Row
                    key={cv._id}
                    id={`form-row-${cvFieldName}`}
                    data-test-id={testId?.length ? `${testId}.${cv._id}` : cv._id}
                >
                    <TreeSelect
                        sortable={true}
                        kind="synchronous"
                        allowMultiple={true}
                        value={(item.subject ?? []).filter((x) => x.scheme === cv._id)}
                        label={gettext(cv.display_name)}
                        required={required ?? schema?.required}
                        getOptions={() => arrayToTree(
                            cv.items.map((cvItem) => ({
                                ...cvItem,
                                scheme: cv._id,
                            })) as Array<ISubject>,
                            ({qcode}) => qcode.toString(),
                            ({parent}) => parent?.toString(),
                        ).result}
                        getLabel={(item) => getVocabularyItemFieldTranslated(
                            item,
                            'name',
                            language,
                        )}
                        getId={(item) => item.qcode}
                        invalid={errors?.length > 0 || invalid}
                        error={showErrors ? errors[itemFieldName] : undefined}
                        readOnly={disabled}
                        disabled={disabled}
                        onChange={(vals) => {
                            const restOfItems = (item.subject ?? []).filter((x) => x.scheme !== cv._id);

                            onChange(
                                'subject',
                                [...restOfItems, ...vals],
                            );
                        }}
                        tabindex={0}
                        zIndex={1051}
                    />
                </Row>
            );
        });
    }
}

export const EditorFieldCustomVocabularies = connect(mapStateToProps)(CustomVocabulariesComponent);
