import moment from 'moment';

import {appConfig} from 'appConfig';
import {superdeskApi} from '../../../../superdeskApi';
import {
    DATE_RANGE,
    FILTER_TYPE,
    IPlanningItem,
    IWorkflowState,
    LOCK_STATE,
    SEARCH_SPIKE_STATE,
    IG2ContentType,
} from '../../../../interfaces';

import {planningUtils} from '../../../../utils';
import {
    getVocabularyItemName,
    getVocabularyItemNameFromString,
    getVocabularyItemNames
} from '../../../../utils/vocabularies';
import {getItemTypeOptionName} from '../../../../utils/eventsplanning';

export function getPreviewString(value?: string): string | null {
    return value;
}

export function getPreviewBooleanString(value?: boolean): string | null {
    if (value == undefined) {
        return null;
    }

    return value == true ?
        superdeskApi.localization.gettext('True') :
        superdeskApi.localization.gettext('False');
}

export function getG2ContentTypeString(
    value: IG2ContentType['qcode'] | IG2ContentType | undefined,
    props: {[key: string]: any}
): string | null {
    const name = getVocabularyItemNameFromString(
        typeof value === 'string' ? value : value?.qcode,
        props.contentTypes,
        'qcode',
        'name',
        props.language
    );

    return !name?.length ?
        null :
        name;
}

export function getValuesFromCV(
    propName: string,
    valueField: string = 'qcode',
    nameField: string = 'name'
) {
    return function(value: any | undefined, props: {[key: string]: any}): string | null {
        const names = getVocabularyItemNames(
            value,
            props[propName],
            valueField,
            nameField,
            props.language
        );

        if (!names.length) {
            return null;
        }

        return names.join(', ');
    };
}

export function getValueFromCV(
    propName: string,
    valueField: string = 'qcode',
    nameField: string = 'name'
) {
    return function(value: any | undefined, props: {[key: string]: any}): string | null {
        const name = getVocabularyItemName(
            value,
            props[propName],
            valueField,
            nameField,
            props.language
        );

        return !name?.length ?
            null :
            name;
    };
}

export function getLanguageString(value: string | undefined, props: {[key: string]: any}): string | null {
    const name = getVocabularyItemNameFromString(
        value ?? appConfig.default_language,
        props.languages,
        'qcode',
        'name',
        props.language
    );

    return !name?.length ?
        null :
        name;
}

export function getDateTimeValue(value?: string): string | null {
    if (value == undefined) {
        return null;
    }

    return moment(value).format(
        appConfig.planning.dateformat +
        ' ' +
        appConfig.planning.timeformat
    );
}

export function getItemTypeName(value?: FILTER_TYPE | 'event'): string | null {
    return getItemTypeOptionName(value || FILTER_TYPE.COMBINED);
}

export function getStringAttribute(attributeName: string) {
    return function(value: any | undefined, props: {[key: string]: any}): string | null {
        return value?.[attributeName]?.length ?
            value[attributeName] :
            null;
    };
}

export function getLockState(value: LOCK_STATE | undefined, props: {[key: string]: any}): string | null {
    if (value == undefined) {
        return null;
    }

    return value === LOCK_STATE.LOCKED ?
        superdeskApi.localization.gettext('Locked') :
        superdeskApi.localization.gettext('Not Locked');
}

export function getDateFilterString(value: DATE_RANGE | undefined, props: {[key: string]: any}): string | null {
    const {gettext} = superdeskApi.localization;

    switch (value) {
    case DATE_RANGE.TODAY:
        return gettext('Today');
    case DATE_RANGE.TOMORROW:
        return gettext('Tomorrow');
    case DATE_RANGE.THIS_WEEK:
        return gettext('This Week');
    case DATE_RANGE.NEXT_WEEK:
        return gettext('Next Week');
    }

    return null;
}

export function getSpikeStateString(value: SEARCH_SPIKE_STATE | undefined, props: {[key: string]: any}): string | null {
    const {gettext} = superdeskApi.localization;

    switch (value) {
    case SEARCH_SPIKE_STATE.NOT_SPIKED:
        return gettext('Exclude Spike');
    case SEARCH_SPIKE_STATE.BOTH:
        return gettext('Include Spike');
    case SEARCH_SPIKE_STATE.SPIKED:
        return gettext('Spiked Only');
    }

    return null;
}

export function getWorkflowStateString(
    value: Array<{qcode: IWorkflowState}> | undefined,
    props: {[key: string]: any}
): string | null {
    if (!value?.length) {
        return null;
    }

    const {gettext} = superdeskApi.localization;

    function getStateString(state: IWorkflowState) {
        switch (state) {
        case 'draft':
            return gettext('Draft');
        case 'ingested':
            return gettext('Ingested');
        case 'scheduled':
            return gettext('Scheduled');
        case 'killed':
            return gettext('Killed');
        case 'cancelled':
            return gettext('Cancelled');
        case 'rescheduled':
            return gettext('Rescheduled');
        case 'postponed':
            return gettext('Postponed');
        case 'spiked':
            return gettext('Spiked');
        }

        return null;
    }

    const names = value
        .map((state) => getStateString(state.qcode))
        .filter((name) => name?.length);

    return names.length ?
        names.join(', ') :
        null;
}

export function getPreviewDateForPlanning(
    value: IPlanningItem['planning_date'] | undefined,
    props: {item: IPlanningItem | undefined}
): string | null {
    if (value == undefined || props.item == undefined) {
        return null;
    }

    return planningUtils.getDateStringForPlanning(props.item);
}

export function getKeywordsString(value: Array<string> | undefined, props: {[key: string]: any}): string | null {
    if (!value?.length) {
        return null;
    }

    return value.join(', ');
}
