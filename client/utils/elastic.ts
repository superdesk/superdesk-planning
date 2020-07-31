import moment from 'moment';
import {sanitizeTextForQuery, getTimeZoneOffset, timeUtils} from './index';
import {MAIN} from '../constants';
import {IDateRange} from '../interfaces';

export function term(field: string, value: string | boolean | number) {
    return {
        term: {
            [field]: value
        }
    };
}

export function terms(field: string, values: Array<string | boolean | number>) {
    return {
        terms: {
            [field]: values
        }
    };
}

interface IElasticQueryString {
    text: string;
    lenient?: boolean;
    defaultOperator?: 'OR' | 'AND';
    field?: string;
}

export function queryString(params: IElasticQueryString) {
    const query = params.field != null ?
        `${params.field}:(${sanitizeTextForQuery(params.text)})` :
        sanitizeTextForQuery(params.text);

    return {
        query_string: {
            query: query,
            lenient: params.lenient ?? false,
            default_operator: params.defaultOperator ?? 'OR',
        }
    };
}

export function matchPhrase(field: string, value: string) {
    return {
        match_phrase: {
            [field]: value
        }
    };
}

export function fieldExists(field: string, queryContext: boolean = true) {
    const filter = {
        exists: {
            field: field
        }
    };

    return !queryContext ?
        filter :
        {constant_score: {filter: filter}};
}

interface IElasticRangeQuery {
    field: string;
    gt?: string;
    gte?: string;
    lt?: string;
    lte?: string;
    format?: string;
    timeZone?: string;
    startOfWeek?: number;
    range?: IDateRange;
    date?: moment.Moment;
}

export function range(query: IElasticRangeQuery) {
    const params: any = {};

    if (query.gt != null) {
        params.gt = query.gt;
    }

    if (query.gte != null) {
        params.gte = query.gte;
    }

    if (query.lt != null) {
        params.lt = query.lt;
    }

    if (query.lte != null) {
        params.lte = query.lte;
    }

    if (query.format != null) {
        params.format = query.format;
    }

    if (query.timeZone != null) {
        params.time_zone = query.timeZone;
    }

    return {
        range: {
            [query.field]: params,
        },
    };
}

export function rangeToday(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone,
        format: query.format,
        gte: 'now/d',
        lt: 'now+24h/d',
    });
}

export function rangeTomorrow(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone,
        format: query.format,
        gte: 'now+24h/d',
        lt: 'now+48h/d',
    });
}

export function rangeLast24hours(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone,
        format: query.format,
        gte: 'now-24h',
        lt: 'now',
    });
}

export function startOfThisWeek(startOfWeek: number = 0, date: moment.Moment = null) {
    return (
        timeUtils
            .getStartOfNextWeek(date, startOfWeek)
            .clone()
            .subtract(7, 'days')
            .format('YYYY-MM-DD')
    ) + '||/d';
}

export function startOfNextWeek(startOfWeek: number = 0, date: moment.Moment = null) {
    return (
        timeUtils
            .getStartOfNextWeek(date, startOfWeek)
            .clone()
            .format('YYYY-MM-DD')
    ) + '||/d';
}

export function endOfNextWeek(startOfWeek: number = 0, date: moment.Moment = null) {
    return (
        timeUtils
            .getStartOfNextWeek(date, startOfWeek)
            .clone()
            .add(7, 'days')
            .format('YYYY-MM-DD')
    ) + '||/d';
}

export function rangeThisWeek(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone ?? getTimeZoneOffset(),
        format: query.format,
        gte: startOfThisWeek(query.startOfWeek ?? 0),
        lt: startOfNextWeek(query.startOfWeek ?? 0),
    });
}

export function rangeNextWeek(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone ?? getTimeZoneOffset(),
        format: query.format,
        gte: startOfNextWeek(query.startOfWeek ?? 0),
        lt: endOfNextWeek(query.startOfWeek ?? 0),
    });
}

export function rangeDate(query: IElasticRangeQuery) {
    return range({
        field: query.field,
        timeZone: query.timeZone,
        format: query.format,
        gte: query.date.format('YYYY-MM-DD') + '||/d',
        lt: (query.date
            .clone()
            .add(1, 'days')
            .format('YYYY-MM-DD')
        ) + '||/d',
    });
}

export function dateRange(query: IElasticRangeQuery) {
    switch (query.range) {
    case MAIN.DATE_RANGE.TODAY:
        return rangeToday(query);
    case MAIN.DATE_RANGE.TOMORROW:
        return rangeTomorrow(query);
    case MAIN.DATE_RANGE.THIS_WEEK:
        return rangeThisWeek(query);
    case MAIN.DATE_RANGE.NEXT_WEEK:
        return rangeNextWeek(query);
    case MAIN.DATE_RANGE.LAST_24:
        return rangeLast24hours(query);
    case MAIN.DATE_RANGE.FOR_DATE:
        return rangeDate(query);
    default:
        return range(query);
    }
}
