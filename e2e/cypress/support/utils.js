
export function constructUrl(base, uri) {
    return base.replace(/\/$/, '') + uri;
}
