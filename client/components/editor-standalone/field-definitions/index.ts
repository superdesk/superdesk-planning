import {
    IAttachmentsFieldConfig,
} from '../../../planning-extension/src/authoring-react-fields/planning-attachments/interfaces';
import {
    IAuthoringFieldV2,
    ICommonFieldConfig,
} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {getCustomVocabularyFields} from '../field-adapters/custom-vocabularies';
import {getPlanningDate} from './planning-date';
import {IFieldDefinitions, IFieldDefinition} from './interfaces';
import {getTextFieldConfig} from './text-field-config';
import {getPlaceField} from './place-field';
import {getCategoriesField} from './category-field';
import {getAgendasField} from './agendas-field';
import {getSubjectField} from './subject';
import {getPriorityField} from './priority-field';
import {getLocationsField} from './locations-field';
import {getLinksField} from './link-field';
import {getContactsField} from './contacts';
import {getOccurStatusField} from './occurence-status';
import {getLanguagesField} from './languages';
import {getCalendarsField} from './calendars';
import {getAllDayDatesField} from './all-day';
import {getRecurringRulesField} from './recurring-rules';
import {getAccreditationDeadline} from './accreditation-deadline';

export function getFieldDefinitions(profileType: 'event' | 'planning'): IFieldDefinitions {
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
        {
            fieldId: 'references',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('External Reference'), required: required}),
        },
        {
            fieldId: 'definition_short',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Description'), required: required}),
        },
        {
            fieldId: 'invitation_details',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Invitation Details'), required: required}),
        },
        {
            fieldId: 'accreditation_info',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Accreditation Info'), required: required}),
        },
        {
            fieldId: 'registration_details',
            getField: ({required, id}) =>
                getTextFieldConfig({id: id, label: gettext('Registration Details'), required: required}),
        },
        getAllDayDatesField(),
        getCalendarsField(),
        getLanguagesField(),
        getOccurStatusField(),
        getRecurringRulesField(),
        getAccreditationDeadline(),
        getPlanningDate(),
        getPlaceField(),
        getAgendasField(),
        getSubjectField(),
        getCategoriesField(),
        getContactsField(),
        getPriorityField(),
        getLinksField(),
        getLocationsField(),
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
        ...getCustomVocabularyFields(profileType),
    );

    const resultObj = result.reduce((acc, item) => {
        acc[item.fieldId] = item;

        return acc;
    }, {} as IFieldDefinitions);

    return resultObj;
}
