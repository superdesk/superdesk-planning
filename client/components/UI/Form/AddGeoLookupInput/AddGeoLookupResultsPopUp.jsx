import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {formatAddress, uiUtils, onEventCapture} from '../../../../utils';
import {KEYCODES} from '../../../../constants';
import {get} from 'lodash';
import './style.scss';

import {Popup, Content} from '../../Popup';

export class AddGeoLookupResultsPopUp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searching: false,
            activeOptionIndex: -1,
        };
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);

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
                this.onSearchClick();
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

    componentWillReceiveProps() {
        this.setState({searching: false});
    }

    onSearchClick() {
        this.setState({searching: true});
        this.props.handleSearchClick();
    }

    render() {
        const localSuggests = get(this.props.localSuggests, 'length') > 0 ?
            this.props.localSuggests : [];
        const suggests = get(this.props.suggests, 'length') > 0 ?
            this.props.suggests : [];

        const searchButtonText = get(this.props.suggests, 'length') > 0 ?
            'Results (Search again)' : 'Search External';

        return (
            <Popup
                close={this.props.onCancel}
                target={this.props.target}
                onKeyDown={this.handleKeyBoardEvent}
                noPadding={true}
                inheritWidth={true}
                className="addgeolookup__popup"
            >
                <Content noPadding={true} className="addgeolookup__suggests-wrapper">
                    <ul className="addgeolookup__suggests" ref={(node) => this.dom.itemList = node}>
                        {localSuggests.map((suggest, index) => {
                            const shortName = suggest.existingLocation ?
                                suggest.name :
                                formatAddress(suggest.raw).shortName;

                            return (
                                <li
                                    key={index}
                                    className={classNames(
                                        'addgeolookup__item',
                                        {'addgeolookup__item--active': index === this.state.activeOptionIndex}
                                    )}
                                    onClick={this.props.onChange.bind(null, suggest)}
                                >
                                    <span>&nbsp;&nbsp;{shortName}</span>
                                </li>
                            );
                        })}

                        {this.props.showExternalSearch && (
                            <li className={classNames(
                                'addgeolookup__item',
                                {
                                    'addgeolookup__item--active':
                                        this.state.activeOptionIndex === get(localSuggests, 'length')
                                }
                            )} >
                                <button
                                    type="button"
                                    className="btn"
                                    disabled={this.state.searching}
                                    onClick={this.onSearchClick.bind(this)}
                                    style={{width: '100%'}}
                                >
                                    <span>{searchButtonText}</span>
                                    {this.state.searching && <div className="spinner">
                                        <div className="dot1" />
                                        <div className="dot2" />
                                    </div>}
                                </button>
                            </li>
                        )}
                        {suggests.map((suggest, index) => {
                            const shortName = suggest.existingLocation ?
                                suggest.name :
                                formatAddress(suggest.raw).shortName;

                            return (
                                <li
                                    key={index}
                                    className={classNames(
                                        'addgeolookup__item',
                                        {
                                            'addgeolookup__item--active':
                                                (index + get(this.props.localSuggests, 'length', 0) + 1) ===
                                                this.state.activeOptionIndex
                                        }
                                    )}
                                    onClick={this.props.onChange.bind(null, suggest)}
                                >
                                    <span>&nbsp;&nbsp;{shortName}</span>
                                </li>
                            );
                        })}
                    </ul>
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
    showExternalSearch: PropTypes.bool,
    target: PropTypes.string.isRequired,
};

