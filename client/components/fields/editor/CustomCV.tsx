import * as React from 'react';

import {ISubject} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {Row} from '../../UI/Form';
import {getVocabularyItemFieldTranslated} from '../../../utils/vocabularies';
import {TreeSelect} from 'superdesk-ui-framework/react';
import {ICustomCVFieldProps} from './CustomCV.interface';
import {get, isEqual, omit} from 'lodash';

export class EditorFieldCV extends React.Component<ICustomCVFieldProps> {
    shouldComponentUpdate(nextProps: Readonly<ICustomCVFieldProps>): boolean {
        const cv = superdeskApi.entities.vocabulary.getVocabulary(this.props.field);

        const prevValue = (get(this.props.item, this.props.storageField ?? 'subject') ?? [])
            .filter((x) => x.scheme === cv._id);
        const nextValue = (get(nextProps.item, nextProps.storageField ?? 'subject') ?? [])
            .filter((x) => x.scheme === cv._id);

        const valueChanged = !isEqual(prevValue, nextValue);

        const prevPropsFiltered = omit(this.props, 'onChange', 'popupContainer', 'item');
        const nextPropsFiltered = omit(nextProps, 'onChange', 'popupContainer', 'item');
        const otherPropsChanged = !isEqual(prevPropsFiltered, nextPropsFiltered);

        return valueChanged || otherPropsChanged;
    }

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
            storageField,
        } = this.props;

        const cv = superdeskApi.entities.vocabulary.getVocabulary(this.props.field);

        if (cv.selection_type === 'do not show') {
            return null;
        }

        return (
            <Row
                key={cv._id}
                id={`form-row-${cv.display_name}`}
                testId={testId?.length ? testId : cv._id}
            >
                <TreeSelect
                    selectBranchWithChildren={cv.disable_entire_category_selection !== true}
                    sortable={true}
                    kind="synchronous"
                    allowMultiple={cv.selection_type === 'multi selection'}
                    value={(get(item, storageField ?? 'subject') ?? []).filter((x) => x.scheme === cv._id)}
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
                    onChange={(vocabularyItemsNext) => {
                        const itemsFromOtherVocabularies = (get(item, storageField ?? 'subject') ?? [])
                            .filter((x) => x.scheme !== cv._id);

                        onChange(
                            storageField ?? 'subject',
                            [...itemsFromOtherVocabularies, ...vocabularyItemsNext],
                        );
                    }}
                    tabindex={0}
                />
            </Row>
        );
    }
}
