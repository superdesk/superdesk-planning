import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {gettext} from '../../../utils';
import * as selectors from '../../../selectors';

import {ContentBlock} from '../../UI/SidePanel';
import {EventInfo} from './EventInfo';
import {MenuItem} from '../../Main/ItemEditorModal/MenuItem';

export class EventMenuPanelComponent extends React.Component {
    render() {
        const {item,
            dateFormat,
            timeFormat,
            onMenuItemClick,
            activeItem,
        } = this.props;

        return (
            <ContentBlock>
                <EventInfo
                    item={item}
                    onClick={onMenuItemClick.bind(null, 'event')}
                    dateFormat={dateFormat}
                    timeFormat={timeFormat}
                    active={activeItem === 'event'} />
                <MenuItem label={gettext('Details...')}
                    onClick={onMenuItemClick.bind(null, 'details')}
                    active={activeItem === 'details'}/>
                <MenuItem label={gettext('Files')}
                    onClick={onMenuItemClick.bind(null, 'files')}
                    active={activeItem === 'files'}/>
                <MenuItem label={gettext('Links')}
                    onClick={onMenuItemClick.bind(null, 'links')}
                    active={activeItem === 'links'}/>
                <MenuItem label={gettext('Related Planning')}
                    onClick={onMenuItemClick.bind(null, 'plannings')}
                    active={activeItem === 'plannings'}/>
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
};

const mapStateToProps = (state, ownProps) => ({
    dateFormat: selectors.config.getDateFormat(state),
    timeFormat: selectors.config.getTimeFormat(state),
});

export const EventMenuPanel = connect(mapStateToProps, null)(EventMenuPanelComponent);
