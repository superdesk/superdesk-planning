import React from 'react';
import PropTypes from 'prop-types';
import {SubNav} from '../UI/SubNav';
import {SearchBox, Button} from '../UI';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {gettext} from '../../utils';


export class LocationsSubNavComponent extends React.Component {
    constructor(props) {
        super(props);
        this.executeSearch = this.props.executeSearch.bind(this);
        this.searchQuery = this.props.searchQuery;
        this.createLocation = this.props.createLocation.bind(this);
    }

    componentWillMount() {
        this.props.executeSearch(this.props.searchQuery);
    }

    render() {
        return (
            <SubNav>
                <SearchBox
                    label={gettext('Search Locations')}
                    value={this.searchQuery}
                    search={this.executeSearch}
                    activeFilter=""
                />
                {!this.props.editOpen &&
                <Button
                    className="sd-create-btn"
                    icon="icon-plus-large"
                    onClick={this.createLocation}
                    empty={true}
                    title={gettext('Create a new location')}>
                    <span className="circle" />
                </Button>}
            </SubNav>
        );
    }
}


LocationsSubNavComponent.propTypes = {
    searchQuery: PropTypes.string,
    executeSearch: PropTypes.func,
    createLocation: PropTypes.func,
    editOpen: PropTypes.bool,
};


const mapStateToProps = (state) => ({
    searchQuery: selectors.locations.getLocationSearchQuery(state),
    editOpen: selectors.locations.getEditLocationOpen(state),
});

const mapDispatchToProps = (dispatch) => ({
    executeSearch: (text) => dispatch(actions.locations.searchLocations(text)),
    createLocation: () => dispatch(actions.locations.createLocation()),
});

export const LocationsSubNav = connect(mapStateToProps, mapDispatchToProps)(LocationsSubNavComponent);