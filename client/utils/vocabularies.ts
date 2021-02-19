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
    const values = selected.map((item) => item[valueField]);

    return options
        .filter((item) => values.includes(item[valueField]))
        .map((item) => getVocabularyItemFieldTranslated(
            item,
            nameField as string,
            language,
        ));
}

export function getVocabularyItemName<T>(
    selected: T | null,
    options: Array<T>,
    valueField: keyof T,
    nameField: keyof T,
    language: string
): string | null {
    if (selected == null) {
        return null;
    }

    const value = selected[valueField];

    const item = options.find((item) => item[valueField] === value);

    return item == undefined ?
        undefined :
        getVocabularyItemFieldTranslated(
            item,
            nameField as string,
            language
        );
}

export function getVocabularyItemNameFromString<T>(
    selected: any,
    options: Array<T>,
    valueField: keyof T,
    nameField: keyof T,
    language: string
): string | null {
    if (selected == null) {
        return null;
    }

    const item = options.find((item) => item[valueField] === selected);

    return item == undefined ?
        undefined :
        getVocabularyItemFieldTranslated(
            item,
            nameField as string,
            language
        );
}
