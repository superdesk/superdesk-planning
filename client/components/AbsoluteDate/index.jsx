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
export const AbsoluteDate = ({ date }) => {
    let datetime = moment.utc(date)
    datetime = datetime.toISOString()

    const displayTime = (recievedDate) => {
        let date = moment.utc(recievedDate)
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

        return rday + rdate
    }

    return (
        <time dateTime={datetime}><span>{displayTime(date)}</span></time>
    )
}

AbsoluteDate.propTypes = { date: PropTypes.string }
