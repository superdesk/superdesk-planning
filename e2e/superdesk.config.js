module.exports = function() {
    return {
        apps: ['superdesk-planning'],
        importApps: [
            '../index',
            'superdesk-planning',
        ],
        defaultRoute: '/workspace',
        enabledExtensions: {
            planning: 1,
        },
        workspace: {
            ingest: 1,
            content: 1,
            tasks: 0,
            planning: 1,
            assignments: 1
        },

        profile: {
            jid: false
        },

        item_profile: {
            change_profile: 1
        },

        editor: {
            toolbar: false,
            embeds: false,
            paste: {
                forcePlainText: true,
                cleanPastedHTML: false
            }
        },

        features: {
            elasticHighlight: 1,
            swimlane: {defaultNumberOfColumns: 4},
            editFeaturedImage: true,
            confirmMediaOnUpdate: 1,
            hideLiveSuggestions: 1,
            preview: 1,
            previewFormats: 1,
            noTakes: 1,
            searchShortcut: 1,
            slackNotifications: 1,
            editor3: 1,
            analytics: 1,
            editorAttachments: false,
            editorInlineComments: false,
            editorSuggestions: false,
            validatePointOfInterestForImages: true,
        },

        activity: {
            'edit.item.popup': 0,
            'view.item.popup': 0
        },
        confirm_spike: false,

        view: {
            timeformat: 'HH:mm',
            dateformat: 'DD/MM/YYYY'
        },

        search: {
            slugline: 1, headline: 1, unique_name: 1, story_text: 1,
            byline: 1, keywords: 1, creator: 1, from_desk: 1,
            to_desk: 1, spike: 1, scheduled: 1, company_codes: 1,
            useDefaultTimezone: 1, ingest_provider: 1, raw_search: 1,
            featuremedia: 1, marked_desks: 1
        },

        infoRemovedFields: {
            keywords: true
        },

        defaultTimezone: 'Australia/Sydney',
        shortDateFormat: 'DD/MM',
        ArchivedDateFormat: 'D/MM/YYYY',
        ArchivedDateOnCalendarYear: 1,

        list: {
            'priority': [
                'urgency',
                'priority'
            ],
            'firstLine': [
                'wordcount',
                'slugline',
                'highlights',
                'associations',
                'queueError',
                'headline',
                'markedDesks',
                'assignment',
                'versioncreated'
            ],
            'secondLine': [
                'profile',
                'state',
                'embargo',
                'takekey',
                'signal',
                'broadcast',
                'flags',
                'updated',
                'category',
                'provider',
                'expiry',
                'desk'
            ],
            'singleLine': [
                'slugline',
                'highlights',
                'associations',
                'queueError',
                'takekey',
                'state',
                'update',
                'embargo',
                'flags',
                'updated',
                'headline',
                'markedDesks',
                'assignment',
                'wordcount',
                'provider',
                'versioncreator',
                'versioncreated'
            ],
            'narrowView': [
                'slugline',
                'takekey',
                'state',
                'markedDesks',
                'provider',
                'versioncreated'
            ],
            'singleLineView': true
        },
        langOverride: {
            'en': {
                'Advanced Search': 'Advanced',
                'URGENCY': 'NEWS VALUE',
                'Urgency': 'News Value',
                'urgency': 'news value',
                'Urgency stats': 'News Value stats',
                'SERVICE': 'CATEGORY',
                'SERVICES': 'CATEGORIES',
                'Services': 'Categories',
                'Service': 'Category',
                'Mar': 'March',
                'Apr': 'April',
                'Jun': 'June',
                'Jul': 'July',
                'Sep': 'Sept',
                'ANPA Category': 'Category',
                'ANPA CATEGORY': 'CATEGORY'
            },

            'en_GB': {
                'Advanced Search': 'Advanced',
                'URGENCY': 'NEWS VALUE',
                'Urgency': 'News Value',
                'urgency': 'news value',
                'Urgency stats': 'News Value stats',
                'SERVICE': 'CATEGORY',
                'SERVICES': 'CATEGORIES',
                'Services': 'Categories',
                'Service': 'Category',
                'Mar': 'March',
                'Apr': 'April',
                'Jun': 'June',
                'Jul': 'July',
                'Sep': 'Sept',
                'ANPA Category': 'Category',
                'ANPA CATEGORY': 'CATEGORY'
            },

            'en_US': {
                'Advanced Search': 'Advanced',
                'URGENCY': 'NEWS VALUE',
                'Urgency': 'News Value',
                'urgency': 'news value',
                'Urgency stats': 'News Value stats',
                'SERVICE': 'CATEGORY',
                'SERVICES': 'CATEGORIES',
                'Services': 'Categories',
                'Service': 'Category',
                'Mar': 'March',
                'Apr': 'April',
                'Jun': 'June',
                'Jul': 'July',
                'Sep': 'Sept',
                'ANPA Category': 'Category',
                'ANPA CATEGORY': 'CATEGORY'
            },

            'en_AU': {
                'Advanced Search': 'Advanced',
                'URGENCY': 'NEWS VALUE',
                'Urgency': 'News Value',
                'urgency': 'news value',
                'Urgency stats': 'News Value stats',
                'SERVICE': 'CATEGORY',
                'SERVICES': 'CATEGORIES',
                'Services': 'Categories',
                'Service': 'Category',
                'Mar': 'March',
                'Apr': 'April',
                'Jun': 'June',
                'Jul': 'July',
                'Sep': 'Sept',
                'ANPA Category': 'Category',
                'ANPA CATEGORY': 'CATEGORY'
            }
        }
    };
};
