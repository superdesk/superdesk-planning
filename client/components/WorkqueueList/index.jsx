import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

export class WorkqueueList extends React.Component {
    openEventItem(item) {
        if (!this.props.isEventListShown) {
            this.props.toggleEventsList();
        }

        this.props.openEventDetails(item);
        return Promise.resolve();
    }

    handleItemClose(item) {
        const type = item._type;
        const goToItemAction = type === 'events' ? this.openEventItem.bind(this, item) :
            this.props.openPlanningClick.bind(null, item);
        const ignoreAction = type === 'events' ? this.props.unlockAndCloseEventItem.bind(null, item) :
            this.props.unlockAndClosePlanningItem.bind(null, item);
        const unsavedItems = type === 'events' ? this.props.autosavedEventItems :
            this.props.autosavedPlanningItems;

        if (get(unsavedItems, item._id)) {
            this.props.openConfirmationModal(goToItemAction, ignoreAction);
        } else {
            ignoreAction(item);
        }
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
                        const active = openedItem._id === this.props.currentEvent;

                        return (<li key={index} className={active ? 'active' : ''}>
                            <a className="title" onClick={this.openEventItem.bind(this, openedItem)}>
                                <i className={active ? 'icon-calendar-list icon--white' :
                                    'icon-calendar-list icon--blue'} />
                                <span className="item-label">
                                    { openedItem.headline || openedItem.slugline || 'Untitled' }
                                </span>
                            </a>

                            <button className="close" onClick={this.handleItemClose.bind(this, openedItem)}>
                                <i className="icon-close-small icon--white" />
                            </button>
                        </li>);
                    })}
                    {get(this.props.workqueueItems, 'Plannings').map((openedItem, index) => {
                        const active = openedItem._id === this.props.currentPlanningId;

                        return (<li key={index} className={active ? 'active' : ''}>
                            <a className="title"
                                onClick={this.props.openPlanningClick.bind(null,
                                    openedItem, get(openedItem, 'agendas[0]'))}>
                                <i className={active ? 'icon-calendar icon--white' : 'icon-calendar icon--blue'} />
                                <span className="item-label">
                                    { openedItem.headline || openedItem.slugline || 'Untitled' }
                                </span>
                            </a>

                            <button className="close" onClick={this.handleItemClose.bind(this, openedItem)}>
                                <i className="icon-close-small icon--white" />
                            </button>
                        </li>);
                    })}
                </ul>
            </div>
        );
    }
}

WorkqueueList.propTypes = {
    workqueueItems: PropTypes.object,
    autosavedPlanningItems: PropTypes.object,
    autosavedEventItems: PropTypes.object,
    currentPlanningId: PropTypes.string,
    currentEvent: PropTypes.string,
    isEventListShown: PropTypes.bool,
    unlockAndClosePlanningItem: PropTypes.func,
    openPlanningClick: PropTypes.func,
    openEventDetails: PropTypes.func,
    unlockAndCloseEventItem: PropTypes.func,
    toggleEventsList: PropTypes.func,
    openConfirmationModal: PropTypes.func,
};
