import React from 'react';
import PropTypes from 'prop-types';
import {ListGroup} from './';
import {PanelInfo} from '../UI';
import {EVENTS, PLANNING} from '../../constants';

export class ListPanel extends React.PureComponent {
    render() {
        const {
            groups,
            onItemClick,
            onDoubleClick,
            lockedItems,
            dateFormat,
            timeFormat,
            agendas,
            session,
            privileges,
        } = this.props;

        return groups.length <= 0 ? (
            <div className="sd-column-box__main-column">
                <PanelInfo
                    heading="No Event or Planning items found"
                    description="Create new items or change your search filters"
                />
            </div>
        ) : (
            <div className="sd-column-box__main-column">
                {groups.map((group) => {
                    const listGroupProps = {
                        name: group.date,
                        items: group.events,
                        onItemClick: onItemClick,
                        onDoubleClick: onDoubleClick,
                        lockedItems: lockedItems,
                        dateFormat: dateFormat,
                        timeFormat: timeFormat,
                        agendas: agendas,
                        session: session,
                        privileges: privileges,
                        [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.DUPLICATE.actionName],
                        [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName],
                        [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.UNSPIKE.actionName],
                        [EVENTS.ITEM_ACTIONS.SPIKE.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.SPIKE.actionName],
                        [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]:
                            this.props[EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName],
                        [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.DUPLICATE.actionName],
                        [PLANNING.ITEM_ACTIONS.SPIKE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.SPIKE.actionName],
                        [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.UNSPIKE.actionName],
                        [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName],
                        [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]:
                            this.props[PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]
                    };

                    return <ListGroup key={group.date} {...listGroupProps} />;
                })}
            </div>
        );
    }
}

ListPanel.propTypes = {
    groups: PropTypes.array,
    onItemClick: PropTypes.func.isRequired,
    onDoubleClick: PropTypes.func,
    lockedItems: PropTypes.object.isRequired,
    editItem: PropTypes.object,
    previewItem: PropTypes.object,
    dateFormat: PropTypes.string.isRequired,
    timeFormat: PropTypes.string.isRequired,
    agendas: PropTypes.array.isRequired,
    session: PropTypes.object,
    privileges: PropTypes.object,
    [EVENTS.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CREATE_PLANNING.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [EVENTS.ITEM_ACTIONS.CANCEL_EVENT.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.DUPLICATE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.SPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.UNSPIKE.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_PLANNING.actionName]: PropTypes.func,
    [PLANNING.ITEM_ACTIONS.CANCEL_ALL_COVERAGE.actionName]: PropTypes.func,
};
