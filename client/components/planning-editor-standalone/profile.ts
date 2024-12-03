import {OrderedMap} from 'immutable';

import {
    IAuthoringFieldV2,
    IContentProfileV2,
    IDateTimeFieldConfig,
    IEditor3Config,
} from 'superdesk-api';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {getEditorFormGroupsFromProfile} from '../../utils/contentProfiles';

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

// function getVocabularyRemoteSourceConfig(options: {id: string; label: string, required: boolean}): IAuthoringFieldV2 {
//     const config: IDropdownConfig = {
//         source: 'remote-source',
//         getId: (item: ILocation) => item._id,
//         getLabel: (item: ILocation) => item.name,
//         multiple: false,
//         searchOptions: (
//             searchTerm,
//             language,
//             callback,
//         ) => {
//             return planningApi.locations.searchExternal(searchTerm, language).then((x) => {
//                 const tree: ITreeWithLookup<Partial<ILocation>> = {
//                     nodes: x.map((location) => ({value: location})),
//                     lookup: {},
//                 };

//                 callback(tree);
//             });
//         },
//     };

//     const field: IAuthoringFieldV2 = {
//         id: options.id,
//         name: options.label,
//         fieldType: 'dropdown',
//         fieldConfig: {
//             ...config,
//             required: options.required,
//         },
//     };

//     return field;
// }

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

export function getProfile() {
    const planningProfile = planningApi.contentProfiles.get('planning');
    const planningGroups = getEditorFormGroupsFromProfile(planningProfile);
    const planningFieldIds = Object.values(planningGroups).flatMap(({fields}) => fields);
    const {gettext} = superdeskApi.localization;

    const profileV2: IContentProfileV2 = {
        id: 'not-used',
        name: 'not-used',
        content: OrderedMap([]),
        header: OrderedMap(),
    };

    const skipped = [];

    for (const fieldId of planningFieldIds) {
        const required = planningProfile.schema?.[fieldId]?.required ?? false;

        // TEXT FIELDS

        if (fieldId === 'ednote') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Ed Note'), required: required}),
            );
        } else if (fieldId === 'internal_note') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Internal Note'), required: required}),
            );
        } else if (fieldId === 'name') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Name'), required: required}),
            );
        } else if (fieldId === 'slugline') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Slugline'), required: required}),
            );
        } else if (fieldId === 'description_text') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Description'), required: required}),
            );
        } else if (fieldId === 'headline') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getTextFieldConfig({id: fieldId, label: gettext('Headline'), required: required}),
            );
        } else if (fieldId === 'files') {
            const fieldConfig = {};

            const field: IAuthoringFieldV2 = {
                id: fieldId,
                name: gettext('Attached files'),
                fieldType: 'files',
                fieldConfig: fieldConfig,
            };

            profileV2.header = profileV2.header.set(
                fieldId,
                field,
            );
        } else if (fieldId === 'planning_date') {
            profileV2.header = profileV2.header.set(
                fieldId,
                getDateTimeField({
                    id: fieldId,
                    label: gettext('Planning date'),
                    required: required,
                }),
            );
        }

        // TODO: Do only events have location as a field that can be configured?
        // else if (fieldId === 'location') {
        //     profileV2.content = profileV2.content.set(
        //         fieldId,
        //         getVocabularyRemoteSourceConfig({
        //             id: 'location',
        //             label: gettext('Location'),
        //             required: required,
        //         }),
        //     );
        // }

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
        else {
            skipped.push(fieldId);
        }
    }

    profileV2.header.forEach((item) => {
        item.fieldConfig.width = 100;
    });

    console.log('skipped -------------------------------- ', skipped, superdeskApi.entities.vocabulary.getAll());

    return profileV2;
}
