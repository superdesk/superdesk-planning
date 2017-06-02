import React from 'react'
import moment from 'moment'
import { connect } from 'react-redux'
import { getDateFormat, getTimeFormat } from '../../selectors'
import './style.scss'

function Datetime({ date, withTime, withDate, withYear, dateFormat, timeFormat }) {
    dateFormat = withYear ? dateFormat : dateFormat.replace(/y/gi, '')
    const format = [
        withDate ? dateFormat : null,
        withTime ? timeFormat : null,
    ].filter(d => d).join('\u00a0') // &nbsp;
    return <time className="Datetime" title={date.toString()}>{moment(date).format(format)}</time>
}

Datetime.defaultProps = {
    withTime: true,
    withDate: true,
    withYear: true,
}
Datetime.propTypes = {
    date: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.string,
    ]).isRequired,
    withTime: React.PropTypes.bool,
    withYear: React.PropTypes.bool,
    withDate:React.PropTypes.bool,
    dateFormat: React.PropTypes.string.isRequired,
    timeFormat: React.PropTypes.string.isRequired,
}

const mapStateToProps = (state) => ({
    dateFormat: getDateFormat(state),
    timeFormat: getTimeFormat(state),
})

export default connect(mapStateToProps)(Datetime)
