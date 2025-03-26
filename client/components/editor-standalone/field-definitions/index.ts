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
import {getOccurrenceStatusField} from './occurrence-status';
import {getLanguageField} from './language';
import {getCalendarsField} from './calendars';
import {getEventDateField} from './event-dates';
import {getRecurringRulesField} from './recurring-rules';
import {getAccreditationDeadline} from './accreditation-deadline';

export function getFieldDefinitions(profileType: 'event' | 'planning'): IFieldDefinitions {
    const {gettext} = superdeskApi.localization;

    const result: Array<IFieldDefinition> = [
        {
            fieldId: 'ednote',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Ed Note')}),
        },
        {
            fieldId: 'internal_note',
            getField: (props) =>
                getTextFieldConfig({...props, label: gettext('Internal Note')}),
        },
        {
            fieldId: 'name',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Name')}),
        },
        {
            fieldId: 'slugline',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Slugline')}),
        },
        {
            fieldId: 'description_text',
            getField: (props) =>
                getTextFieldConfig({...props, label: gettext('Description')}),
        },
        {
            fieldId: 'headline',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Headline')}),
        },
        {
            fieldId: 'references',
            getField: (props) => getTextFieldConfig({...props, label: gettext('External Reference')}),
        },
        {
            fieldId: 'definition_short',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Description')}),
        },
        {
            fieldId: 'invitation_details',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Invitation Details')}),
        },
        {
            fieldId: 'accreditation_info',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Accreditation Info')}),
        },
        {
            fieldId: 'registration_details',
            getField: (props) => getTextFieldConfig({...props, label: gettext('Registration Details')}),
        },
        getEventDateField(),
        getCalendarsField(),
        getLanguageField(),
        getOccurrenceStatusField(),
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
