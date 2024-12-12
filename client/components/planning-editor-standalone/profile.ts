import {OrderedMap} from 'immutable';

import {
    IAuthoringFieldV2,
    ICommonFieldConfig,
    IContentProfileV2,
    IDateTimeFieldConfig,
    IDropdownConfigVocabulary,
    IEditor3Config,
    IVocabularyItem,
} from 'superdesk-api';
import {superdeskApi} from '../../superdeskApi';
import {
    IAttachmentsFieldConfig,
} from '../../planning-extension/src/authoring-react-fields/planning-attachments/interfaces';
import {getCustomVocabularyFields} from './field-adapters/custom-vocabularies';
import {getPlanningProfileFields} from './profile-fields';
import {IEventOrPlanningItem} from 'interfaces';

function getTextFieldConfig(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
    const editor3ConfigWithoutFormatting: IEditor3Config = {
        editorFormat: [],
        minLength: undefined,
        maxLength: undefined,
        cleanPastedHtml: false,
        singleLine: true,
        disallowedCharacters: [],
        showStatistics: false,
        width: 100,
    };

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'editor3',
        fieldConfig: {
            ...editor3ConfigWithoutFormatting,
            required: options.required,
        },
    };

    return field;
}

function getDateTimeField(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
    const config: IDateTimeFieldConfig = {
        allowSeconds: false,
    };

    const field: IAuthoringFieldV2 = {
        id: options.id,
        name: options.label,
        fieldType: 'datetime',
        fieldConfig: {
            ...config,
            required: options.required,
        },
    };

    return field;
}

export interface IFieldDefinition {
    fieldId: string;
    getField: (options: {required: boolean, id: string}) => IAuthoringFieldV2;
    storageAdapter?: {
        storeValue: <T extends IEventOrPlanningItem>(item: T, operationalValue: unknown) => T; // returns stored value
        retrieveStoredValue:
            <T extends IEventOrPlanningItem>(item: T, fieldId: string) => unknown; // returns operational value
    };
}

type IFieldDefinitions = {[fieldId: string]: IFieldDefinition};

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
        {
            fieldId: 'place',
            getField: ({id, required}) => {
                const fieldConfig: IDropdownConfigVocabulary = {
                    source: 'vocabulary',
                    vocabularyId: 'locators',
                    multiple: true,
                    required: required,
                };

                const field: IAuthoringFieldV2 = {
                    id: id,
                    name: gettext('Place'),
                    fieldType: 'dropdown',
                    fieldConfig: fieldConfig,
                };

                return field;
            },
            storageAdapter: {
                storeValue: (item, operationalValue: Array<string>) => {
                    const vocabulary = superdeskApi.entities.vocabulary.getAll().get('locators');
                    const vocabularyItems = new Map<IVocabularyItem['qcode'], IVocabularyItem>(
                        vocabulary.items.map((item) => [item.qcode, item]),
                    );

                    return {
                        ...item,
                        place: operationalValue.map((qcode) => vocabularyItems.get(qcode)),
                    };
                },
                retrieveStoredValue: (item, fieldId) => item[fieldId].map(({qcode}) => qcode),
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
        ...getCustomVocabularyFields(),
    );

    const resultObj = result.reduce((acc, item) => {
        acc[item.fieldId] = item;

        return acc;
    }, {} as IFieldDefinitions);

    return resultObj;
}

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
