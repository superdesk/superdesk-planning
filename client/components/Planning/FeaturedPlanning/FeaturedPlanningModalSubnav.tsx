import * as React from 'react';
import {Moment} from 'moment';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {appConfig} from 'appConfig';

import * as selectors from '../../../selectors';
import * as actions from '../../../actions';

import {SubNav, SlidingToolBar} from '../../UI/SubNav';
import {JumpToDropdown} from '../../Main';

interface IProps {
    loading: boolean;
    itemUpdatedAfterPosting: boolean;
    notifications: Array<string>;
    currentSearchDate: Moment;

    cancelNotifications(): void;
    onDateChange(date: Moment): void;
}

export class FeaturedPlanningModalSubnavComponent extends React.Component<IProps, any> {
    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <SubNav className="grid" testId="featured-modal--subnav">
                {!this.props.notifications.length ? (
                    <div className="grid__item" data-test-id="featured-modal--current-date">
                        <JumpToDropdown
                            currentStartFilter={this.props.currentSearchDate}
                            setStartFilter={this.props.onDateChange}
                            defaultTimeZone={appConfig.default_timezone}
                            dateFormat="dddd LL"
                            noBorderNoPadding={true}
                            disabled={this.props.loading}
                        />
                    </div>
                ) : (
                    <SlidingToolBar
                        onCancel={this.props.cancelNotifications}
                        innerInfo={this.props.notifications.join(', ')}
                        cancelText={gettext('Close')}
                        rightCancelButton={true}
                    />
                )}
                {!this.props.loading ? null : (
                    <div className="loading-indicator">
                        {gettext('Loading')}
                    </div>
                )}
                {!this.props.itemUpdatedAfterPosting ? null : (
                    <div
                        className={classNames(
                            'sd-alert',
                            'sd-alert--alert',
                            'sd-alert--hollow',
                            'sd-alert--no-padding',
                            'sd-alert__icon',
                            'grid__item--col-1'
                        )}
                    >
                        {gettext('This list contains unposted changes!')}
                    </div>
                )}
            </SubNav>
        );
    }
}

const mapStateToProps = (state) => ({
    loading: selectors.featuredPlanning.loading(state),
    currentSearchDate: selectors.featuredPlanning.currentSearchDate(state),
    notifications: selectors.featuredPlanning.notificationList(state),
});

const mapDispatchToProps = (dispatch) => ({
    onDateChange: (date) => (
        dispatch(actions.planning.featuredPlanning.loadFeaturedPlanningsData(date))
    ),
    cancelNotifications: () => dispatch(actions.planning.featuredPlanning.clearFeaturedNotifications()),
});

export const FeaturedPlanningModalSubnav = connect(
    mapStateToProps,
    mapDispatchToProps,
)(FeaturedPlanningModalSubnavComponent);
