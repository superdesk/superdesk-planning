import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {getDateFormat, getTimeFormat} from '../../selectors/config';
import './style.scss';

function Datetime({date, withTime, withDate, withYear, dateFormat, timeFormat, darkText}) {
    let format = withYear ? dateFormat : dateFormat.replace(/y/gi, '');
    let dateTimeFormat = [
        withDate ? format : null,
        withTime ? timeFormat : null,
    ].filter((d) => d).join('\u00a0'); // &nbsp;

    return (
        <time
            title={date.toString()}
            className={classNames(
                'Datetime',
                {'Datetime--dark-text': darkText}
            )}
        >
            {moment(date).format(dateTimeFormat)}
        </time>
    );
}

Datetime.propTypes = {
    date: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.string,
    ]).isRequired,
    withTime: PropTypes.bool,
    withYear: PropTypes.bool,
    withDate: PropTypes.bool,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    darkText: PropTypes.bool,
};

Datetime.defaultProps = {
    withTime: true,
    withDate: true,
    withYear: true,
    darkText: false,
};

const mapStateToProps = (state) => ({
    dateFormat: getDateFormat(state),
    timeFormat: getTimeFormat(state),
});

export default connect(mapStateToProps)(Datetime);
