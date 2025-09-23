import React from 'react';
import {connect} from 'react-redux';
import {cloneDeep, get, set} from 'lodash';
import {produce} from 'immer';

import {superdeskApi} from '../../superdeskApi';
import {Button} from 'superdesk-ui-framework/react';
import {IDesk} from 'superdesk-api';
import {IAssignmentSearchParams} from '../../interfaces';

import {assignmentSearchProfile} from '../../selectors/forms';
import {getSelectedDeskId} from '../../selectors';
import assignments from '../../actions/assignments';

import {Content, Footer, Header, SidePanel, Tools, ContentBlock, ContentBlockInner} from '../UI/SidePanel';
import {AdvancedSearch} from '../AdvancedSearch';

interface IProps {
    currentParams: IAssignmentSearchParams;
    filtersOpen: boolean;
    toggleFilterPanel(): void;
    searchProfile: any;
    setSearchParams(params: IAssignmentSearchParams): void;
    currentDeskId?: IDesk['_id'];
}

interface IState {
    params: IAssignmentSearchParams;
}

const mapStateToProps = (state) => ({
    searchProfile: assignmentSearchProfile(state),
    currentDeskId: getSelectedDeskId(state),
});

const mapDispatchToProps = (dispatch) => ({
    setSearchParams: (params: IAssignmentSearchParams) => dispatch(assignments.ui.setAssignmentSearchParams(params)),
});

class AssignmentFilterPanelComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onChangeMultiple = this.onChangeMultiple.bind(this);
        this.onClear = this.onClear.bind(this);
        this.search = this.search.bind(this);
        this.state = {params: cloneDeep(this.props.currentParams || {})};
    }

    onClear() {
        this.setState({params: {}});
        this.props.setSearchParams({});
    }

    onChangeHandler<T extends keyof IAssignmentSearchParams>(field: T, value: IAssignmentSearchParams[T]) {
        this.setState((prevState) => (
            produce(prevState, (draft) => {
                if (Array.isArray(value) && value.length === 0) {
                    set(draft.params, field, null);
                } else {
                    set(draft.params, field, value);
                }
            })
        ));
    }

    onChangeMultiple(updates: IAssignmentSearchParams) {
        this.setState((prevState) => (
            produce(prevState, (draft) => {
                Object.keys(updates).forEach((field) => {
                    const value = get(updates, field);

                    if (Array.isArray(value) && value.length === 0) {
                        set(draft.params, field, null);
                    } else {
                        set(draft.params, field, value);
                    }
                });
            })
        ));
    }

    search() {
        this.props.setSearchParams(this.state.params);
    }

    render() {
        const {gettext} = superdeskApi.localization;

        return (
            <SidePanel
                shadowLeft={true}
                testId="search-panel"
            >
                <Header className="side-panel__header--border-b">
                    <Tools
                        tools={[{
                            icon: 'close-small',
                            onClick: this.props.toggleFilterPanel,
                            title: gettext('Close'),
                        }]}
                    />
                    <h3 className="side-panel__heading">
                        {gettext('Advanced filters')}
                    </h3>
                </Header>
                <Content>
                    <ContentBlock>
                        <ContentBlockInner>
                            <AdvancedSearch
                                type="assignments"
                                params={this.state.params}
                                onChange={this.onChangeHandler}
                                onChangeMultiple={this.onChangeMultiple}
                                searchProfile={this.props.searchProfile}
                                enabledField="enabled"
                                filterUsersByDesk={this.props.currentDeskId}
                            />
                        </ContentBlockInner>
                    </ContentBlock>
                </Content>
                <Footer className="side-panel__footer--button-box">
                    <div className="flex-grid flex-grid--boxed-small flex-grid--wrap-items flex-grid--small-2">
                        <Button
                            disabled={false}
                            text={gettext('Clear')}
                            style="hollow"
                            onClick={this.onClear}
                        />
                        <Button
                            text={gettext('Search')}
                            onClick={this.search}
                            type="primary"
                        />
                    </div>
                </Footer>
            </SidePanel>
        );
    }
}

export const AssignmentFilterPanel = connect(mapStateToProps, mapDispatchToProps)(AssignmentFilterPanelComponent);
