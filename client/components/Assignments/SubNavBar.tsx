import React from 'react';

import {superdeskApi} from '../../superdeskApi';

import {ASSIGNMENTS} from '../../constants';

import {SubNav, ButtonGroup, NavButton, Tooltip, Badge} from 'superdesk-ui-framework/react';
import {SearchBox} from '../UI';

interface IProps {
    searchQuery?: string;
    changeSearchQuery(value?: string): void;
    assignmentListSingleGroupView?: string;
    changeAssignmentListSingleGroupView(view?: string): void;
    totalCountInListView?: number;
}

export class SubNavBar extends React.PureComponent<IProps> {
    render() {
        const {
            searchQuery,
            changeSearchQuery,
            assignmentListSingleGroupView,
            changeAssignmentListSingleGroupView,
            totalCountInListView,
        } = this.props;

        const {gettext} = superdeskApi.localization;

        return (
            <SubNav zIndex={3}>
                {assignmentListSingleGroupView && (
                    <ButtonGroup align="left">
                        <Tooltip
                            text={gettext('Back to group list view')}
                            flow="right"
                        >
                            <NavButton
                                icon="arrow-left"
                                onClick={changeAssignmentListSingleGroupView}
                            />
                        </Tooltip>
                    </ButtonGroup>
                )}
                <h3 className="subnav__page-title sd-flex-no-grow">
                    <span>{gettext('Assignments')}</span>
                    {!assignmentListSingleGroupView ? null : (
                        <span>
                            <span>{'/' + ASSIGNMENTS.LIST_GROUPS[assignmentListSingleGroupView].label}</span>
                            <Badge text={(totalCountInListView ?? 0).toString()} />
                        </span>
                    )}
                </h3>
                <SearchBox
                    label={gettext('Search Assignments')}
                    value={searchQuery}
                    search={changeSearchQuery}
                    allowRemove={true}
                    focusOnMount={true}
                    border="l"
                />
            </SubNav>
        );
    }
}
