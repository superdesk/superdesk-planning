import React from 'react';
import moment from 'moment-timezone';
import {get} from 'lodash';

import {gettext, timeUtils} from '../../utils';

import {Dropdown as DropMenu} from '../UI/Dropdown';
import {Button as NavButton} from '../UI/Nav';
import {DateInputPopup} from '../UI/Form/DateInput/DateInputPopup';

interface IProps {
    currentStartFilter: moment.Moment;
    defaultTimeZone: string;
    dateFormat: string;
    noBorderNoPadding?: boolean;
    disabled?: boolean;

    setStartFilter(date: moment.Moment): void;
}

interface IState {
    popupOpened: boolean;
}

export class JumpToDropdown extends React.Component<IProps, IState> {
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
        const newMoment = moment.tz(value.clone(), this.getTimeZone());
        const currentMoment = moment.tz(moment(), this.getTimeZone());

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
                    disabled={this.props.disabled}
                >
                    {this.props.currentStartFilter.format(this.props.dateFormat || 'LL')}
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
