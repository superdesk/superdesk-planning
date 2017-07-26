import React from 'react'

export class TabContent extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        const { children, activeTab, tabName } = this.props
        if (!children || children.length === 0 || activeTab !== tabName) {
            return null
        }
        return (
            <div className="nav-tabs__content">
                <div className="nav-tabs__pane" >
                    { children }
                </div>
            </div>
        )
    }
}

TabContent.propTypes = {
    activeTab: React.PropTypes.string.isRequired,
    tabName: React.PropTypes.string.isRequired,
    children: React.PropTypes.node,
}
