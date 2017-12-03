import React from 'react';
import PropTypes from 'prop-types';
import {Tab} from './Tab';

export class Tabs extends React.Component {
    constructor(props) {
        super(props);
        this.renderTab = this.renderTab.bind(this);
    }

    renderTab(child) {
        if (!child) {
            return null;
        }

        const {tabName, activeTab, onChangeTab} = child.props;

        if (!tabName || !activeTab || !onChangeTab) {
            return null;
        }

        return React.createElement(
            Tab,
            {
                tabName: tabName,
                onChangeTab: onChangeTab,
                activeTab: activeTab,
                key: child.key || tabName,
            }
        );
    }

    render() {
        let {children} = this.props;

        if (!children) {
            return null;
        }

        const tabs = (Array.isArray(children) ? children : [children]).map((child) => (this.renderTab(child)));

        return (
            <ul className="nav nav-tabs">
                { tabs }
            </ul>
        );
    }
}

Tabs.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array,
    ]),
};
