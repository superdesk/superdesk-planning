import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {GENERIC_ITEM_ACTIONS} from '../../constants';
import {onEventCapture} from '../../utils';

import {Popup, Content} from '../UI/Popup';

export class ActionsMenuPopup extends React.PureComponent {
    triggerAction(action, event) {
        this.props.closeMenu(event);
        action.callback();
    }

    render() {
        const {actions, closeMenu, target, wide} = this.props;

        let items = actions.map(this.renderItem.bind(this));

        return (
            <Popup
                target={target}
                close={closeMenu}
                noPadding={true}
                className={{
                    'item-actions-menu__popup': true,
                    'item-actions-menu__popup--wide': wide,
                }}
            >
                <Content noPadding={true}>
                    <ul className="dropdown dropdown__menu more-activity-menu open">
                        <li onClick={onEventCapture.bind(this)}>
                            <div className="dropdown__menu-label">
                                Actions
                                <button
                                    className="dropdown__menu-close"
                                    onClick={closeMenu}
                                >
                                    <i className="icon-close-small" />
                                </button>
                            </div>
                        </li>
                        <li className="dropdown__menu-divider" />
                        {items}
                    </ul>
                </Content>
            </Popup>
        );
    }

    renderItem(action) {
        const key = action.key ? action.key : action.label;

        if (get(action, 'text')) {
            // Header of a menu or submenu
            return (
                <div className="dropdown__menu-label">{action.text}</div>
            );
        }

        if (Array.isArray(action.callback)) {
            let items = action.callback.map(this.renderItem.bind(this));

            if (!items.length) {
                items = <li>
                    <button onClick={this.props.closeMenu.bind(this)}>There are no actions available.</button>
                </li>;
            }

            const submenuDirection = get(action, 'direction', 'left');

            return (
                <li key={'submenu-' + key}>
                    <div className="dropdown dropdown--noarrow">
                        <a className="dropdown__toggle" onClick={this.props.closeMenu.bind(this)}>
                            {action.icon && (<i className={action.icon}/>)}
                            {action.label}
                        </a>
                        <ul className={'dropdown__menu dropdown__menu--submenu-' + submenuDirection}>
                            {items}
                        </ul>
                    </div>
                </li>
            );
        }

        if (action.label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            return <li key={key} className="dropdown__menu-divider" />;
        }

        const trigger = this.triggerAction.bind(this, action);

        return (
            <li key={key}>
                <button
                    className={classNames({disabled: get(action, 'inactive', false)})}
                    onClick={trigger}
                >
                    {action.icon && (<i className={action.icon}/>)}
                    {action.label}
                </button>
            </li>
        );
    }
}


ActionsMenuPopup.propTypes = {
    closeMenu: PropTypes.func.isRequired,
    actions: PropTypes.array.isRequired,
    target: PropTypes.string.isRequired,
    wide: PropTypes.bool,
};

ActionsMenuPopup.defaultProps = {wide: false};
