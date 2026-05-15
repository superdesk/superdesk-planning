import {appConfig} from 'appConfig';
import {gettext} from './index';

type IUploadMethod = 'POST' | 'PATCH';

interface IUploadService {
    start(config: Record<string, any>): Promise<{data: any}>;
}

interface IUploadPromise<T> extends Promise<T> {
    abort?: () => void;
}

export interface IUploadOptions {
    onProgress?: (event: ProgressEvent) => void;
    timeoutMs?: number;
    retries?: number;
    retryDelayMs?: number;
    method?: IUploadMethod;
    etag?: string;
}

const DEFAULT_TIMEOUT_MS = 90000;
const DEFAULT_RETRY_DELAY_MS = 500;

function wait(ms: number) {
    return new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createUploadError(message: string, extra: Record<string, unknown> = {}) {
    return Object.assign(new Error(message), extra);
}

function isRetryableUploadError(error: any) {
    return error?.timeout === true || error?.retryable === true || error?.status >= 500;
}

function buildUploadConfig(endpoint: string, file: File | Array<File>, method: IUploadMethod, etag?: string) {
    const headers: Record<string, string> = {'Content-Type': 'multipart/form-data'};
    const data = {media: [file]};

    if (method === 'PATCH' && etag != null) {
        headers['If-Match'] = etag;
    }

    return {
        method: method,
        url: appConfig.server.url + endpoint,
        headers: headers,
        data: data,
        arrayKey: '',
    };
}

async function uploadOnce<T>(
    upload: IUploadService,
    endpoint: string,
    file: File | Array<File>,
    options: Required<Pick<IUploadOptions, 'method' | 'timeoutMs'>> & Pick<IUploadOptions, 'onProgress' | 'etag'>,
): Promise<T> {
    const uploadPromise = upload.start(
        buildUploadConfig(endpoint, file, options.method, options.etag)
    ) as IUploadPromise<{data: any}>;

    return await new Promise<T>((resolve, reject) => {
        let settled = false;

        const timeoutId = setTimeout(() => {
            settled = true;

            if (typeof uploadPromise.abort === 'function') {
                uploadPromise.abort();
            }

            reject(createUploadError(gettext('Upload timed out.'), {timeout: true}));
        }, options.timeoutMs);

        if (options.onProgress != null) {
            uploadPromise.then(undefined, undefined, options.onProgress);
        }

        uploadPromise.then((response) => {
            if (settled) {
                return;
            }

            clearTimeout(timeoutId);
            resolve(response.data);
        }, (error) => {
            if (settled) {
                return;
            }

            clearTimeout(timeoutId);
            reject(error);
        });
    });
}

export async function uploadFileWithRetry<T>(
    upload: IUploadService,
    endpoint: string,
    file: File | Array<File>,
    options: IUploadOptions = {},
): Promise<T> {
    const {timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, retryDelayMs = DEFAULT_RETRY_DELAY_MS} = options;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            const etag = options.etag;

            return await uploadOnce<T>(upload, endpoint, file, {
                method: options.method ?? 'POST',
                etag: etag,
                onProgress: options.onProgress,
                timeoutMs: timeoutMs,
            });
        } catch (error) {
            if (attempt < retries && isRetryableUploadError(error)) {
                await wait(retryDelayMs * (attempt + 1));
            } else {
                throw error;
            }
        }
    }

    throw createUploadError('Upload failed unexpectedly.');
}
