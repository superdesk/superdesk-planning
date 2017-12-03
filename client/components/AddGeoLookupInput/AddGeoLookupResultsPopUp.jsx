import React from 'react';
import PropTypes from 'prop-types';
import {formatAddress, uiUtils} from '../../utils';
import {get} from 'lodash';
import './style.scss';

export class AddGeoLookupResultsPopUp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searching: false,
            activeOptionIndex: -1,
        };
        this.handleKeyBoardEvent = this.handleKeyBoardEvent.bind(this);
    }

    handleKeyBoardEvent(event) {
        if (event) {
            switch (event.keyCode) {
            case 27:
                // ESC key
                event.preventDefault();
                this.props.onCancel();
                break;
            case 13:
                // ENTER key
                event.preventDefault();
                this.handleEnterKey(event);
                break;
            case 40:
                // arrowDown key
                event.preventDefault();
                this.handleDownArrowKey(event);
                break;
            case 38:
                // arrowUp key
                event.preventDefault();
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
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.refs.itemList);
        }
    }

    handleUpArrowKey() {
        if (this.state.activeOptionIndex > 0) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.refs.itemList);
        }
    }

    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyBoardEvent);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyBoardEvent);
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

        return (<div className="addgeolookup__suggests-wrapper">
            <ul className="addgeolookup__suggests" ref="itemList">
                {localSuggests.map((suggest, index) => {
                    const shortName = suggest.existingLocation ? suggest.name : formatAddress(suggest.raw).shortName;

                    return (<li key={index} className={(index === this.state.activeOptionIndex ?
                        'addgeolookup__item--active ' : '') + 'addgeolookup__item'}
                    onClick={this.props.onChange.bind(null, suggest)}>
                        <span>&nbsp;&nbsp;{shortName}</span>
                    </li>);
                })}
                {this.props.showExternalSearch && <li className={(this.state.activeOptionIndex ===
                    get(localSuggests, 'length') ?
                    'addgeolookup__item--active ' : '') + 'addgeolookup__item'}>
                    <button type="button" className="btn" disabled={this.state.searching}
                        onClick={this.onSearchClick.bind(this)} style={{width: '100%'}}>
                        <span>{searchButtonText}</span>
                        {this.state.searching && <div className="spinner">
                            <div className="dot1" />
                            <div className="dot2" />
                        </div>}
                    </button>
                </li>}
                {suggests.map((suggest, index) => {
                    const shortName = suggest.existingLocation ? suggest.name : formatAddress(suggest.raw).shortName;

                    return (<li key={index} className={((index +
                        get(this.props.localSuggests, 'length', 0) + 1) === this.state.activeOptionIndex ?
                        'addgeolookup__item--active ' : '') + 'addgeolookup__item'}
                    onClick={this.props.onChange.bind(null, suggest)}>
                        <span>&nbsp;&nbsp;{shortName}</span>
                    </li>);
                })}
            </ul>
        </div>);
    }
}

AddGeoLookupResultsPopUp.propTypes = {
    suggests: PropTypes.array,
    localSuggests: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    handleSearchClick: PropTypes.func,
    showExternalSearch: PropTypes.bool,
};

