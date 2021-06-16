import React from 'react';
import PropTypes from 'prop-types';
import {PageContent} from './PageContent';
import {connect} from 'react-redux';

import {superdeskApi} from '../superdeskApi';

import {LocationsList, LocationsEditor, LocationsSubNav} from '../components/Locations';
import * as selectors from '../selectors';

export const LocationsUi = ({editorOpen}) => (
    <PageContent
        ariaTitle={superdeskApi.localization.gettext('Locations Content')}
        showWorkqueue={false}
        splitView={true}

        editorOpen={editorOpen}
        ListPanel={LocationsList}
        SubNavPanel={LocationsSubNav}
        EditorPanel={editorOpen ? LocationsEditor : null}
    />
);

LocationsUi.propTypes = {
    editorOpen: PropTypes.bool,
};

const mapStateToProps = (state) => ({
    editorOpen: selectors.locations.getEditLocationOpen(state),
});


export const LocationsApp = connect(
    mapStateToProps
)(LocationsUi);
