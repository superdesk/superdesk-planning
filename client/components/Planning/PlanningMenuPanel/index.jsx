import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext} from '../../../utils';
import * as selectors from '../../../selectors';
import {get} from 'lodash';
import {CoveragePreview} from '../../Coverages';
import {ContentBlock} from '../../UI/SidePanel';
import {EventMetadata} from '../../Events';
import {PlanningMetaData} from './PlanningMetaData';
import {PlanningDetails} from './PlanningDetails';

export class PlanningMenuPanelComponent extends React.Component {
    render() {
        const {item,
            event,
            users,
            formProfile,
            dateFormat,
            timeFormat,
            desks,
            newsCoverageStatus,
            lockedItems,
            onMenuItemClick,
            activeItem,
        } = this.props;
        const hasCoverage = get(item, 'coverages.length', 0) > 0;

        return (
            <ContentBlock>
                <PlanningMetaData
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'planning')}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    active={activeItem === 'planning'} />
                <PlanningDetails item={item}
                    onClick={onMenuItemClick.bind(null, 'details')}
                    active={activeItem === 'details'}/>
                {event && (
                    <h3 className="side-panel__heading side-panel__heading--big">
                        {gettext('Associated Event')}
                    </h3>
                )}

                {event && (
                    <ContentBlock>
                        <EventMetadata
                            event={event}
                            dateFormat={dateFormat}
                            timeFormat={timeFormat}
                            lockedItems={lockedItems}
                            onClick={onMenuItemClick.bind(null, 'event')}
                            active={activeItem === 'event'}
                            noOpen
                        />
                    </ContentBlock>
                )}
                {hasCoverage &&
                    (<h3 className="side-panel__heading--big">{gettext('Coverages')}</h3>)}
                {hasCoverage && (
                    item.coverages.map((c, index) => <CoveragePreview
                        key={index}
                        coverage={c}
                        users= {users}
                        desks= {desks}
                        newsCoverageStatus={newsCoverageStatus}
                        dateFormat={dateFormat}
                        timeFormat={timeFormat}
                        formProfile={formProfile.coverage}
                        onClick={onMenuItemClick.bind(null, 'coverages[' + index + ']')}
                        active={activeItem === 'coverages[' + index + ']'}
                        noOpen />)
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
    dateFormat: PropTypes.string,
    timeFormat: PropTypes.string,
    newsCoverageStatus: PropTypes.array,
    activeItem: PropTypes.string,
    onMenuItemClick: PropTypes.func,
};

const mapStateToProps = (state, ownProps) => ({
    desks: selectors.getDesks(state),
    users: selectors.getUsers(state),
    lockedItems: selectors.locks.getLockedItems(state),
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
    formProfile: selectors.forms.profiles(state),
    newsCoverageStatus: selectors.getNewsCoverageStatus(state),
    event: selectors.events.planningEditAssociatedEvent(state),

});

export const PlanningMenuPanel = connect(mapStateToProps, null)(PlanningMenuPanelComponent);
