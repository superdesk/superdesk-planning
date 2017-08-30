import React from 'react'
import PropTypes from 'prop-types'
import { get } from 'lodash'

export class WorkqueueList extends React.Component {
    constructor(props) {
        super(props)
    }

    openEventItem(item) {
        if (!this.props.isEventListShown)  {
            this.props.toggleEventsList()
        }
        this.props.openEventDetails(item)
    }

    render() {
        return (
            <div className="opened-articles">
                <div className="quick-actions pull-left">
                    <button>
                        <i className="icon-th-large icon--white" />
                    </button>
                </div>
                <ul className="list full-width">
                    {get(this.props.workqueueItems, 'Events').map((openedItem, index) => {
                        const active = openedItem._id === this.props.currentEvent
                        return (<li key={index} className={active ? 'active' : ''}>
                            <a className="title" onClick={this.openEventItem.bind(this, openedItem)}>
                                <i className={active ? 'icon-calendar-list icon--white' : 'icon-calendar-list icon--blue'} />
                                <span className="item-label">
                                    { openedItem.headline || openedItem.slugline  || 'Untitled' }
                                </span>
                            </a>

                            <button className="close" onClick={this.props.closeEventDetails.bind(null, openedItem)}>
                                <i className="icon-close-small icon--white" />
                            </button>
                        </li>)
                    })}
                    {get(this.props.workqueueItems, 'Plannings').map((openedItem, index) => {
                        const active = openedItem._id === this.props.currentPlanningId
                        return (<li key={index} className={active ? 'active' : ''}>
                            <a className="title" onClick={this.props.openPlanningClick.bind(null, openedItem, openedItem.agendas[0])}>
                                <i className={active ? 'icon-calendar icon--white' : 'icon-calendar icon--blue'} />
                                <span className="item-label">
                                    { openedItem.headline || openedItem.slugline  || 'Untitled' }
                                </span>
                            </a>

                            <button className="close" onClick={this.props.closePlanningItem.bind(null, openedItem)}>
                                <i className="icon-close-small icon--white" />
                            </button>
                        </li>)
                    })}
                </ul>
            </div>
        )
    }
}

WorkqueueList.propTypes = {
    workqueueItems: PropTypes.object,
    currentPlanningId: PropTypes.string,
    currentEvent: PropTypes.string,
    isEventListShown: PropTypes.bool,
    closePlanningItem: PropTypes.func,
    openPlanningClick: PropTypes.func,
    openEventDetails: PropTypes.func,
    closeEventDetails: PropTypes.func,
    toggleEventsList: PropTypes.func,
}
