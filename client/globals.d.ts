type IPlanningItem = import('./interfaces').IPlanningItem;
type IEventItem = import('./interfaces').IEventItem;
type PLANNING_VIEW = import('./interfaces').PLANNING_VIEW;


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

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line no-redeclare
declare var ResizeObserverEntry: {
    prototype: ResizeObserverEntry;
    new(): ResizeObserverEntry;
};

interface ResizeObserverSize {
    readonly blockSize: number;
    readonly inlineSize: number;
}

// eslint-disable-next-line no-redeclare
declare var ResizeObserverSize: {
    prototype: ResizeObserverSize;
    new(): ResizeObserverSize;
};

interface ResizeObserverCallback {
    (entries: ResizeObserverEntry[], observer: ResizeObserver): void;
}

export interface ILineConfigStandard {
    fieldId: string;
    position?: 'start' | 'end';
    fieldOptions?: any; // type of options will be different for each field type
}

export interface ILineConfigAnpaCategory extends ILineConfigStandard {
    fieldId: 'anpa_category';
    fieldOptions: {
        hideLabel?: boolean;
    };
}

export interface ILineConfigPriority extends ILineConfigStandard {
    fieldId: 'priority';
    fieldOptions: {
        hideLabel?: boolean;
    };
}

export interface ILineConfigVocabulary extends ILineConfigStandard {
    fieldId: 'vocabulary';
    fieldOptions: {
        vocabularyId: string;
        hideVocabularyName?: boolean;
    };
}

export type ILineConfig = ILineConfigStandard | ILineConfigAnpaCategory | ILineConfigPriority | ILineConfigVocabulary;

// KEEP IN SYNC WITH client/planning-extension/src/globals.d.ts
declare module 'superdesk-api' {
    interface ISuperdeskGlobalConfig {
        event_templates_enabled?: boolean;
        long_event_duration_threshold?: number;
        max_multi_day_event_duration?: number;
        max_recurrent_events?: number;
        planning_allow_freetext_location: boolean;
        planning_allow_scheduled_updates?: boolean;
        planning_auto_assign_to_workflow?: boolean;
        planning_expand_related_plannings?: boolean;
        planning_check_for_assignment_on_publish?: boolean;
        planning_check_for_assignment_on_send?: boolean;
        planning_fulfil_on_publish_for_desks: Array<string>;
        planning_link_updates_to_coverage?: boolean;
        planning_use_xmp_for_pic_assignments?: boolean;
        planning_use_xmp_for_pic_slugline?: boolean;
        planning_xmp_assignment_mapping?: string;

        // see: PLANNING_EVENT_LINK_METHOD
        planning_event_link_method: 'one_primary' | 'many_secondary' | 'one_primary_many_secondary';

        street_map_url?: string;
        planning_auto_close_popup_editor?: boolean;
        start_of_week?: number;
        planning_default_view: PLANNING_VIEW;

        external_contacts?: {
            create_url: string;
            edit_url: string;
        };

        // Custom vocabularies to exclude from registration as `custom_vocabulary` fields.
        vocabulariesToExcludeAsFields: Array<IVocabulary['_id']>;

        /**
         * @deprecated
         * use `planning.assignment_list_item` instead
         */
        assignmentsList: {
            firstLine: Array<string>;
            secondLine: Array<string>;
        };

        planning?: {
            dateformat?: string;
            timeformat?: string;
            allowed_coverage_link_types?: Array<string>;
            autosave_timeout?: number;
            default_create_planning_series_with_event_series?: boolean;
            event_related_item_search_provider_name?: string;
            manual_news_coverage_status?: boolean;

            // Controls whether planning should have date only
            all_day?: boolean;

            planning_list_item?: {
                firstLine: Array<ILineConfig>;
                secondLine?: Array<ILineConfig>;

                compact_view?: {
                    firstLine: Array<ILineConfig>;
                    secondLine?: Array<ILineConfig>;
                };

                // Cards for linked items shown inside item previews. A configured
                // card_view fully describes the card: an omitted line renders nothing
                card_view?: {
                    firstLine?: Array<ILineConfig>;
                    secondLine?: Array<ILineConfig>;
                };
            };

            event_list_item?: {
                firstLine: Array<ILineConfig>;
                secondLine?: Array<ILineConfig>;

                compact_view?: {
                    firstLine: Array<ILineConfig>;
                    secondLine?: Array<ILineConfig>;
                };

                // Cards for linked items shown inside item previews. A configured
                // card_view fully describes the card: an omitted line renders nothing
                card_view?: {
                    firstLine?: Array<ILineConfig>;
                    secondLine?: Array<ILineConfig>;
                };
            };

            assignment_list_item?: {
                firstLine: Array<ILineConfig>;
                secondLine?: Array<ILineConfig>;
            };
        };

        coverage?: {
            getDueDateStrategy?(planningItem: IPlanningItem, eventItem?: IEventItem): moment.Moment | null;

            assignments?: {
                fields?: {
                    coverageProvider?: boolean;
                    assignmentPriority?: boolean;
                };
            };
        };
    }
}
