import React from 'react'
import classNames from 'classnames'

export const Tab = ({ activeTab, tabName, onChangeTab }) => {

    return (
        <li className={ classNames('nav-tabs__tab',
            { 'nav-tabs__tab--active': activeTab === tabName }) } >
            <button
                className="nav-tabs__link"
                onClick={ onChangeTab }>
                <span>{ tabName }</span>
            </button>
        </li>
    )
}

Tab.propTypes = {
    activeTab: React.PropTypes.string.isRequired,
    tabName: React.PropTypes.string.isRequired,
    onChangeTab: React.PropTypes.func.isRequired,
}