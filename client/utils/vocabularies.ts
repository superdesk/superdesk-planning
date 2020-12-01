export function getVocabularyItemFieldTranslated(
    item: {[key: string]: any},
    field: string,
    language?: string
): string {
    if (language == null) {
        return item[field];
    }

    return item.translations?.[field]?.[language] ??
        item.translations?.[field]?.[language.replace('-', '_')] ??
        item.translations?.[field]?.[language.replace('_', '-')] ??
        item[field];
}
