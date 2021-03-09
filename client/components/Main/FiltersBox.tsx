import React from 'react';
import {connect} from 'react-redux';
import {gettext} from '../../utils';

import {Checkbox, CheckboxGroup} from '../UI/Form';
import {StretchBar} from '../UI/SubNav';

import {PLANNING_VIEW} from '../../interfaces';
import {activeFilter as getCurrentView} from '../../selectors/main';
import {planningApi} from '../../superdeskApi';

interface IProps {
    showFilters?: boolean; // defaults to true
    currentView: PLANNING_VIEW;
}

const mapStateToProps = (state) => ({
    currentView: getCurrentView(state),
});

class FiltersBoxComponent extends React.PureComponent<IProps> {
    render() {
        const filters = !(this.props.showFilters ?? true) ?
            [] :
            [
                {
                    label: gettext('Events & Planning'),
                    filter: PLANNING_VIEW.COMBINED,
                },
                {
                    label: gettext('Events only'),
                    filter: PLANNING_VIEW.EVENTS,
                },
                {
                    label: gettext('Planning only'),
                    filter: PLANNING_VIEW.PLANNING,
                },
            ];

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
