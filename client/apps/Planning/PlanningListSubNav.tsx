import * as React from 'react';
import {connect} from 'react-redux';
import moment from 'moment';

import {planningApi, superdeskApi} from '../../superdeskApi';
import {LIST_VIEW_TYPE, SORT_FIELD, SORT_ORDER} from '../../interfaces';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {Button, ButtonGroup, Dropdown, SubNav, Tooltip, IconButton} from 'superdesk-ui-framework/react';
import {FilterSubnavDropdown} from '../../components/Main';
import {SubNavDatePicker} from './SubNavDatePicker';

interface IProps {
    currentStartFilter?: moment.Moment;
    listViewType: LIST_VIEW_TYPE;
    currentInterval: 'DAY' | 'WEEK' | 'MONTH';
    sortOrder: SORT_ORDER;
    sortField: SORT_FIELD;

    setStartFilter(value?: moment.Moment): void;
    jumpTo(interval: 'TODAY' | 'BACK' | 'FORWARD'): void;
    setJumpInterval(interval: 'DAY' | 'WEEK' | 'MONTH'): void;
}

const mapStateToProps = (state) => ({
    currentStartFilter: selectors.main.currentStartFilter(state),
    currentInterval: selectors.main.currentJumpInterval(state),
    listViewType: selectors.main.getCurrentListViewType(state),
    sortOrder: selectors.main.getCurrentSortOrder(state),
    sortField: selectors.main.getCurrentSortField(state),
});

const mapDispatchToProps = (dispatch) => ({
    setStartFilter: (value) => dispatch(actions.main.setStartFilter(value)),
    jumpTo: (interval) => dispatch(actions.main.jumpTo(interval)),
    setJumpInterval: (interval) => dispatch(actions.main.setJumpInterval(interval)),
});


class PlanningListSubNavComponent extends React.PureComponent<IProps> {
    intervalOptions: Array<{label: string, onSelect(): void}>
    sortFieldOptions: Array<{label: string, onSelect(): void}>

    constructor(props) {
        super(props);
        const {gettext} = superdeskApi.localization;

        this.toggleSortOrder = this.toggleSortOrder.bind(this);

        this.intervalOptions = [{
            label: gettext('Day'),
            onSelect: () => this.props.setJumpInterval('DAY'),
        }, {
            label: gettext('Week'),
            onSelect: () => this.props.setJumpInterval('WEEK'),
        }, {
            label: gettext('Month'),
            onSelect: () => this.props.setJumpInterval('MONTH'),
        }];

        this.sortFieldOptions = [{
            label: gettext('Scheduled Date'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.SCHEDULE),
        }, {
            label: gettext('Date Created'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.CREATED),
        }, {
            label: gettext('Date Updated'),
            onSelect: this.changeSortField.bind(this, SORT_FIELD.UPDATED),
        }];
    }

    toggleSortOrder() {
        planningApi.ui.list.search({
            sort_order: this.props.sortOrder === SORT_ORDER.ASCENDING ?
                SORT_ORDER.DESCENDING :
                SORT_ORDER.ASCENDING,
        });
    }

    changeSortField(field: SORT_FIELD) {
        planningApi.ui.list.search({sort_field: field});
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {currentStartFilter} = this.props;
        let intervalText: string;

        switch (this.props.currentInterval) {
        case 'DAY':
            intervalText = gettext('Day');
            break;
        case 'WEEK':
            intervalText = gettext('Week');
            break;
        case 'MONTH':
            intervalText = gettext('Month');
            break;
        }

        const iconTooltipText = this.props.sortOrder === SORT_ORDER.ASCENDING ?
            gettext('Ascending') :
            gettext('Descending');
        let dropdownText: string;

        switch (this.props.sortField) {
        case SORT_FIELD.SCHEDULE:
            dropdownText = gettext('Scheduled Date');
            break;
        case SORT_FIELD.CREATED:
            dropdownText = gettext('Date Created');
            break;
        case SORT_FIELD.UPDATED:
            dropdownText = gettext('Date Updated');
            break;
        }

        return (
            <SubNav zIndex={1}>
                <ButtonGroup align="inline">
                    <FilterSubnavDropdown />
                </ButtonGroup>
                <ButtonGroup align="right">
                    {this.props.listViewType === LIST_VIEW_TYPE.LIST ? (
                        <React.Fragment>
                            <div className="subnav__content-bar">
                                <Dropdown items={this.sortFieldOptions}>
                                    <span className="sd-margin-r--1">
                                        <span className="sd-text__normal">
                                            {gettext('Sort by:')}
                                        </span>
                                        &nbsp;
                                        <span className="sd-text__strong">
                                            {dropdownText}
                                        </span>
                                        <span className="dropdown__caret" />
                                    </span>
                                </Dropdown>
                                <Tooltip
                                    key={iconTooltipText}
                                    text={iconTooltipText}
                                    flow="down"
                                >
                                    <IconButton
                                        ariaValue={iconTooltipText}
                                        onClick={this.toggleSortOrder}
                                        icon={this.props.sortOrder ?? SORT_ORDER.ASCENDING}
                                    />
                                </Tooltip>
                            </div>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <SubNavDatePicker
                                date={this.props.currentStartFilter}
                                onChange={this.props.setStartFilter}
                            />
                            <IconButton
                                ariaValue="back"
                                onClick={() => this.props.jumpTo('BACK')}
                                icon="chevron-left-thin"
                            />
                            <Button
                                text={gettext('Today')}
                                style="text-only"
                                disabled={!currentStartFilter || moment(currentStartFilter).isSame(moment(), 'day')}
                                onClick={() => this.props.jumpTo('TODAY')}
                            />
                            <IconButton
                                ariaValue="forward"
                                onClick={() => this.props.jumpTo('FORWARD')}
                                icon="chevron-right-thin"
                            />
                            <Dropdown items={this.intervalOptions}>
                                <span className="sd-margin-l--1 sd-margin-r--3">
                                    {intervalText}
                                    <span className="dropdown__caret" />
                                </span>
                            </Dropdown>
                        </React.Fragment>
                    )}
                </ButtonGroup>
            </SubNav>
        );
    }
}

export const PlanningListSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningListSubNavComponent);
