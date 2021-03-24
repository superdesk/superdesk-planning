import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import moment from 'moment';

import * as actions from '../../actions';
import * as selectors from '../../selectors';
import {MAIN} from '../../constants';
import {gettext} from '../../utils';

import {ButtonStack} from '../UI/SubNav';
import {Button} from '../UI';
import {Checkbox} from '../UI/Form';

export const CalendarNavigationComponent = ({
    onTodayClick,
    onBackClick,
    onForwardClick,
    onIntervalChange,
    interval,
    start,
}) => ([
    <ButtonStack key="today" padded={true}>
        <Button
            text={gettext('Today')}
            onClick={onTodayClick}
            disabled={!start || moment(start).isSame(moment(), 'day')}
        />
    </ButtonStack>,

    <ButtonStack key="nav-buttons" padded={true}>
        <Button
            iconOnlyCircle={true}
            icon="icon-chevron-left-thin"
            onClick={onBackClick}
        />
        <Button
            iconOnlyCircle={true}
            icon="icon-chevron-right-thin"
            onClick={onForwardClick}
        />
    </ButtonStack>,

    <ButtonStack key="interval" padded={true}>
        <Checkbox
            label={gettext('D')}
            type="radio"
            labelPosition="inside"
            field={MAIN.JUMP.DAY}
            checkedValue={MAIN.JUMP.DAY}
            onChange={onIntervalChange}
            value={interval}
        />

        <Checkbox
            label={gettext('W')}
            type="radio"
            labelPosition="inside"
            field={MAIN.JUMP.WEEK}
            checkedValue={MAIN.JUMP.WEEK}
            onChange={onIntervalChange}
            value={interval}
        />

        <Checkbox
            label={gettext('M')}
            type="radio"
            labelPosition="inside"
            field={MAIN.JUMP.MONTH}
            checkedValue={MAIN.JUMP.MONTH}
            onChange={onIntervalChange}
            value={interval}
        />
    </ButtonStack>,
]);

CalendarNavigationComponent.propTypes = {
    onTodayClick: PropTypes.func,
    onBackClick: PropTypes.func,
    onForwardClick: PropTypes.func,
    onIntervalChange: PropTypes.func,
    interval: PropTypes.oneOf([MAIN.JUMP.DAY, MAIN.JUMP.WEEK, MAIN.JUMP.MONTH]),
    start: PropTypes.object,
};

const mapStateToProps = (state) => ({
    interval: selectors.main.currentJumpInterval(state),
    start: selectors.main.currentStartFilter(state),
});

const mapDispatchToProps = (dispatch) => ({
    onTodayClick: () => dispatch(actions.main.jumpTo(MAIN.JUMP.TODAY)),
    onBackClick: () => dispatch(actions.main.jumpTo(MAIN.JUMP.BACK)),
    onForwardClick: () => dispatch(actions.main.jumpTo(MAIN.JUMP.FORWARD)),
    onIntervalChange: (field) => dispatch(actions.main.setJumpInterval(field)),
});

export const CalendarNavigation = connect(
    mapStateToProps,
    mapDispatchToProps
)(CalendarNavigationComponent);
