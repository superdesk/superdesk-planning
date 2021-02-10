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

export function getVocabularyItemNames<T>(
    selected: Array<T>,
    options: Array<T>,
    valueField: keyof T,
    nameField: keyof T,
    language: string
): Array<string> {
    const qcodes = selected.map((calendar) => calendar[valueField]);

    return options
        .filter((calendar) => qcodes.includes(calendar[valueField]))
        .map((calendar) => getVocabularyItemFieldTranslated(
            calendar,
            nameField as string,
            language,
        ));
}
