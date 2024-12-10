import {IProfileSchemaTypeList} from 'interfaces';
import {IDropdownConfigVocabulary, IAuthoringFieldV2, ISubject, IVocabularyItem} from 'superdesk-api';
import {planningApi, superdeskApi} from 'superdeskApi';
import {IFieldDefinition} from '../profile';

export const SUBJECT_PREFIX_ID = 'subject--';
const getCustomVocabulariesId = (vocabularyId: string) => `${SUBJECT_PREFIX_ID}${vocabularyId}`;
const getStrippedCustomVocabularyId = (customVocabularyId: string) => customVocabularyId.replace(SUBJECT_PREFIX_ID, '');

export const getCustomVocabularyFields = () => {
    const planningProfile = planningApi.contentProfiles.get('planning');
    const customVocabularyIds =
        (planningProfile.schema?.['custom_vocabularies'] as IProfileSchemaTypeList)?.vocabularies;
    const result: Array<IFieldDefinition> = [];

    if ((customVocabularyIds?.length ?? 0) > 0) {
        const allVocabularies = superdeskApi.entities.vocabulary.getAll();

        for (const id of customVocabularyIds) {
            result.push({
                fieldId: getCustomVocabulariesId(id),
                getField: ({required, id: _id}) => {
                    const fieldConfig: IDropdownConfigVocabulary = {
                        source: 'vocabulary',
                        vocabularyId: id,
                        multiple: true,
                        required: required,
                    };

                    const field: IAuthoringFieldV2 = {
                        id: _id,
                        name: id,
                        fieldType: 'dropdown',
                        fieldConfig: fieldConfig,
                    };

                    return field;
                },
                storageAdapter: {
                    storeValue: (item, operationalValue: {
                        existing: Array<ISubject>;
                        fieldId: string;
                        value?: Array<IVocabularyItem['qcode']>;
                    }) => {
                        const {existing = [], fieldId, value = []} = operationalValue;
                        const strippedId = getStrippedCustomVocabularyId(fieldId);
                        const vocabulary = allVocabularies.get(strippedId);
                        const vocabItems = vocabulary.items.filter((x) => value?.includes(x.qcode)) ?? [];

                        // Subfield values
                        const itemsToSubject: Array<ISubject> = vocabItems.map((x) => ({
                            name: x.name,
                            qcode: x.qcode,
                            scheme: vocabulary._id,
                        }));

                        // Remove values that don't match the "subfield" ID, so there's no item duplication
                        const restOfValues = existing.filter((x) => x.scheme !== strippedId);

                        return {
                            ...item,
                            subject: [
                                ...itemsToSubject,
                                ...restOfValues,
                            ],
                        };
                    },
                    retrieveStoredValue: (storageValue: {fieldId: string; subject: Array<ISubject>;}) => {
                        const {fieldId, subject = []} = storageValue;
                        const strippedId = getStrippedCustomVocabularyId(fieldId);

                        return subject.filter((x) => x.scheme === strippedId).map((x) => x.qcode);
                    },
                }
            });
        }
    }

    return result;
};
