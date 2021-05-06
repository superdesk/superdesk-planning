import React from 'react';
import PropTypes from 'prop-types';

import {superdeskApi} from '../../../../superdeskApi';

import {Row, LineInput, Label, Input} from '../';
import {UserAvatar} from '../../../';
import {SelectUserPopup} from './SelectUserPopup';
import {KEYCODES} from '../../constants';
import {onEventCapture} from '../../utils';

/**
 * @ngdoc react
 * @name SelectUserInput
 * @description Component to select users from a list
 */
export class SelectUserInput extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            filteredUserList: this.getUsersToDisplay(this.props.users),
            searchText: '',
            openFilterList: false,
        };

        this.openPopup = this.openPopup.bind(this);
        this.closePopup = this.closePopup.bind(this);
        this.filterUserList = this.filterUserList.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({filteredUserList: this.getUsersToDisplay(nextProps.users)});
    }

    openPopup() {
        this.setState({openFilterList: true});
    }

    closePopup() {
        this.setState({openFilterList: false});
    }

    filterUserList(field, value) {
        if (!value) {
            this.setState({
                filteredUserList: this.getUsersToDisplay(this.props.users),
                searchText: '',
                openFilterList: true,
            });
            return;
        }

        const filterTextNoCase = value.toLowerCase();
        const newUserList = this.props.users.filter((user) => (
            user.display_name.toLowerCase().substr(0, value.length) === filterTextNoCase ||
                user.display_name.toLowerCase().indexOf(filterTextNoCase) >= 0
        ));

        this.setState({
            filteredUserList: this.getUsersToDisplay(newUserList),
            searchText: value,
            openFilterList: true,
        });
    }

    onUserChange(newUserId) {
        this.props.onChange(this.props.field, newUserId);
        this.setState({
            openFilterList: false,
            searchText: '',
        });
    }

    getUsersToDisplay(list = []) {
        if (!this.props.hideInactiveDisabled) {
            return list;
        } else {
            return list.filter((u) => u.is_active && u.is_enabled && !u.needs_activation);
        }
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {value, popupContainer, label, readOnly, inline, field} = this.props;

        return (
            <div data-test-id={field}>
                {(!inline || value) && (
                    <Row noPadding={true}>
                        <LineInput noMargin={true} noPadding={inline}>
                            <Label text={label} />

                            {value && (
                                <div
                                    className="user-search__popup-user"
                                    onClick={this.openPopup}
                                    style={inline ? {margin: 0} : {}}
                                >
                                    <UserAvatar user={value} />
                                    <div className="user-search__popup-item-label">{value.display_name}</div>
                                    {!readOnly && (
                                        <button type="button" onClick={this.onUserChange.bind(null, null)}>
                                            <i className="icon-close-small" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </LineInput>
                    </Row>
                )}

                {!readOnly && (!inline || !value) && (
                    <Row noPadding={inline}>
                        <LineInput
                            isSelect={true}
                            noLabel={!!value}
                            onClick={this.openPopup}
                            noPadding={inline}
                        >
                            <Input
                                className="sd-line-input--no-label"
                                value={this.state.searchText}
                                onChange={this.filterUserList}
                                onClick={this.openPopup}
                                placeholder={gettext('Search')}
                                onKeyDown={(event) => {
                                    if (event.keyCode === KEYCODES.ENTER ||
                                    event.keyCode === KEYCODES.DOWN) {
                                        onEventCapture(event);
                                        this.openPopup();
                                    }
                                }
                                }
                            />

                            {this.state.openFilterList && (
                                <SelectUserPopup
                                    onClose={this.closePopup}
                                    target="sd-line-input__input"
                                    popupContainer={popupContainer}
                                    users={this.state.filteredUserList}
                                    onChange={this.onUserChange}
                                />
                            )}
                        </LineInput>
                    </Row>
                )}
            </div>
        );
    }
}

SelectUserInput.propTypes = {
    field: PropTypes.string,
    label: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    users: PropTypes.array,
    popupContainer: PropTypes.func,
    readOnly: PropTypes.bool,
    hideInactiveDisabled: PropTypes.bool,
    inline: PropTypes.bool,
};

SelectUserInput.defaultProps = {
    hideInactiveDisabled: true,
    inline: false,
};
