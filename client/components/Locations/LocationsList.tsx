import React from 'react';
import {connect} from 'react-redux';

import {appConfig} from 'appConfig';
import {ILocation} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {getMapUrl} from '../../utils';
import {formatLocationToAddress} from '../../utils/locations';

import {List} from '../UI';

interface IProps {
    currentLocation?: ILocation;
    locations: Array<ILocation>;
    isLoading?: boolean;
    editLocation(location: ILocation): void;
    loadMore(): void;
    deleteLocation(location: ILocation): void;
}

interface IState {
    scrollTop: number;
    activeItemIndex: number;
    navigateDown: boolean;
}

const mapStateToProps = (state) => ({
    locations: selectors.locations.locations(state),
    isLoading: selectors.locations.loadingLocations(state),
    currentLocation: selectors.locations.getEditLocation(state),
});

const mapDispatchToProps = (dispatch) => ({
    editLocation: (location) => dispatch(actions.locations.editLocation(location)),
    loadMore: () => dispatch(actions.locations.getMoreLocations()),
    deleteLocation: (location) => dispatch(actions.locations.deleteLocationConfirmation(location)),
});

export class LocationsListComponent extends React.Component<IProps, IState> {
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
        const {gettext} = superdeskApi.localization;

        return (
            <div className="sd-column-box__main-column__items" onScroll={this.handleScroll}>
                {this.props.locations?.length ? null : (
                    <span className="sd-alert">
                        {gettext('No result')}
                    </span>
                )}
                {this.props.locations.map((location, index) => (
                    <List.Item
                        shadow={1}
                        key={location._id}
                        onClick={this.props.editLocation.bind(null, location)}
                        activated={location._id === this.props.currentLocation?._id}
                    >
                        <List.Column grow={false} border={true}>
                            <List.Row>
                                <a
                                    title={gettext('Show on map')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    href={getMapUrl(
                                        appConfig.street_map_url,
                                        location.name,
                                        formatLocationToAddress(location)
                                    )}
                                >
                                    <i className="sd-list-item__location" />
                                </a>
                            </List.Row>
                        </List.Column>
                        <List.Column grow={true} border={false}>
                            <List.Row>
                                <span className="sd-list-item__strong">
                                    {location.name}
                                </span>
                                <span className="sd-list-item__text-label">
                                    {gettext('Address')}:
                                </span>
                                <span className="sd-list-item__normal">
                                    {location.address.line?.[0]}
                                </span>
                                <span className="sd-list-item__text-label">
                                    {gettext('City/Town')}:
                                </span>
                                <span className="sd-list-item__normal">
                                    {location.address.city ?? location.address.area}
                                </span>
                                <span className="sd-list-item__text-label">
                                    {gettext('State/Province/Region')}:
                                </span>
                                <span className="sd-list-item__normal">
                                    {location.address.state ?? location.address.locality}
                                </span>
                                <span className="sd-list-item__text-label">
                                    {gettext('Post Code')}:
                                </span>
                                <span className="sd-list-item__normal">
                                    {location.address.postal_code}
                                </span>
                                <span className="sd-list-item__text-label">
                                    {gettext('Country')}:
                                </span>
                                <span className="sd-list-item__normal">
                                    {location.address.country}
                                </span>
                            </List.Row>
                        </List.Column>
                        <List.ActionMenu>
                            <button onClick={this.props.deleteLocation.bind(null, location)}>
                                <i className="icon-trash" /></button>
                        </List.ActionMenu>
                    </List.Item>
                ))}
            </div>
        );
    }
}

export const LocationsList = connect(
    mapStateToProps,
    mapDispatchToProps
)(LocationsListComponent);
