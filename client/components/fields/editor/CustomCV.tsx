import * as React from 'react';

import {ISubject} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IEditorFieldProps} from '../../../interfaces';
import {Row} from '../../UI/Form';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {TreeSelect} from 'superdesk-ui-framework/react';

export class EditorFieldCV extends React.PureComponent<IEditorFieldProps> {
    render() {
        const {
            showErrors,
            errors,
            item,
            onChange,
            testId,
            language,
            disabled,
            invalid,
        } = this.props;
        const cv = superdeskApi.entities.vocabulary.getVocabulary(this.props.field);

        if (cv.selection_type === 'do not show') {
            return null;
        }

        return (
            <Row
                key={cv._id}
                id={`form-row-${cv.display_name}`}
                data-test-id={testId?.length ? `${testId}.${cv._id}` : cv._id}
            >
                <TreeSelect
                    selectBranchWithChildren={
                        cv.disable_entire_category_selection == null
                            ? true
                            : cv.disable_entire_category_selection
                    }
                    sortable={true}
                    kind="synchronous"
                    allowMultiple={cv.selection_type === 'multi selection'}
                    value={(item.subject ?? []).filter((x) => x.scheme === cv._id)}
                    label={cv.translations?.display_name?.[language] ?? cv.display_name}
                    required={this.props.schema.required}

                    // map to specific properties so backend schema check doesn't fail
                    getOptions={() =>
                        superdeskApi.utilities.arrayToTree(
                            cv.items.map((cvItem) => ({
                                name: cvItem.name,
                                qcode: cvItem.qcode,
                                scheme: cv._id,
                                parent: cvItem.parent,
                                service: cvItem.service,
                            })) as Array<ISubject>,
                            ({qcode}) => qcode.toString(),
                            ({parent}) => parent?.toString(),
                        ).result
                    }
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
