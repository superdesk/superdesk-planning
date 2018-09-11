import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {get} from 'lodash';

import * as actions from '../../../actions';
import {CONTACTS} from '../../../constants';

import {uiUtils, onEventCapture} from '../../../utils';
import {KEYCODES} from '../../../constants';

import {SearchField, Button} from '../../UI';
import {Popup} from '../../UI/Popup';

import {ContactLabel} from '../';

import './style.scss';


export class SelectListPopupComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: false,
            activeOptionIndex: -1,
            openFilterList: false,
            filteredList: [],
        };

        this.dom = {
            listItems: null,
            searchField: null,
        };

        this.onKeyDown = this.onKeyDown.bind(this);
        this.closeSearchList = this.closeSearchList.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.openSearchList = this.openSearchList.bind(this);
        this.filterSearchResults = this.filterSearchResults.bind(this);
    }

    onKeyDown(event) {
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
        this.onSelect(this.state.filteredList[this.state.activeOptionIndex]);
    }

    handleDownArrowKey(event) {
        if (event.target.id && event.target.id.indexOf('SearchField') >= 0) {
            // Lose focus on Search Field
            event.target.blur();

            this.setState({activeOptionIndex: 0});
        } else if (this.state.activeOptionIndex < this.state.filteredList.length - 1) {
            this.setState({activeOptionIndex: this.state.activeOptionIndex + 1});
            uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.listItems);
        }
    }

    handleUpArrowKey(event) {
        this.setState({activeOptionIndex: this.state.activeOptionIndex - 1});
        uiUtils.scrollListItemIfNeeded(this.state.activeOptionIndex, this.dom.listItems);
    }

    onAdd(event) {
        this.closeSearchList();
        this.dom.searchField.resetSearch();
        this.props.onAdd();
    }

    onSelect(opt) {
        if (this.state.openFilterList) {
            this.props.onChange(opt);
            this.dom.searchField.resetSearch();
            this.closeSearchList();
        }
    }

    getFilteredOptionList(searchList) {
        return searchList ? searchList : this.state.options;
    }

    filterSearchResults(val) {
        if (!val) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(),
                openFilterList: false,
            });
            return;
        }

        const valueNoCase = val.toLowerCase();

        this.getSearchResult(valueNoCase);
        this.setState({
            search: true,
            openFilterList: true,
        });
    }

    openSearchList(event) {
        if (event && get(event.target, 'value.length') > 1) {
            if (!this.state.openFilterList) {
                this.setState({filteredList: this.getFilteredOptionList()});
                this.setState({
                    openFilterList: true,
                    search: true,
                });
            }
        }
    }

    closeSearchList() {
        if (this.state.openFilterList) {
            this.setState({
                filteredList: null,
                search: false,
                openFilterList: false,
            });
        }
    }

    getSearchResult(text) {
        this.props.searchContacts(text)
            .then((contacts) => {
                this.setState({
                    options: contacts,
                    filteredList: contacts.filter(
                        (contact) => !this.props.value.find((contactId) => contactId === contact._id)
                    ),
                });
            });
    }

    render() {
        return (<div>
            <SearchField
                minLength={1}
                onSearchClick={this.openSearchList}
                onSearch={this.filterSearchResults}
                ref={(node) => this.dom.searchField = node}
                onFocus={this.props.onFocus}
                readOnly={this.props.readOnly}
            />
            {this.state.openFilterList && (
                <Popup
                    close={this.closeSearchList}
                    target={this.props.target}
                    onKeyDown={this.onKeyDown}
                    inheritWidth={true}
                    noPadding={true}
                >
                    <div className="Select__popup__wrapper">
                        <ul className="Select__popup__list" ref={(node) => this.dom.listItems = node}>
                            {get(this.state, 'filteredList.length', 0) > 0 &&
                                this.state.filteredList.map((opt, index) => (
                                    <li
                                        key={index}
                                        className={classNames(
                                            'Select__popup__item',
                                            {'Select__popup__item--active': index === this.state.activeOptionIndex}
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={this.onSelect.bind(this, this.state.filteredList[index])}
                                        >
                                            <ContactLabel contact={opt} />
                                        </button>
                                    </li>
                                ))
                            }

                            {this.props.onAdd && (
                                <li tabIndex="0">
                                    <Button
                                        size="small"
                                        expanded={true}
                                        onClick={this.onAdd}
                                        text={this.props.onAddText}
                                        icon={this.props.onAddText ? null : 'icon-plus-large'}
                                        iconOnly={!this.props.onAddText}
                                    />
                                </li>
                            )}
                        </ul>
                    </div>
                </Popup>
            )}
        </div>);
    }
}

SelectListPopupComponent.propTypes = {
    onChange: PropTypes.func.isRequired,
    value: PropTypes.arrayOf(PropTypes.string),
    target: PropTypes.string,
    onFocus: PropTypes.func,
    onAdd: PropTypes.func,
    onAddText: PropTypes.string,
    readOnly: PropTypes.bool,
    searchContacts: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
    searchContacts: (text) => dispatch(
        actions.contacts.getContacts(text, CONTACTS.SEARCH_FIELDS)
    ),
});

export const SelectListPopup = connect(
    null,
    mapDispatchToProps
)(SelectListPopupComponent);
