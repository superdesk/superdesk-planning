import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext} from '../../../utils';
import * as selectors from '../../../selectors';
import {get} from 'lodash';
import {CoveragePreview} from '../../Coverages';
import {ContentBlock} from '../../UI/SidePanel';
import {EventMetadata} from '../../Events';
import {PlanningInfo} from './PlanningInfo';
import {MenuItem} from '../../Main/ItemEditorModal/MenuItem';
import {Label} from '../../UI/Form';

export class PlanningMenuPanelComponent extends React.Component {
    render() {
        const {item,
            event,
            users,
            formProfile,
            desks,
            newsCoverageStatus,
            lockedItems,
            onMenuItemClick,
            activeItem,
        } = this.props;
        const hasCoverage = get(item, 'coverages.length', 0) > 0;

        return (
            <ContentBlock>
                <PlanningInfo
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'planning')}
                    active={activeItem === 'planning'}
                />
                <MenuItem
                    label={gettext('Details...')}
                    onClick={onMenuItemClick.bind(null, 'details')}
                    active={activeItem === 'details'}
                />
                {event && (<Label row text={gettext('Associated Event')} />)}
                {event && (
                    <ContentBlock>
                        <EventMetadata
                            event={event}
                            lockedItems={lockedItems}
                            onClick={onMenuItemClick.bind(null, 'event')}
                            active={activeItem === 'event'}
                            noOpen
                            showIcon={false}
                            showBorder={false}
                        />
                    </ContentBlock>
                )}
                {hasCoverage && <Label row text={gettext('Coverages')} />}
                {hasCoverage && (
                    item.coverages.map((c, index) => (
                        <CoveragePreview
                            key={index}
                            coverage={c}
                            users= {users}
                            desks= {desks}
                            newsCoverageStatus={newsCoverageStatus}
                            formProfile={formProfile.coverage}
                            onClick={onMenuItemClick.bind(null, c.coverage_id)}
                            active={activeItem === c.coverage_id}
                            noOpen
                            scrollInView
                        />
                    ))
                )}
            </ContentBlock>
        );
    }
}

PlanningMenuPanelComponent.propTypes = {
    item: PropTypes.object,
    users: PropTypes.array,
    desks: PropTypes.array,
    lockedItems: PropTypes.object,
    formProfile: PropTypes.object,
    event: PropTypes.object,
    newsCoverageStatus: PropTypes.array,
    activeItem: PropTypes.string,
    onMenuItemClick: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
    lockedItems: selectors.locks.getLockedItems(state),
    formProfile: selectors.forms.profiles(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    event: selectors.events.planningEditAssociatedEventModal(state),
});

export const PlanningMenuPanel = connect(mapStateToProps, null)(PlanningMenuPanelComponent);
