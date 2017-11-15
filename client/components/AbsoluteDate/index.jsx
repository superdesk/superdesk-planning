import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { DATE_FORMATS } from '../../constants'

/**
 * Display absolute date in <time> element
 *
 * Usage:
 * <AbsoluteDate date={historyItem._created} />
 *
 * Params:
 * param {object} date - datetime string in utc
 */
export const AbsoluteDate = ({ date, noDateString }) => {
    date = moment.utc(date)
    if (date.isValid()) {
        const datetimeStr = date.toISOString()

        let rday
        let rdate

        date.local() // switch to local time zone.

        if (moment().format(DATE_FORMATS.COMPARE_FORMAT) === date.format(DATE_FORMATS.COMPARE_FORMAT)) {
            rday = date.format(DATE_FORMATS.DISPLAY_TODAY_FORMAT)
        } else {
            rday = date.format(DATE_FORMATS.DISPLAY_DAY_FORMAT)
        }

        if (moment().format('YYYY') === date.format('YYYY')) {
            rdate = date.format(DATE_FORMATS.DISPLAY_CDATE_FORMAT)
        } else {
            rdate = date.format(DATE_FORMATS.DISPLAY_DATE_FORMAT)
        }

        return <time dateTime={datetimeStr}>
            <span>{rday + rdate}</span>
        </time>
    }

    return <time>
        <span>{noDateString}</span>
    </time>
}

AbsoluteDate.propTypes = {
    date: PropTypes.string,
    noDateString: PropTypes.string,
}
