import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Tab = ({activeTab, tabName, onChangeTab}) => (
    <li className={ classNames('nav-tabs__tab',
        {'nav-tabs__tab--active': activeTab === tabName}) } >
        <button
            className="nav-tabs__link"
            onClick={ onChangeTab }>
            <span>{ tabName }</span>
        </button>
    </li>
);

Tab.propTypes = {
    activeTab: PropTypes.string.isRequired,
    tabName: PropTypes.string.isRequired,
    onChangeTab: PropTypes.func.isRequired,
};