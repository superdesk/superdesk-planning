import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext} from '../../../utils';
import {get} from 'lodash';
import * as selectors from '../../../selectors';

import {ContentBlock} from '../../UI/SidePanel';
import {EventInfo} from './EventInfo';
import {MenuItem} from '../../Main/ItemEditorModal/MenuItem';
import {PlanningMetaData} from '../../RelatedPlannings/PlanningMetaData';
import {Label} from '../../UI/Form';

export class EventMenuPanelComponent extends React.Component {
    render() {
        const {item,
            dateFormat,
            timeFormat,
            onMenuItemClick,
            activeItem,
            users,
            desks,
            plannings,
        } = this.props;

        return (
            <ContentBlock>
                <EventInfo
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'event')}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    active={activeItem === 'event'} />
                <MenuItem label={gettext('Contacts')}
                    onClick={onMenuItemClick.bind(null, 'contacts')}
                    active={activeItem === 'contacts'}/>
                <MenuItem label={gettext('Details...')}
                    onClick={onMenuItemClick.bind(null, 'details')}
                    active={activeItem === 'details'}/>
                <MenuItem label={gettext('Files')}
                    onClick={onMenuItemClick.bind(null, 'files')}
                    active={activeItem === 'files'}/>
                <MenuItem label={gettext('Links')}
                    onClick={onMenuItemClick.bind(null, 'links')}
                    active={activeItem === 'links'}/>
                {get(plannings, 'length', 0) > 0 && <Label row text={gettext('Related Plannings')} />}
                {plannings && (
                    plannings.map((plan, index) => (<PlanningMetaData
                        key={index}
                        field={`plannings[${index}]`}
                        plan={plan}
                        users={users}
                        desks={desks}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                        onClick={onMenuItemClick.bind(null, 'plannings[' + index + ']')}
                        active={activeItem === 'plannings[' + index + ']'}
                        noOpen
                        tabEnabled
                        scrollInView />)
                    ))}
            </ContentBlock>
        );
    }
}

EventMenuPanelComponent.propTypes = {
    item: PropTypes.object,
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    activeItem: PropTypes.string,
    onMenuItemClick: PropTypes.func,
    plannings: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
};

const mapStateToProps = (state, ownProps) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    plannings: selectors.events.getRelatedPlanningsForModalEvent(state),
});

export const EventMenuPanel = connect(mapStateToProps, null)(EventMenuPanelComponent);
