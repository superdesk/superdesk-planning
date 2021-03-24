import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

import {gettext} from '../../../utils';
import {get} from 'lodash';
import * as selectors from '../../../selectors';

import {ContentBlock} from '../../UI/SidePanel';
import {EventInfo} from './EventInfo';
import {EventFiles} from './EventFiles';
import {EventLinks} from './EventLinks';
import {MenuItem} from '../../Main/ItemEditorModal/MenuItem';
import {PlanningMetaData} from '../../RelatedPlannings/PlanningMetaData';
import {Label} from '../../UI/Form';

export class EventMenuPanelComponent extends React.Component {
    render() {
        const {item,
            onMenuItemClick,
            activeItem,
            users,
            desks,
            plannings,
            contentTypes,
        } = this.props;

        return (
            <ContentBlock>
                <EventInfo
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'event')}
                    active={activeItem === 'event'}
                />
                <MenuItem
                    label={gettext('Contacts')}
                    onClick={onMenuItemClick.bind(null, 'contacts')}
                    active={activeItem === 'contacts'}
                />
                <MenuItem
                    label={gettext('Details...')}
                    onClick={onMenuItemClick.bind(null, 'details')}
                    active={activeItem === 'details'}
                />
                <EventFiles
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'files')}
                    active={activeItem === 'files'}
                />
                <EventLinks
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'links')}
                    active={activeItem === 'links'}
                />
                {get(plannings, 'length', 0) > 0 && <Label row text={gettext('Related Plannings')} />}
                {plannings && (
                    plannings.map((plan, index) => (
                        <PlanningMetaData
                            key={index}
                            field={`plannings[${index}]`}
                            plan={plan}
                            users={users}
                            desks={desks}
                            onClick={onMenuItemClick.bind(null, 'plannings[' + index + ']')}
                            active={activeItem === 'plannings[' + index + ']'}
                            contentTypes={contentTypes}
                            noOpen
                            tabEnabled
                            scrollInView
                        />
                    )
                    ))}
            </ContentBlock>
        );
    }
}

EventMenuPanelComponent.propTypes = {
    item: PropTypes.object,
    activeItem: PropTypes.string,
    onMenuItemClick: PropTypes.func,
    plannings: PropTypes.array,
    users: PropTypes.array,
    desks: PropTypes.array,
    contentTypes: PropTypes.array,
};

const mapStateToProps = (state, ownProps) => ({
    users: selectors.general.users(state),
    desks: selectors.general.desks(state),
    plannings: selectors.events.getRelatedPlanningsForModalEvent(state),
    contentTypes: selectors.general.contentTypes(state),

});

export const EventMenuPanel = connect(mapStateToProps, null)(EventMenuPanelComponent);
