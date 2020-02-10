import React from 'react';
import PropTypes from 'prop-types';
import DebounceInput from 'react-debounce-input';
import {uniqueId} from 'lodash';
import {KEYCODES} from '../constants';
import {onEventCapture} from '../utils';
import {gettext} from '../../../utils/gettext';

/**
 * @ngdoc react
 * @name SearchField
 * @description Input Field Component with search capabiities
 */
export default class SearchField extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // initialize state from props
            searchInputValue: this.props.value || '',
            uniqueId: uniqueId('SearchField'),
        };

        this.onSearchChange = this.onSearchChange.bind(this);
        this.onSearchClick = this.onSearchClick.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    /** Reset the field value, close the search bar and load events */
    resetSearch() {
        this.setState({
            searchInputValue: '',
        });
        this.props.onSearch();
    }

    /** Search events by keywords */
    onSearchChange(event) {
        const value = event.target.value;

        this.setState(
            {searchInputValue: value || ''},
            // update the input value since we are using the DebounceInput `value` prop
            () => this.props.onSearch(value)
        );
    }

    onSearchClick(event) {
        if (this.props.onSearchClick) {
            this.props.onSearchClick(event);
        }
    }

    onKeyDown(event) {
        if (event.keyCode === KEYCODES.ENTER) {
            onEventCapture(event);
            this.onSearchClick();
        }
    }

    render() {
        const {uniqueId} = this.state;
        const minLength = this.props.minLength ? this.props.minLength : 2;

        return (
            <DebounceInput
                minLength={minLength}
                debounceTimeout={800}
                value={this.state.searchInputValue}
                onChange={this.onSearchChange}
                onClick={this.onSearchClick}
                id={uniqueId}
                placeholder={this.props.placeholder || gettext('Search')}
                className="sd-line-input__input"
                type="text"
                onKeyDown={this.onKeyDown}
                onFocus={this.props.onFocus}
                disabled={this.props.readOnly}
                autoComplete={this.props.autoComplete ? 'on' : 'off'}
                name={this.props.name}
            />
        );
    }
}

SearchField.propTypes = {
    onSearch: PropTypes.func.isRequired,
    onSearchClick: PropTypes.func.isRequired,
    value: PropTypes.string,
    minLength: PropTypes.number,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
    placeholder: PropTypes.string,
    autoComplete: PropTypes.bool,
    name: PropTypes.string,
};

SearchField.defaultProps = {autoComplete: true};
