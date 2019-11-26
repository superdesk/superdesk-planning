import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {List} from '../UI';
import {formatAddress, getMapUrl, gettext} from '../../utils';
import {get} from 'lodash';

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
                {get(this.props.locations, 'length') === 0 && (
                    <span className="sd-alert">{gettext('No result')}</span>)}
                {this.props.locations.map((location, index) => (
                    <List.Item shadow={1} key={location._id} onClick={this.props.editLocation.bind(null, location)}
                        activated={location._id === get(this.props.currentLocation, '_id')}>
                        <List.Column grow={false} border={true}>
                            <List.Row>
                                <a
                                    title={gettext('Show on map')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={getMapUrl(this.props.streetMapUrl, get(location, 'name'),
                                        get(formatAddress(location), 'formattedAddress'))}>
                                    <i className="sd-list-item__location"/>
                                </a>
                            </List.Row>
                        </List.Column>
                        <List.Column grow={true} border={false}>
                            <List.Row>
                                <span className="sd-list-item__strong">
                                    {get(location, 'name')}
                                </span>
                                <span className="sd-list-item__text-label">{gettext('Address')}:</span>
                                <span
                                    className="sd-list-item__normal">{get(formatAddress(location), 'address.line[0]')}
                                </span>
                                <span className="sd-list-item__text-label">{gettext('City/Town')}:</span>
                                <span
                                    className="sd-list-item__normal">{get(formatAddress(location), 'address.area')}
                                </span>
                                <span className="sd-list-item__text-label">{gettext('State/Province/Region')}:</span>
                                <span
                                    className="sd-list-item__normal">{get(formatAddress(location), 'address.locality')}
                                </span>
                                <span className="sd-list-item__text-label">{gettext('Post Code')}:</span>
                                <span
                                    className="sd-list-item__normal">{get(formatAddress(location),
                                        'address.postal_code')}
                                </span>
                                <span className="sd-list-item__text-label">{gettext('Country')}:</span>
                                <span
                                    className="sd-list-item__normal">{get(formatAddress(location), 'address.country')}
                                </span>
                            </List.Row>
                        </List.Column>
                        <List.ActionMenu>
                            <button onClick={this.props.deleteLocation.bind(null, location)}>
                                <i className="icon-trash"/></button>
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
    currentLocation: PropTypes.object,
};

const mapStateToProps = (state) => ({
    locations: selectors.locations.locations(state),
    isLoading: selectors.locations.loadingLocations(state),
    streetMapUrl: selectors.config.getStreetMapUrl(state),
    currentLocation: selectors.locations.getEditLocation(state),
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
