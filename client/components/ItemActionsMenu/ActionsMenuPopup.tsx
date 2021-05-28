import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {get} from 'lodash';

import {GENERIC_ITEM_ACTIONS} from '../../constants';
import {onEventCapture} from '../../utils';
import {gettext} from '../../utils/gettext';

import {Popup, Content} from '../UI/Popup';

/**
 * ActionMenuPopup component
 *
 * action labels must use gettext here because only when rendering
 * there will be translations available, not when the constant is defined.
 */
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
                        <li onClick={onEventCapture}>
                            <div className="dropdown__menu-label">
                                {gettext('Actions')}
                                <button
                                    className="dropdown__menu-close"
                                    aria-label={gettext('Close')}
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
                <div className="dropdown__menu-label">{gettext(action.text)}</div>
            );
        }

        if (Array.isArray(action.callback)) {
            let items = action.callback.map(this.renderItem.bind(this));

            if (!items.length) {
                items = (
                    <li>
                        <button onClick={this.props.closeMenu.bind(this)}>
                            {gettext('There are no actions available.')}
                        </button>
                    </li>
                );
            }

            const submenuDirection = get(action, 'direction', 'left');

            return (
                <li key={'submenu-' + key} onScroll={onEventCapture}>
                    <div className="dropdown dropdown--noarrow">
                        <a className="dropdown__toggle" onClick={this.props.closeMenu.bind(this)}>
                            {action.icon && (<i className={action.icon} />)}
                            {gettext(action.label)}
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
        const inactiveOption = get(action, 'inactive', false);

        return (
            <li key={key}>
                <button
                    id={action.id}
                    className={classNames({disabled: inactiveOption})}
                    onClick={!inactiveOption ? trigger : undefined}
                >
                    {action.icon && (<i className={action.icon} />)}
                    {gettext(action.label)}
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
