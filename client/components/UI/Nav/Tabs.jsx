import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export const Tabs = ({tabs, active, setActive, className}) => (
    <ul className={'nav-tabs ' + className}>
        {tabs.map((tab, index) => (
            !get(tab, 'enabled', true) ?
                null :
                <li key={tab.label} className={'nav-tabs__tab' + (active === index ? ' nav-tabs__tab--active' : '')}>
                    <button className="nav-tabs__link" onClick={() => setActive(index)}>{tab.label}</button>
                </li>
        ))}
    </ul>
);

Tabs.propTypes = {
    tabs: PropTypes.arrayOf(PropTypes.shape({
        enabled: PropTypes.bool,
        label: PropTypes.string.isRequired,
    })),
    active: PropTypes.number.isRequired,
    setActive: PropTypes.func.isRequired,
    className: PropTypes.string,
};
