// ------------------------------------------------------------------------------------------------
// VARIABLES
// ------------------------------------------------------------------------------------------------

declare const __SUPERDESK_CONFIG__: any;

declare const $: any; // jquery

declare const KV: any; // qumu widgets

// angular
declare const angular: IAngularStatic;

declare const inject: any;

// testing
declare const jasmine: any;

declare const spyOn: any;

declare const describe: any;

declare const fdescribe: any;

declare const xdescribe: any;

declare const beforeEach: any;

declare const afterEach: any;

declare const expect: any;

declare const it: any;

declare const fit: any;

declare const xit: any;

declare const fail: any;

// globals
// tslint:disable-next-line: interface-name
interface Window {
    instgrm: any;

    // tansa

    tansa: {
        settings: {
            profileId: number;
            platformName?: string;
            platformVersion?: string;
            baseUrl: string;
            parentAppId: string;
            tansaUserId: string;
            licenseKey: string;
            parentAppVersion: string;
            checkboxPreference: boolean;
            clientExtenstionJs: string;
        },
        useDocumentWriteFun: boolean,
    };
    afterProofing: (isCanceled: boolean) => void;
    tansaJQuery: {
        pgwBrowser: () => {
            os: {
                name: string;
                fullVersion: string;
            }
        };
    };

    $: any;
    _paq: any;
    GoogleAnalyticsObject: any;
    ga: any;
    TimeoutHttpInterceptor: any;
    RequestService: any;
    clipboardData: any;
    dragPageY: any;
    gettext: any;
    _: any;
    webkitURL: any;
    superdeskConfig: any;
    module: any;
    RunTansaProofing: any;
    iframely: any;
}

// Allow importing json/html files
declare module '*.json';
declare module '*.html';

// ------------------------------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------------------------

type Dictionary<K, V> = {[key: string]: V};
type valueof<T> = T[keyof T];
type DeepPartial<T> = {
    [K in keyof T]?: DeepPartial<T[K]>;
}

// ResizeObserver types aren't available in the version of Typescript we use
// see: https://github.com/Microsoft/TypeScript/issues/28502
// The following is copied from https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/948
interface ResizeObserverOptions {
    box?: ResizeObserverBoxOptions;
}

interface ResizeObserver {
    disconnect(): void;
    observe(target: Element, options?: ResizeObserverOptions): void;
    unobserve(target: Element): void;
}

declare var ResizeObserver: {
    prototype: ResizeObserver;
    new(callback: ResizeObserverCallback): ResizeObserver;
};

interface ResizeObserverEntry {
    readonly borderBoxSize: ReadonlyArray<ResizeObserverSize>;
    readonly contentBoxSize: ReadonlyArray<ResizeObserverSize>;
    readonly contentRect: DOMRectReadOnly;
    readonly target: Element;
}

declare var ResizeObserverEntry: {
    prototype: ResizeObserverEntry;
    new(): ResizeObserverEntry;
};

interface ResizeObserverSize {
    readonly blockSize: number;
    readonly inlineSize: number;
}

declare var ResizeObserverSize: {
    prototype: ResizeObserverSize;
    new(): ResizeObserverSize;
};

interface ResizeObserverCallback {
    (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}
