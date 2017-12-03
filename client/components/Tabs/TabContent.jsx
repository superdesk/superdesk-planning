import React from 'react';
import PropTypes from 'prop-types';

export class TabContent extends React.Component {
    render() {
        const {children, activeTab, tabName} = this.props;

        if (!children || children.length === 0 || activeTab !== tabName) {
            return null;
        }
        return (
            <div className="nav-tabs__content">
                <div className="nav-tabs__pane" >
                    { children }
                </div>
            </div>
        );
    }
}

TabContent.propTypes = {
    activeTab: PropTypes.string.isRequired,
    tabName: PropTypes.string.isRequired,
    children: PropTypes.node,
};
