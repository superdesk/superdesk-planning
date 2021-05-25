import React from 'react';
import PropTypes from 'prop-types';
import {SubNav, Dropdown} from '../UI/SubNav';
import {SearchBox, Button} from '../UI';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {superdeskApi} from '../../superdeskApi';


export class LocationsSubNavComponent extends React.Component {
    constructor(props) {
        super(props);
        this.executeSearch = this.props.executeSearch.bind(this);
        this.createLocation = this.props.createLocation.bind(this);
        this.state = {
            searchQuery: this.props.searchQuery || '',
        };
    }

    componentWillMount() {
        this.props.executeSearch(this.state.searchQuery);
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <SubNav>
                <SearchBox
                    label={gettext('Search/Browse Locations')}
                    value={this.state.searchQuery}
                    search={this.executeSearch}
                    activeFilter=""
                    allowRemove={true}
                />
                <Dropdown
                    buttonLabel={this.props.searchType ? gettext('Search') : gettext('Browse')}
                    items={[{label: gettext('Search'), action: this.props.search},
                        {label: gettext('Browse'), action: this.props.browse}]}
                    tooltip={gettext('Select either Search or Browse the locations')}
                />
                {!this.props.editOpen && (
                    <Button
                        className="sd-create-btn"
                        icon="icon-plus-large"
                        onClick={this.createLocation}
                        empty={true}
                        title={gettext('Create a new location')}
                        aria-label={gettext('Create a new location')}
                    >
                        <span className="circle" />
                    </Button>
                )}
            </SubNav>
        );
    }
}


LocationsSubNavComponent.propTypes = {
    searchQuery: PropTypes.string,
    executeSearch: PropTypes.func,
    createLocation: PropTypes.func,
    editOpen: PropTypes.bool,
    search: PropTypes.func,
    browse: PropTypes.func,
    searchType: PropTypes.bool,
};


const mapStateToProps = (state) => ({
    searchQuery: selectors.locations.getLocationSearchQuery(state),
    editOpen: selectors.locations.getEditLocationOpen(state),
    searchType: selectors.locations.getSearchType(state),
});

const mapDispatchToProps = (dispatch) => ({
    executeSearch: (text) => dispatch(actions.locations.searchLocations(text)),
    createLocation: () => dispatch(actions.locations.createLocation()),
    search: () => dispatch(actions.locations.setSearch()),
    browse: () => dispatch(actions.locations.setBrowse()),
});

export const LocationsSubNav = connect(mapStateToProps, mapDispatchToProps)(LocationsSubNavComponent);