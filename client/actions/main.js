
export const EDIT = 'EDIT';
export function edit(item) {
    return {
        type: EDIT,
        item: item
    };
}

export function cancel() {
    return edit(null);
}

export const PREVIEW = 'PREVIEW';
export function preview(item) {
    return {
        type: PREVIEW,
        item: item
    };
}
