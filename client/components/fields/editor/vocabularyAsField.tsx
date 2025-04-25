import * as React from 'react';

import {ISubject} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {Row} from '../../UI/Form';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {TreeSelect} from 'superdesk-ui-framework/react';

export class EditorFieldCV extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const {
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

        const cv = superdeskApi.entities.vocabulary.getVocabulary(this.props.field);

        if (cv?._id === undefined) {
            return null;
        }

        return (
            <Row
                key={cv._id}
                id={`form-row-${cv.display_name}`}
                data-test-id={testId?.length ? `${testId}.${cv._id}` : cv._id}
            >
                <TreeSelect
                    selectBranchWithChildren
                    sortable={true}
                    kind="synchronous"
                    allowMultiple={true}
                    value={(item.subject ?? []).filter((x) => x.scheme === cv._id)}
                    label={gettext(cv.display_name)}
                    required={required}
                    getOptions={() => superdeskApi.utilities.arrayToTree(
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
                    error={showErrors ? errors[this.props.field] : undefined}
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
                />
            </Row>
        );
    }
}
