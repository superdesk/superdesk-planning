import moment from 'moment'

export const eventIsAllDayLong = (dates) => (
    // is a multiple of 24h
    moment(dates.start).diff(moment(dates.end), 'minutes') % (24 * 60) === 0
)
