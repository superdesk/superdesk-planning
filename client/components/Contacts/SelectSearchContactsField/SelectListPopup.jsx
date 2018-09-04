import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {uiUtils, onEventCapture} from '../../../utils';
import {KEYCODES} from '../../../constants';

import {SearchField, Button} from '../../UI';
import {Popup} from '../../UI/Popup';

import './style.scss';


export class SelectListPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search: false,
            activeOptionIndex: -1,
            openFilterList: false,
            addOption: false,
        };

        this.dom = {
            listItems: null,
            searchField: null,
        };

        this.onKeyDown = this.onKeyDown.bind(this);
        this.closeSearchList = this.closeSearchList.bind(this);
        this.onAdd = this.onAdd.bind(this);
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

    componentWillMount() {
        this.setState({filteredList: this.getFilteredOptionList()});
    }

    componentWillReceiveProps(nextProps) {
        if (this.state.search && this.props.querySearch && nextProps.options !== this.props.options) {
            this.setState({
                filteredList: nextProps.options,
            });
        }
    }

    onAdd(event) {
        this.setState({
            addOption: true,
        });

        this.closeSearchList();
    }

    closeAddOption() {
        this.dom.searchField.resetSearch();
        this.setState({
            addOption: false,
        }, () => this.props.onCancel());
    }

    onSelect(opt) {
        if (this.state.openFilterList) {
            this.props.onChange(opt);
            this.dom.searchField.resetSearch();
            this.closeSearchList();
        }
    }

    getFilteredOptionList(searchList) {
        return searchList ? searchList : this.props.options;
    }

    filterSearchResults(val) {
        let searchResults = null;

        if (!val) {
            this.setState({
                search: false,
                filteredList: this.getFilteredOptionList(),
                openFilterList: false,
            });
            return;
        }

        const valueNoCase = val.toLowerCase();

        if (this.props.querySearch) {
            this.props.onQuerySearch(valueNoCase);
            this.setState({
                search: true,
                openFilterList: true,
            });

            return;
        } else {
            searchResults = this.props.options.filter((opt) => (
                opt[this.props.valueKey].toLowerCase().substr(0, val.length) === valueNoCase ||
                    opt[this.props.valueKey].toLowerCase().indexOf(valueNoCase) >= 0
            ));
        }

        this.setState({
            search: true,
            filteredList: this.getFilteredOptionList(searchResults),
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

    renderContactSelect() {
        return (<div>
            <SearchField
                minLength={1}
                onSearchClick={this.openSearchList.bind(this)}
                onSearch={(val) => this.filterSearchResults(val)}
                ref={(node) => this.dom.searchField = node}
                onFocus={this.props.onFocus}
                readOnly={this.props.readOnly} />
            {this.state.addOption && (
                this.props.onAdd(this.closeAddOption.bind(this))
            )}
            {this.state.openFilterList &&
                (
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
                                                <span>{ opt.label }</span>
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
                )
            }
        </div>);
    }

    render() {
        return this.renderContactSelect();
    }
}

SelectListPopup.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string,
        ]),
        value: PropTypes.oneOfType([
            PropTypes.object,
        ]),
    })).isRequired,
    onCancel: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    valueKey: PropTypes.string,
    value: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.string,
        ]),
        value: PropTypes.oneOfType([
            PropTypes.object,
        ]),
    })),
    target: PropTypes.string,
    querySearch: PropTypes.bool,
    onQuerySearch: PropTypes.func,
    onFocus: PropTypes.func,
    onAdd: PropTypes.func,
    onAddText: PropTypes.string,
    readOnly: PropTypes.bool,
};

SelectListPopup.defaultProps = {valueKey: '_id'};
