import React from 'react';
import {connect} from 'react-redux';
import {set, get, cloneDeep, isEqual} from 'lodash';

import {superdeskApi} from '../../superdeskApi';
import {ISearchParams} from '../../interfaces';

import {Button} from '../UI';
import {Content, Footer, Header, SidePanel, Tools, ContentBlock, ContentBlockInner} from '../UI/SidePanel';
import {AdvancedSearch} from '../AdvancedSearch';
import * as selectors from '../../selectors';
import * as actions from '../../actions';
import {currentSearchParams} from '../../selectors/search';

interface IProps {
    activeFilter: string;
    currentParams: ISearchParams;
    isViewFiltered: boolean;
    searchProfile: any;

    toggleFilterPanel(): void;
    search(activeFilter: string, searchParams: ISearchParams): void;
    clearSearch(): void;
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

const mapDispatchToProps = (dispatch) => ({
    clearSearch: () => dispatch(actions.main.clearSearch()),
    search: (activeFilter, params) => dispatch(actions.main.searchAdvancedSearch(params, activeFilter)),
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
        this.props.clearSearch();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeFilter !== this.props.activeFilter || (
            nextProps.activeFilter === this.props.activeFilter &&
            !isEqual(nextProps.currentParams, this.props.currentParams)
        )) {
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
        this.props.search(this.props.activeFilter, this.state.params);
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

// SearchPanelComponent.propTypes = {
//     activeFilter: PropTypes.string,
//     toggleFilterPanel: PropTypes.func,
//     currentSearch: PropTypes.object,
//     categories: PropTypes.array,
//     subjects: PropTypes.array,
//     urgencies: PropTypes.array,
//     contentTypes: PropTypes.array,
//     ingestProviders: PropTypes.array,
//     search: PropTypes.func,
//     clearSearch: PropTypes.func,
//     isViewFiltered: PropTypes.bool,
//     workflowStateOptions: PropTypes.array,
//     popupContainer: PropTypes.func,
//     searchProfile: PropTypes.object,
//     locators: PropTypes.arrayOf(PropTypes.object),
// };
//
//
// const mapStateToProps = (state) => ({
//     activeFilter: selectors.main.activeFilter(state),
//     currentSearch: selectors.main.currentSearch(state),
//     categories: state.vocabularies.categories,
//     subjects: state.subjects,
//     urgencies: state.urgency.urgency,
//     contentTypes: selectors.general.contentTypes(state),
//     ingestProviders: state.ingest.providers,
//     isViewFiltered: selectors.main.isViewFiltered(state),
//     searchProfile: selectors.forms.searchProfile(state),
//     locators: selectors.vocabs.locators(state),
// });
//
// const mapDispatchToProps = (dispatch) => ({
//     clearSearch: () => dispatch(actions.main.clearSearch()),
//     search: (params) => dispatch(actions.main.search(null, params)),
// });

export const SearchPanel = connect(
    mapStateToProps,
    mapDispatchToProps
)(SearchPanelComponent);
