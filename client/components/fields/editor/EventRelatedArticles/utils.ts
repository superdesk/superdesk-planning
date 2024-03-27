import {IArticle} from 'superdesk-api';

export const fakeEditor: any = {
    slugline: {
        order: 0,
        sdWidth: 'full',
        enabled: true,
        section: 'header',
        required: false
    },
    keywords: null,
    language: null,
    usageterms: null,
    genre: {
        order: 1,
        sdWidth: 'half',
        enabled: true,
        section: 'header',
        required: false
    },
    anpa_take_key: null,
    place: {
        order: 2,
        sdWidth: 'half',
        enabled: true,
        section: 'header',
        required: false
    },
    priority: {
        order: 3,
        sdWidth: 'quarter',
        enabled: true,
        section: 'header',
        required: false
    },
    urgency: {
        order: 4,
        sdWidth: 'quarter',
        enabled: true,
        section: 'header',
        required: false
    },
    anpa_category: {
        order: 5,
        sdWidth: 'full',
        enabled: true,
        section: 'header',
        required: false
    },
    subject: {
        order: 6,
        sdWidth: 'full',
        enabled: true,
        section: 'header',
        required: false
    },
    company_codes: null,
    ednote: {
        order: 7,
        sdWidth: 'full',
        enabled: true,
        section: 'header',
        required: false
    },
    authors: {
        order: 8,
        sdWidth: 'full',
        enabled: true,
        section: 'header',
        required: false
    },
    headline: {
        order: 9,
        sdWidth: 'full',
        formatOptions: [],
        enabled: true,
        section: 'content',
        required: true
    },
    sms: null,
    abstract: {
        order: 10,
        formatOptions: [
            'bold',
            'italic',
            'underline',
            'link'
        ],
        editor3: true,
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false
    },
    byline: {
        order: 11,
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false
    },
    dateline: {
        order: 12,
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false
    },
    body_html: {
        order: 13,
        formatOptions: [
            'h2',
            'bold',
            'italic',
            'underline',
            'quote',
            'link',
            'embed',
            'media'
        ],
        cleanPastedHTML: false,
        editor3: true,
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false
    },
    footer: null,
    body_footer: null,
    sign_off: {
        order: 14,
        enabled: true,
        sdWidth: 'full',
        section: 'header',
        required: false
    },
    feature_media: {
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false,
        order: 15
    },
    media_description: {
        enabled: true,
        sdWidth: 'full',
        section: 'content',
        required: false,
        order: 16
    },
    attachments: null,
    rundown_item_types: null,
    camera: null,
    rundown_subitem_types: null,
    rundown_item_status: null,
    topics: null
};

export function cleanArticlesFields(articles: Array<Partial<IArticle>>) {
    const fieldsToCleanup: Array<keyof IArticle> = [
        '_created',
        '_etag',
        '_fetchable',
        '_id',
        '_links',
        '_type',
        '_updated',
        'authors',
        'body_html',
        'creditline',
        'description_text',
        'ednote',
        'extra',
        'fetch_endpoint',
        'firstcreated',
        'ingest_provider',
        'keywords',

        // needed because proxy preprocessing adds mimetype to
        // each article, while technically it's not a part of its interface
        'mimetype' as any,
        'profile',
        'renditions',
        'sign_off',
        'profile',
        'subject',
    ];

    fieldsToCleanup.forEach((field) => {
        articles.forEach((article) => {
            delete article[field];
        });
    });

    return articles;
}

