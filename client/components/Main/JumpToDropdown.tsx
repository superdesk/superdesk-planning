import React from 'react';
import PropTypes from 'prop-types';
import momentTz from 'moment-timezone';
import {get} from 'lodash';

import {gettext, timeUtils} from '../../utils';

import {Dropdown as DropMenu} from '../UI/Dropdown';
import {Button as NavButton} from '../UI/Nav';
import {DateInputPopup} from '../UI/Form/DateInput/DateInputPopup';

export class JumpToDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {popupOpened: false};

        this.togglePopup = this.togglePopup.bind(this);
        this.onChange = this.onChange.bind(this);
        this.getTimeZone = this.getTimeZone.bind(this);
    }

    togglePopup() {
        this.setState({popupOpened: !this.state.popupOpened});
    }

    getTimeZone() {
        return get(this.props, 'defaultTimeZone', timeUtils.localTimeZone());
    }

    onChange(value) {
        // If the user has selected 'Today', then set the startFilter to null
        // Otherwise set the startFilter to the supplied day
        const newMoment = momentTz.tz(value.clone(), this.getTimeZone());
        const currentMoment = momentTz.tz(moment(), this.getTimeZone());

        moment(newMoment).isSame(currentMoment, 'day') ?
            this.props.setStartFilter(null) :
            this.props.setStartFilter(newMoment);
    }

    render() {
        return (
            <DropMenu isOpen={this.state.popupOpened}>
                <NavButton
                    className="subnav-calendar__jump-to"
                    icon="icon-calendar"
                    tooltip={gettext('Jump to specific date')}
                    tooltipDirection="down"
                    onClick={this.togglePopup}
                    dropdown={true}
                    textWithIcon={true}
                    noBorderNoPadding={this.props.noBorderNoPadding}
                    aria-label={gettext('Jump to specific date')}
                >
                    {this.props.currentStartFilter.format(this.props.dateFormat)}
                </NavButton>

                {this.state.popupOpened && (
                    <DateInputPopup
                        onChange={this.onChange}
                        close={this.togglePopup}
                        target="subnav-calendar__jump-to"
                        value={this.props.currentStartFilter}
                    />
                )}
            </DropMenu>
        );
    }
}

JumpToDropdown.propTypes = {
    currentStartFilter: PropTypes.object,
    setStartFilter: PropTypes.func,
    defaultTimeZone: PropTypes.string,
    dateFormat: PropTypes.string,
    noBorderNoPadding: PropTypes.bool,
};

JumpToDropdown.defaultProps = {dateFormat: 'LL'};
