import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {set, cloneDeep, isEqual} from 'lodash';
import {gettext, getWorkFlowStateAsOptions} from '../../utils';
import {Button} from '../UI';
import {Content, Footer, Header, SidePanel, Tools} from '../UI/SidePanel';
import {AdvancedSearch} from '../AdvancedSearch';
import * as selectors from '../../selectors';
import * as actions from '../../actions';


export class SearchPanelComponent extends React.Component {
    constructor(props) {
        super(props);
        this.onChangeHandler = this.onChangeHandler.bind(this);
        this.onClear = this.onClear.bind(this);
        this.state = {diff: cloneDeep(this.props.currentSearch) || {}};
    }

    onClear() {
        if (!this.props.isViewFiltered) {
            return;
        }

        this.setState({
            diff: {},
        });
        this.props.clearSearch();
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.activeFilter !== this.props.activeFilter ||
            (nextProps.activeFilter === this.props.activeFilter &&
            !isEqual(nextProps.currentSearch, this.props.currentSearch))) {
            this.setState({
                diff: cloneDeep(nextProps.currentSearch) || {},
            });
        }
    }

    onChangeHandler(field, value) {
        const diff = cloneDeep(this.state.diff);

        if (Array.isArray(value) && value.length === 0) {
            set(diff, field, null);
        } else {
            set(diff, field, value);
        }

        this.setState({diff: diff});
    }

    render() {
        const {
            activeFilter,
            subjects,
            categories,
            ingestProviders,
            contentTypes,
            urgencies,
            currentSearch,
            toggleFilterPanel,
            search,
            isViewFiltered,
            workflowStateOptions,
            popupContainer,
            searchProfile,
            locators,
        } = this.props;

        const {
            diff,
        } = this.state;

        const tools = [
            {
                icon: 'icon-close-small',
                onClick: toggleFilterPanel,
            },
        ];

        const advancedSearchProps = {
            activeFilter: activeFilter,
            subjects: subjects,
            categories: categories,
            ingestProviders: ingestProviders,
            contentTypes: contentTypes,
            urgencies: urgencies,
            diff: diff,
            currentSearch: currentSearch,
            onChange: this.onChangeHandler,
            workflowStateOptions: workflowStateOptions || getWorkFlowStateAsOptions(activeFilter),
            popupContainer: popupContainer,
            searchProfile: searchProfile,
            locators: locators,
        };

        return (
            <SidePanel shadowLeft={true}>
                <Header className="side-panel__header--border-b">
                    <Tools tools={tools}/>
                    <h3 className="side-panel__heading">{gettext('Advanced filters')}</h3>
                </Header>
                <Content>
                    <AdvancedSearch {...advancedSearchProps}/>
                </Content>
                <Footer className="side-panel__footer--button-box">
                    <div className="flex-grid flex-grid--boxed-small flex-grid--wrap-items flex-grid--small-2">
                        <Button
                            disabled={!isViewFiltered}
                            text={gettext('Clear')}
                            hollow={true}
                            onClick={this.onClear}
                        />
                        <Button
                            text={gettext('Search')}
                            onClick={() => search(diff)}
                            color={'primary'}
                        />
                    </div>
                </Footer>
            </SidePanel>
        );
    }
}

SearchPanelComponent.propTypes = {
    activeFilter: PropTypes.string,
    toggleFilterPanel: PropTypes.func,
    currentSearch: PropTypes.object,
    categories: PropTypes.array,
    subjects: PropTypes.array,
    urgencies: PropTypes.array,
    contentTypes: PropTypes.array,
    ingestProviders: PropTypes.array,
    search: PropTypes.func,
    clearSearch: PropTypes.func,
    isViewFiltered: PropTypes.bool,
    workflowStateOptions: PropTypes.array,
    popupContainer: PropTypes.func,
    searchProfile: PropTypes.object,
    locators: PropTypes.arrayOf(PropTypes.object),
};


const mapStateToProps = (state) => ({
    activeFilter: selectors.main.activeFilter(state),
    currentSearch: selectors.main.currentSearch(state),
    categories: state.vocabularies.categories,
    subjects: state.subjects,
    urgencies: state.urgency.urgency,
    contentTypes: selectors.general.contentTypes(state),
    ingestProviders: state.ingest.providers,
    isViewFiltered: selectors.main.isViewFiltered(state),
    searchProfile: selectors.forms.searchProfile(state),
    locators: selectors.vocabs.locators(state),
});

const mapDispatchToProps = (dispatch) => ({
    clearSearch: () => dispatch(actions.main.clearSearch()),
    search: (params) => dispatch(actions.main.search(null, params)),
});

export const SearchPanel = connect(mapStateToProps, mapDispatchToProps)(SearchPanelComponent);
