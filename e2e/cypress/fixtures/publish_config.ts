import {addItems} from '../support/common';


export const FILTER_CONDITIONS = {
    events: {
        _id: '181c3d1ed5f6a3c287de2f80',
        name: 'All Events',
        field: 'type',
        operator: 'eq',
        value: 'event',
    },
    planning: {
        _id: '181c3d1ed5f6a3c287de2f81',
        name: 'All Planning',
        field: 'type',
        operator: 'eq',
        value: 'planning',
    },
};

export const CONTENT_FILTERS = {
    events: {
        _id: '281c3d1ed5f6a3c287de2f80',
        name: 'Event Content Filter',
        content_filter: [{expression: {fc: [FILTER_CONDITIONS.events._id]}}],
    },
    planning: {
        _id: '281c3d1ed5f6a3c287de2f81',
        name: 'Planning Content Filter',
        content_filter: [{expression: {fc: [FILTER_CONDITIONS.planning._id]}}],
    },
};

export const PRODUCTS = {
    events: {
        _id: '381c3d1ed5f6a3c287de2f80',
        name: 'Event Publish Product',
        product_type: 'both',
        content_filter: {
            filter_id: CONTENT_FILTERS.events._id,
            filter_type: 'permitting',
        },
    },
    planning: {
        _id: '381c3d1ed5f6a3c287de2f81',
        name: 'Planning Publish Product',
        product_type: 'both',
        content_filter: {
            filter_id: CONTENT_FILTERS.planning._id,
            filter_type: 'permitting',
        },
    },
};

export const SUBSCRIBERS = {
    events: {
        _id: '481c3d1ed5f6a3c287de2f80',
        name: 'Event Subscribers',
        email: 'test@test.com',
        is_active: true,
        subscriber_type: 'all',
        products: [PRODUCTS.events._id],
        destinations: [{
            name: 'Event files',
            format: 'json_event',
            delivery_type: 'File',
            config: {file_path: '/tmp/', file_extension: 'json'},
        }],
    },
    planning: {
        _id: '481c3d1ed5f6a3c287de2f81',
        name: 'Planning Subscribers',
        email: 'test@test.com',
        is_active: true,
        subscriber_type: 'all',
        products: [PRODUCTS.planning._id],
        destinations: [{
            name: 'Planning files',
            format: 'json_planning',
            delivery_type: 'File',
            config: {file_path: '/tmp/', file_extension: 'json'},
        }],
    },
};

export function setupPlanningPublishing() {
    addItems('filter_conditions', Object.values(FILTER_CONDITIONS));
    addItems('content_filters', Object.values(CONTENT_FILTERS));
    addItems('products', Object.values(PRODUCTS));
    addItems('subscribers', Object.values(SUBSCRIBERS));
}
