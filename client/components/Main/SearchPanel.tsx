import React from 'react';
import {connect} from 'react-redux';
import {set, get, cloneDeep, isEqual} from 'lodash';

import {superdeskApi, planningApi} from '../../superdeskApi';
import {ISearchParams, PLANNING_VIEW} from '../../interfaces';

import {Button} from '../UI';
import {Content, Footer, Header, SidePanel, Tools, ContentBlock, ContentBlockInner} from '../UI/SidePanel';
import {AdvancedSearch} from '../AdvancedSearch';
import * as selectors from '../../selectors';
import {currentSearchParams} from '../../selectors/search';

interface IProps {
    activeFilter: PLANNING_VIEW;
    currentParams: ISearchParams;
    isViewFiltered: boolean;
    searchProfile: any;

    toggleFilterPanel(): void;
    popupContainer?(): HTMLElement;
}

interface IState {
    params: ISearchParams;
}

const mapStateToProps = (state) => ({
    activeFilter: selectors.main.activeFilter(state),
    currentParams: currentSearchParams(state),
    isViewFiltered: selectors.main.isViewFiltered(state),
    searchProfile: selectors.forms.searchProfile(state),
});

export class SearchPanelComponent extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onChangeMultiple = this.onChangeMultiple.bind(this);
        this.onClear = this.onClear.bind(this);
        this.search = this.search.bind(this);
        this.state = {params: cloneDeep(this.props.currentParams)};
    }

    onClear() {
        if (!this.props.isViewFiltered) {
            return;
        }

        this.setState({params: {}});
        planningApi.ui.list.clearSearch();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeFilter !== this.props.activeFilter ||
            !isEqual(nextProps.currentParams, this.props.currentParams)
        ) {
            this.setState({
                params: cloneDeep(nextProps.currentParams),
            });
        }
    }

    onChangeHandler<T extends keyof ISearchParams>(field: T, value: ISearchParams[T]) {
        const params = cloneDeep(this.state.params);

        if (Array.isArray(value) && value.length === 0) {
            set(params, field, null);
        } else {
            set(params, field, value);
        }

        this.setState({params: params});
    }

    onChangeMultiple(updates: ISearchParams) {
        const params = cloneDeep(this.state.params);

        Object.keys(updates).forEach((field) => {
            const value = get(updates, field);

            if (Array.isArray(value) && value.length === 0) {
                set(params, field, null);
            } else {
                set(params, field, value);
            }
        });

        this.setState({params: params});
    }

    search() {
        planningApi.ui.list.search(this.state.params);
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
                            icon: 'icon-close-small',
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
                                params={this.state.params}
                                onChange={this.onChangeHandler}
                                onChangeMultiple={this.onChangeMultiple}
                                popupContainer={this.props.popupContainer}
                                searchProfile={this.props.searchProfile}
                                enabledField="search_enabled"
                            />
                        </ContentBlockInner>
                    </ContentBlock>
                </Content>
                <Footer className="side-panel__footer--button-box">
                    <div className="flex-grid flex-grid--boxed-small flex-grid--wrap-items flex-grid--small-2">
                        <Button
                            disabled={!this.props.isViewFiltered}
                            text={gettext('Clear')}
                            hollow={true}
                            onClick={this.onClear}
                        />
                        <Button
                            text={gettext('Search')}
                            onClick={this.search}
                            color="primary"
                        />
                    </div>
                </Footer>
            </SidePanel>
        );
    }
}

export const SearchPanel = connect(mapStateToProps)(SearchPanelComponent);
