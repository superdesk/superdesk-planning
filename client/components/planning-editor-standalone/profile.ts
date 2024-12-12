import {OrderedMap} from 'immutable';

import {IContentProfileV2} from 'superdesk-api';
import {getPlanningProfileFields} from './profile-fields';
import {getFieldDefinitions} from './field-definitions/index';

export function getProfile() {
    const planningFieldIds = getPlanningProfileFields();
    const skipped = new Set<string>();
    const fieldDefinitions = getFieldDefinitions();
    const profileV2: IContentProfileV2 = {
        id: 'not-used',
        name: 'not-used',
        content: OrderedMap([]),
        header: OrderedMap(),
    };

    for (const {fieldId, required} of planningFieldIds) {
        if (fieldDefinitions[fieldId] != null) {
            profileV2.header = profileV2.header.set(
                fieldId,
                fieldDefinitions[fieldId].getField({id: fieldId, required: required}),
            );
        } else {
            skipped.add(fieldId);
        }
    }

    profileV2.header.forEach((item) => {
        item.fieldConfig.width = 100;
    });

    // PR-TODO: remove comment
    console.log('skipped -------------------------------- ', skipped);

    return profileV2;
}

// else if (fieldId === 'language') {
//     const languageFieldConfig: IDropdownConfigVocabulary = {
//         source: 'vocabulary',
//         vocabularyId: 'languages',
//         multiple: false,
//         width: 100,
//     };

//     const languageField: IAuthoringFieldV2 = {
//         id: 'language',
//         name: superdeskApi.entities.vocabulary.getAll().get('languages').display_name,
//         fieldType: 'dropdown',
//         fieldConfig: languageFieldConfig,
//     };

//     profileV2.header = profileV2.header.set(languageField.id, languageField);
// } else if (fieldId === 'planning_date') {
//     const planningDateConfig: IDateFieldConfig = {
//         // placeholder
//     };

//     // PR-TODO: convert to date-time
//     const planningDateField: IAuthoringFieldV2 = {
//         id: 'planning_date',
//         name: gettext('Planning date'),
//         fieldType: 'date',
//         fieldConfig: planningDateConfig,
//     };

//     profileV2.header = profileV2.header.set(planningDateField.id, planningDateField);
// } else if (fieldId == 'description_text') {
//     profileV2.header = profileV2.header.set(
//         'description_text',
//         getTextFieldConfig({id: 'description_text', label: gettext('Description')}),
//     );
// } else if (fieldId === 'internal_note') {
//     profileV2.header = profileV2.header.set(
//         'internal_note',
//         getTextFieldConfig({id: 'internal_note', label: gettext('Internal note')}),
//     );
// } else if (fieldId === 'internal_note') {
//     profileV2.header = profileV2.header.set(
//         'internal_note',
//         getTextFieldConfig({id: 'internal_note', label: gettext('Internal note')}),
//     );
// } else if (fieldId === 'urgency') {
//     const vocabulary = superdeskApi.entities.vocabulary.getAll().get('urgency');

//     // HAS TO BE SYNCED WITH styles/sass/labels.scss
//     var defaultUrgencyColors = {
//         0: '#cccccc',
//         1: '#01405b',
//         2: '#005e84',
//         3: '#3684a4',
//         4: '#64a4bf',
//         5: '#a1c6d8',
//     };

//     const urgencyFieldConfig: IDropdownConfigManualSource = {
//         source: 'manual-entry',
//         type: 'number',
//         options: vocabulary.items.map(({name, qcode, color}) => {
//             const option: IDropdownConfigManualSource['options'][0] = {
//                 id: qcode,
//                 label: name,
//                 color: color ?? defaultUrgencyColors[name] ?? undefined,
//             };

//             return option;
//         }),
//         roundCorners: true,
//         multiple: false,
//     };

//     const urgencyField: IAuthoringFieldV2 = {
//         id: 'urgency',
//         name: gettext('Urgency'),
//         fieldType: 'dropdown',
//         fieldConfig: urgencyFieldConfig,
//     };

//     profileV2.header = profileV2.header.set(urgencyField.id, urgencyField);
// } else if (fieldId === 'anpa_category') {
//     const vocabulary = superdeskApi.entities.vocabulary.getAll().get('categories');
//     const multiple = true;

//     const categoryFieldConfig: IDropdownConfigVocabulary = {
//         source: 'vocabulary',
//         vocabularyId: 'categories',
//         multiple: multiple,
//     };

//     const categoryField: IAuthoringFieldV2 = {
//         id: 'anpa_category',
//         name: vocabulary.display_name,
//         fieldType: 'dropdown',
//         fieldConfig: categoryFieldConfig,
//     };

//     profileV2.header = profileV2.header.set(categoryField.id, categoryField);
// }
//     else {
//         skipped.push(fieldId);
//     }
// }

//     profileV2.header.forEach((item) => {
//         item.fieldConfig.width = 100;
//     });

//     console.log('skipped -------------------------------- ', skipped, superdeskApi.entities.vocabulary.getAll());

//     return profileV2;
// }
