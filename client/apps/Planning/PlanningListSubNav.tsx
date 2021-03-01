import * as React from 'react';
import {connect} from 'react-redux';
import moment from 'moment';

import {superdeskApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import * as actions from '../../actions';

import {ButtonGroup, Dropdown, SubNav, Button} from 'superdesk-ui-framework/react';
import {JumpToDropdown} from '../../components/Main';

interface IProps {
    currentStartFilter?: moment.Moment;
    setStartFilter(value?: moment.Moment): void;
    jumpTo(interval: 'TODAY' | 'BACK' | 'FORWARD'): void;
    currentInterval: 'DAY' | 'WEEK' | 'MONTH';
    setJumpInterval(interval: 'DAY' | 'WEEK' | 'MONTH'): void;
}

const mapStateToProps = (state) => ({
    currentStartFilter: selectors.main.currentStartFilter(state),
    currentInterval: selectors.main.currentJumpInterval(state),
});

const mapDispatchToProps = (dispatch) => ({
    setStartFilter: (value) => dispatch(actions.main.setStartFilter(value)),
    jumpTo: (interval) => dispatch(actions.main.jumpTo(interval)),
    setJumpInterval: (interval) => dispatch(actions.main.setJumpInterval(interval)),
});


class PlanningListSubNavComponent extends React.PureComponent<IProps> {
    intervalOptions: Array<{label: string, onSelect(): void}>

    constructor(props) {
        super(props);
        const {gettext} = superdeskApi.localization;

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

        return (
            <SubNav zIndex={1}>
                <ButtonGroup align="inline">
                    <JumpToDropdown
                        currentStartFilter={this.props.currentStartFilter}
                        setStartFilter={this.props.setStartFilter}
                    />
                    <Button
                        text={gettext('Today')}
                        onClick={() => this.props.jumpTo('TODAY')}
                        disabled={!currentStartFilter || moment(currentStartFilter).isSame(moment(), 'day')}
                    />
                </ButtonGroup>
                <ButtonGroup align="right">
                    <Button
                        icon="chevron-left-thin"
                        text="back"
                        shape="round"
                        iconOnly={true}
                        onClick={() => this.props.jumpTo('BACK')}
                    />
                    <Dropdown items={this.intervalOptions}>
                        <span className="sd-margin-l--1">
                            {intervalText}
                            <span className="dropdown__caret" />
                        </span>
                    </Dropdown>
                    <Button
                        icon="chevron-right-thin"
                        text="forward"
                        shape="round"
                        iconOnly={true}
                        onClick={() => this.props.jumpTo('FORWARD')}
                    />
                </ButtonGroup>
            </SubNav>
        );
    }
}

export const PlanningListSubNav = connect(
    mapStateToProps,
    mapDispatchToProps
)(PlanningListSubNavComponent);
