import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {uiUtils, onEventCapture} from '../../utils';
import {gettext} from '../../utils/gettext';
import {KEYCODES} from '../../constants';
import {get} from 'lodash';
import {Button} from '../UI';
import './style.scss';

import {Popup, Content} from '../UI/Popup';
import {LocationLookupResultItem} from './LocationLookupResultItem';

export class AddGeoLookupResultsPopUp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeOptionIndex: -1,
            tab: 'localResults',
        };
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
        this.onTabChange = this.onTabChange.bind(this);

        this.dom = {itemList: null};
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case KEYCODES.ENTER:
                onEventCapture(event);
                this.handleEnterKey(event);
                break;
            case KEYCODES.DOWN:
                onEventCapture(event);
                this.handleDownArrowKey(event);
                break;
            case KEYCODES.UP:
                onEventCapture(event);
                this.handleUpArrowKey(event);
                break;
            }
        }
    }

    handleEnterKey() {
        if (this.state.activeOptionIndex > -1) {
            if (this.state.activeOptionIndex < get(this.props.localSuggests, 'length', -1)) {
                this.props.onChange(this.props.localSuggests[this.state.activeOptionIndex]);
                return;
            }

            if (this.state.activeOptionIndex === get(this.props.localSuggests, 'length', 0)) {
                this.onSearch();
                return;
            }

            if (this.state.activeOptionIndex >= get(this.props.localSuggests, 'length', 0) + 1) {
                this.props.onChange(this.props.suggests[
                    this.state.activeOptionIndex - (get(this.props.localSuggests, 'length', 0) + 1)]);
            }
        }
    }

    handleDownArrowKey() {
        if (this.state.activeOptionIndex <
            (1 + // External search button
            get(this.props.localSuggests, 'length', 0) +
            get(this.props.suggests, 'length', 0)) - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.itemList);
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex > 0) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.itemList);
        }
    }

    onSearch() {
        this.props.handleSearchClick();
    }

    onTabChange(tabName) {
        if (tabName !== this.state.tab) {
            this.setState({tab: tabName});

            if (this.state.tab === 'localResults') {
                this.onSearch();
            } else {
                this.props.onLocalSearchOnly();
            }
        }
    }

    render() {
        const localSuggests = get(this.props.localSuggests, 'length') > 0 ?
            this.props.localSuggests : [];
        const suggests = get(this.props.suggests, 'length') > 0 ?
            this.props.suggests : [];

        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.handleKeyBoardEvent}
                noPadding={true}
                inheritWidth={true}
                className="addgeolookup__popup"
                ignoreOnClickElement="location"
                onPopupOpen={this.props.onPopupOpen}
                onPopupClose={this.props.onPopupClose}
            >
                <Content noPadding={true} className="addgeolookup__suggests-wrapper">
                    <ul className="nav-tabs">
                        <li className={classNames('nav-tabs__tab',
                            'nav-tabs--small',
                            {'nav-tabs__tab--active': this.state.tab === 'localResults'})} >
                            <Button
                                onClick={this.onTabChange.bind(null, 'localResults')}
                                className="nav-tabs__link"><span>{gettext('Existing locations')}</span>
                            </Button>
                        </li>
                        {this.props.showExternalSearch &&
                            <li className={classNames('nav-tabs__tab',
                                'nav-tabs--small',
                                {'nav-tabs__tab--active': this.state.tab === 'searchResults'})} >
                                <Button
                                    onClick={this.onTabChange.bind(null, 'searchResults')}
                                    className="nav-tabs__link">
                                    <span>&nbsp;{gettext('Search OpenStreetMap')}&nbsp;</span>
                                </Button>
                            </li>}
                    </ul>
                    <div className="nav-tabs__content nav-tabs__content--no-padding">
                        {this.state.tab === 'localResults' &&
                            <div className="nav-tabs__pane">
                                <ul className="addgeolookup__suggests"
                                    ref={(node) => this.dom.itemList = node}
                                >
                                    {localSuggests.map((suggest, index) => (
                                        <LocationLookupResultItem
                                            key={index}
                                            location={suggest}
                                            onClick={this.props.onChange.bind(null, suggest)}
                                            active={index === this.state.activeOptionIndex}
                                        />
                                    ))}
                                    {get(localSuggests, 'length') === 0 && (
                                        <li className="addgeolookup__item">
                                            {gettext('No results found')}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        }
                        {this.state.tab === 'searchResults' && (
                            <div className="nav-tabs__pane">
                                {this.props.searching ? (
                                    <div className="spinner-big" />
                                ) : (
                                    <ul className="addgeolookup__suggests"
                                        ref={(node) => this.dom.itemList = node}
                                    >
                                        {suggests.map((suggest, index) => (
                                            <LocationLookupResultItem
                                                key={index}
                                                location={suggest}
                                                onClick={this.props.onChange.bind(null, suggest)}
                                                active={(
                                                    index +
                                                    get(this.props.localSuggests, 'length', 0) +
                                                    1
                                                ) === this.state.activeOptionIndex}
                                            />
                                        ))}
                                        {get(suggests, 'length') === 0 && (
                                            <li className="addgeolookup__item">
                                                {gettext('No results found')}
                                            </li>
                                        )}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    {this.props.showAddLocation &&
                        <Button
                            className="addgeolookup"
                            disabled={this.props.searching}
                            onClick={this.props.onAddNewLocation} >
                            <span>{gettext('Add a new location')}</span>
                        </Button>
                    }
                </Content>
            </Popup>
        );
    }
}

AddGeoLookupResultsPopUp.propTypes = {
    suggests: PropTypes.array,
    localSuggests: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    handleSearchClick: PropTypes.func,
    onLocalSearchOnly: PropTypes.func,
    onAddNewLocation: PropTypes.func,
    showExternalSearch: PropTypes.bool,
    showAddLocation: PropTypes.bool,
    target: PropTypes.string.isRequired,
    searching: PropTypes.bool,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
};
