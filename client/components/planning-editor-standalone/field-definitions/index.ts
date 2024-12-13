import {
    IAttachmentsFieldConfig,
} from '../../../planning-extension/src/authoring-react-fields/planning-attachments/interfaces';
import {
    IAuthoringFieldV2,
    ICommonFieldConfig,
} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {getCustomVocabularyFields} from '../field-adapters/custom-vocabularies';
import {getDateTimeField} from './date-time-config';
import {IFieldDefinitions, IFieldDefinition} from './interfaces';
import {getTextFieldConfig} from './text-field-config';
import {getPlaceField} from './place-field';
import {getAgendasField} from './agendas-field';
import {getSubjectField} from './subject';

export function getFieldDefinitions(): IFieldDefinitions {
    const {gettext} = superdeskApi.localization;
    const result: Array<IFieldDefinition> = [
        {
            fieldId: 'ednote',
            getField: ({required, id}) => getTextFieldConfig({id: id, label: gettext('Ed Note'), required: required}),
        },
        {
            fieldId: 'internal_note',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Internal Note'), required: required}),
        },
        {
            fieldId: 'name',
            getField: ({required, id}) => getTextFieldConfig({id: id, label: gettext('Name'), required: required}),
        },
        {
            fieldId: 'slugline',
            getField: ({required, id}) => getTextFieldConfig({id: id, label: gettext('Slugline'), required: required}),
        },
        {
            fieldId: 'description_text',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Description'), required: required}),
        },
        {
            fieldId: 'headline',
            getField: ({required, id}) => getTextFieldConfig({id: id, label: gettext('Headline'), required: required}),
        },
        {
            fieldId: 'planning_date',
            getField: ({required, id}) =>
                getDateTimeField({id: id, label: gettext('Planning date'), required: required}),
        },
        {
            fieldId: 'files',
            getField: ({required, id}) => {
                const fieldConfig: IAttachmentsFieldConfig = {
                    required,
                };

                const field: IAuthoringFieldV2 = {
                    id: id,
                    name: gettext('Attached files'),
                    fieldType: 'files',
                    fieldConfig: fieldConfig,
                };

                return field;
            },
        },
        getPlaceField(),
        getAgendasField(),
        getSubjectField(),
        {
            fieldId: 'coverages',
            getField: ({id, required}) => {
                const fieldConfig: ICommonFieldConfig = {
                    required,
                };

                const field: IAuthoringFieldV2 = {
                    id: id,
                    name: gettext('Coverages'),
                    fieldType: 'coverages',
                    fieldConfig: fieldConfig,
                };

                return field;
            },
        }
    ];

    result.push(
        ...getCustomVocabularyFields(),
    );

    const resultObj = result.reduce((acc, item) => {
        acc[item.fieldId] = item;

        return acc;
    }, {} as IFieldDefinitions);

    return resultObj;
}
