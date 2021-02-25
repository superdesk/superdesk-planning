export function getVocabularyItemFieldTranslated(
    item: {
        translations?: {[key: string]: any},
        [key: string]: any,
    } | null,
    field: string,
    language?: string,
    fallbackField?: string
): string {
    if (item?.[field] == null && item?.[fallbackField] == null) {
        return null;
    } else if (language == null) {
        return item[field] ?? item[fallbackField];
    }

    function getTranslation(lookupField: string) {
        return item.translations?.[lookupField]?.[language.replace('-', '_')] ??
            item.translations?.[lookupField]?.[language.replace('_', '-')];
    }

    return item.translations?.[field]?.[language] ??
        getTranslation(field) ??
        getTranslation(fallbackField) ??
        item[field] ??
        item[fallbackField];
}

export function getVocabularyItemNames<T>(
    selected: Array<T>,
    options: Array<T>,
    valueField: keyof T,
    nameField: keyof T,
    language: string
): Array<string> {
    if (!selected?.length) {
        return [];
    }

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
