import ng from 'core/services/ng';

import {appConfig} from 'appConfig';

type IUploadMethod = 'POST' | 'PATCH';

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
        window.setTimeout(resolve, ms);
    });
}

function createUploadError(message: string, extra: Record<string, unknown> = {}) {
    return Object.assign(new Error(message), extra);
}

function getResponseMessage(responseText: string, status: number) {
    if (!responseText) {
        return `Upload failed with status ${status}`;
    }

    try {
        const parsed = JSON.parse(responseText);

        return parsed?._message ?? parsed?._error?.message ?? parsed?.message ?? `Upload failed with status ${status}`;
    } catch (_e) {
        return responseText;
    }
}

function isRetryableUploadError(error: any) {
    return error?.retryable === true || error?.timeout === true || error?.name === 'ProgressEvent';
}

async function uploadOnce<T>(
    token: string,
    endpoint: string,
    data: FormData,
    options: Required<Pick<IUploadOptions, 'method' | 'timeoutMs'>> & Pick<IUploadOptions, 'onProgress' | 'etag'>,
): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const request = new XMLHttpRequest();
        const url = appConfig.server.url + endpoint;

        request.open(options.method, url);
        request.setRequestHeader('Authorization', token);
        request.timeout = options.timeoutMs;

        if (options.method === 'PATCH' && options.etag != null) {
            request.setRequestHeader('If-Match', options.etag);
        }

        if (options.onProgress != null) {
            request.upload.onprogress = options.onProgress;
        }

        request.onload = function() {
            const responseText = this.responseText ?? '';

            if (this.status >= 200 && this.status < 300) {
                if (!responseText) {
                    resolve(undefined as T);
                    return;
                }

                try {
                    resolve(JSON.parse(responseText));
                } catch (_e) {
                    reject(createUploadError('Upload failed: invalid JSON response', {
                        status: this.status,
                        responseText: responseText,
                        retryable: false,
                    }));
                }
            } else {
                reject(createUploadError(getResponseMessage(responseText, this.status), {
                    status: this.status,
                    responseText: responseText,
                    retryable: this.status >= 500,
                }));
            }
        };

        request.onerror = function() {
            reject(createUploadError('Upload failed because the network request errored.', {
                retryable: true,
            }));
        };

        request.ontimeout = function() {
            reject(createUploadError('Upload timed out.', {
                timeout: true,
                retryable: true,
            }));
        };

        request.onabort = function() {
            reject(createUploadError('Upload was aborted.', {
                aborted: true,
                retryable: false,
            }));
        };

        request.send(data);
    });
}

export async function uploadFileWithRetry<T>(
    endpoint: string,
    file: File | Array<File>,
    options: IUploadOptions = {},
): Promise<T> {
    const {timeoutMs = DEFAULT_TIMEOUT_MS, retries = 1, retryDelayMs = DEFAULT_RETRY_DELAY_MS} = options;
    const session = await ng.getService('session');
    const uploadData = new FormData();
    const mediaFile = Array.isArray(file) ? file[0] : file;

    uploadData.append('media', mediaFile);

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await uploadOnce<T>(session.token, endpoint, uploadData, {
                method: options.method ?? 'POST',
                etag: options.etag,
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
