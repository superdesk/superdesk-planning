import React from 'react';
import {connect} from 'react-redux';
import {gettext} from '../../utils';

import {Checkbox, CheckboxGroup} from '../UI/Form';
import {StretchBar} from '../UI/SubNav';

import {PLANNING_VIEW} from '../../interfaces';
import {activeFilter as getCurrentView} from '../../selectors/main';
import {planningApi, superdeskApi} from '../../superdeskApi';
import {PRIVILEGES} from '../../constants';
import * as selectors from '../../selectors';

interface IProps {
    showFilters?: boolean; // defaults to true
    currentView: PLANNING_VIEW;
    privileges: {[key: string]: number};
    currentFilterId?: any;
}

const mapStateToProps = (state) => ({
    currentView: getCurrentView(state),
    currentFilterId: selectors.main.currentSearchFilterId(state),
});

class FiltersBoxComponent extends React.PureComponent<IProps> {
    componentDidUpdate(): void {
        const {urlParams} = superdeskApi.browser.location;

        urlParams.setString('eventsPlanningFilter', this.props.currentFilterId);
    }

    render() {
        const privileges = this.props.privileges;
        let filter_items = [];

        if (privileges[PRIVILEGES.EVENT_MANAGEMENT] && privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
            filter_items.push({
                label: gettext('Events & Planning'),
                filter: PLANNING_VIEW.COMBINED,
            });
        }
        if (privileges[PRIVILEGES.EVENT_MANAGEMENT]) {
            filter_items.push({
                label: gettext('Events only'),
                filter: PLANNING_VIEW.EVENTS,
            });
        }
        if (privileges[PRIVILEGES.PLANNING_MANAGEMENT]) {
            filter_items.push({
                label: gettext('Planning only'),
                filter: PLANNING_VIEW.PLANNING,
            });
        }
        const filters = !(this.props.showFilters ?? true) ?
            [] : filter_items;

        return (
            <StretchBar>
                <CheckboxGroup>
                    {filters.map((filter) => (
                        <Checkbox
                            key={filter.filter}
                            label={filter.label}
                            value={this.props.currentView}
                            checkedValue={filter.filter}
                            onChange={(field, value) => planningApi.ui.list.changeCurrentView(value)}
                            type="radio"
                            labelPosition="inside"
                            testId={`view-${filter.filter}`}
                        />
                    ))}
                </CheckboxGroup>
            </StretchBar>
        );
    }
}

export const FiltersBox = connect(mapStateToProps)(FiltersBoxComponent);
