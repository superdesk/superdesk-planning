import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    ModalsContainer,
    EventsPanelContainer,
    PlanningPanelContainer,
    WorkqueueContainer,
} from './index';
import {get} from 'lodash';
import * as selectors from '../selectors';
import {WORKSPACE} from '../constants';

const PlanningAppComponent = ({showEvents, currentWorkspace}) => {
    if (currentWorkspace !== WORKSPACE.PLANNING) {
        return null;
    }

    const classes = [
        'Planning',
        showEvents ? null : 'Planning--hide-events',
    ];

    return (
        <div className={classes.join(' ')}>
            <ModalsContainer />
            <EventsPanelContainer />
            <PlanningPanelContainer />
            <WorkqueueContainer />
        </div>
    );
};

PlanningAppComponent.propTypes = {
    showEvents: PropTypes.bool,
    currentWorkspace: PropTypes.string,
};

const mapStateToProps = (state) => ({
    showEvents: get(state, 'events.show', true),
    currentWorkspace: selectors.getCurrentWorkspace(state),
});

export const PlanningApp = connect(mapStateToProps)(PlanningAppComponent);
