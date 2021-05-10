import React from 'react';
import {get} from 'lodash';

import {superdeskApi} from '../../../superdeskApi';

import {GENERIC_ITEM_ACTIONS} from '../../../constants';
import {onEventCapture} from '../../../utils';

import {Popup, Content} from '../../UI/Popup';

interface IProps {
    target: string;
    actions: Array<{
        key?: string;
        label: string;
        text?: string;
        icon: string;
        callback(): void;
    }>;
    closeMenu(event: React.MouseEvent<HTMLButtonElement>): void;
    openAdvanced(event: React.MouseEvent<HTMLButtonElement>): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

export class CoveragesMenuPopup extends React.PureComponent<IProps> {
    triggerAction(action, event) {
        this.props.closeMenu(event);
        action.callback();
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {actions, closeMenu, target, onPopupOpen, onPopupClose} = this.props;

        let items = actions.map(this.renderItem.bind(this));

        return (
            <Popup
                target={target}
                close={closeMenu}
                noPadding={true}
                className="item-actions-menu__popup"
                onPopupOpen={onPopupOpen}
                onPopupClose={onPopupClose}
            >
                <Content noPadding={true}>
                    <ul className="dropdown dropdown__menu more-activity-menu open">
                        <li onClick={onEventCapture.bind(this)}>
                            <div className="dropdown__menu-label">
                                {gettext('Coverage Type')}
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
                        <li className="dropdown__menu-divider" />
                        <li>
                            <button onClick={this.props.openAdvanced}>
                                <i className="icon-external" />
                                {gettext('Advanced mode')}
                            </button>
                        </li>
                    </ul>
                </Content>
            </Popup>
        );
    }

    renderItem(action) {
        const key = action.key ? action.key : action.label;

        if (get(action, 'text')) {
            // Header of a menu
            return (
                <div className="dropdown__menu-label">{action.text}</div>
            );
        }

        if (action.label === GENERIC_ITEM_ACTIONS.DIVIDER.label) {
            return <li key={key} className="dropdown__menu-divider" />;
        }

        const trigger = this.triggerAction.bind(this, action);

        return (
            <li key={key}>
                <button id={action.id} onClick={trigger}>
                    {action.icon && (<i className={action.icon} />)}
                    {action.label}
                </button>
            </li>
        );
    }
}
