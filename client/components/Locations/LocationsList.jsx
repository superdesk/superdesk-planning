import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {List} from '../UI';
import {formatAddress, getMapUrl, gettext} from '../../utils';

export class LocationsListComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            scrollTop: 0,
            activeItemIndex: -1, // Active item in the list
            navigateDown: true, // Navigation direction
        };
        this.handleScroll = this.handleScroll.bind(this);
    }


    handleScroll(event) {
        if (this.props.isLoading) {
            return;
        }

        const node = event.target;

        // scroll event gets fired on hover of each item in the list.
        // this.state.scrollTop is used to check if the scroll position has changed
        if (node && node.scrollTop + node.offsetHeight + 100 >= node.scrollHeight &&
            this.state.scrollTop < node.scrollTop) {
            this.props.loadMore();
        }
    }

    render() {
        return (
            <div className="sd-column-box__main-column__items" onScroll={this.handleScroll}>
                {this.props.locations.map((location, index) => (
                    <List.Item shadow={1} key={location._id}>
                        <List.Column grow={true} border={false}>
                            <List.Row>
                                <a
                                    title={gettext('Show on map')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={getMapUrl(this.props.streetMapUrl, location.name,
                                        formatAddress(location).formattedAddress)}>
                                    <i className="icon-map-marker icon--gray"/>
                                </a>
                                <span className="sd-list-item__strong">{location.name}</span>
                                {formatAddress(location).formattedAddress}
                            </List.Row>
                        </List.Column>
                        <List.ActionMenu>
                            <button onClick={this.props.deleteLocation.bind(null, location)}>
                                <i className="icon-trash"/></button>
                            <button onClick={this.props.editLocation.bind(null, location)}>
                                <i className="icon-pencil"/></button>
                        </List.ActionMenu>
                    </List.Item>
                ))}
            </div>
        );
    }
}

LocationsListComponent.propTypes = {
    editLocation: PropTypes.func,
    locations: PropTypes.array,
    loadMore: PropTypes.func,
    isLoading: PropTypes.bool,
    deleteLocation: PropTypes.func,
    streetMapUrl: PropTypes.string,
};

const mapStateToProps = (state) => ({
    locations: selectors.locations.locations(state),
    isLoading: selectors.locations.loadingLocations(state),
    streetMapUrl: selectors.config.getStreetMapUrl(state),
});

const mapDispatchToProps = (dispatch) => ({
    editLocation: (location) => dispatch(actions.locations.editLocation(location)),
    loadMore: () => dispatch(actions.locations.getMoreLocations()),
    deleteLocation: (location) => dispatch(actions.locations.deleteLocationConfirmation(location)),
});

export const LocationsList = connect(
    mapStateToProps,
    mapDispatchToProps
)(LocationsListComponent);
