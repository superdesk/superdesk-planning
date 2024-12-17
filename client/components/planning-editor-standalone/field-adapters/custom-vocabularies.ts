import {IDropdownConfigVocabulary, IAuthoringFieldV2, ISubject, IVocabularyItem} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';
import {IFieldDefinition} from '../field-definitions/interfaces';
import {getPlanningProfileFields} from '../profile-fields';

export const getCustomVocabularyFields = () => {
    const customVocabularyIds = getPlanningProfileFields()
        .filter((x) => x.type === 'custom_vocabulary')
        .map(({vocabularyId}) => vocabularyId);
    const result: Array<IFieldDefinition> = [];

    if ((customVocabularyIds?.length ?? 0) > 0) {
        const allVocabularies = superdeskApi.entities.vocabulary.getAll();

        for (const id of customVocabularyIds) {
            const vocabulary = allVocabularies.get(id);

            result.push({
                fieldId: id,
                getField: ({required, id: _id}) => {
                    const fieldConfig: IDropdownConfigVocabulary = {
                        source: 'vocabulary',
                        vocabularyId: id,
                        multiple: true,
                        required: required,
                    };

                    const field: IAuthoringFieldV2 = {
                        id: _id,
                        name: vocabulary.display_name,
                        fieldType: 'dropdown',
                        fieldConfig: fieldConfig,
                    };

                    return field;
                },
                storageAdapter: {
                    storeValue: (item, operationalValue: IVocabularyItem['qcode']) => {
                        const vocabulary = allVocabularies.get(id);
                        const vocabItems = vocabulary.items.filter((x) => operationalValue.includes(x.qcode));

                        // Subfield values
                        const itemsToSubject: Array<ISubject> = vocabItems.map((x) => ({
                            name: x.name,
                            qcode: x.qcode,
                            scheme: vocabulary._id,
                        }));

                        // Remove values that don't match the "subfield" ID, so there's no item duplication
                        const restOfValues = (item.subject ?? []).filter((x) => x.scheme !== id);

                        return {
                            ...item,
                            subject: [
                                ...itemsToSubject,
                                ...restOfValues,
                            ],
                        };
                    },
                    retrieveStoredValue: (item) => {
                        return (item.subject ?? []).filter((x) => x.scheme === id).map((x) => x.qcode);
                    },
                }
            });
        }
    }

    return result;
};
