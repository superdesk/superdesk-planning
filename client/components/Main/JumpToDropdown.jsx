import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import {gettext} from '../../utils';

import {Dropdown as DropMenu} from '../UI/Dropdown';
import {Button as NavButton} from '../UI/Nav';
import {DateInputPopup} from '../UI/Form/DateInput/DateInputPopup';

export class JumpToDropdown extends React.Component {
    constructor(props) {
        super(props);

        this.state = {popupOpened: false};

        this.togglePopup = this.togglePopup.bind(this);
        this.onChange = this.onChange.bind(this);
    }

    togglePopup() {
        this.setState({popupOpened: !this.state.popupOpened});
    }

    onChange(value) {
        // If the user has selected 'Today', then set the startFilter to null
        // Otherwise set the startFilter to the supplied day
        moment(value).isSame(moment(), 'day') ?
            this.props.setStartFilter(null) :
            this.props.setStartFilter(value);
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
                >
                    {this.props.currentStartFilter.format('LL')}
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
};
