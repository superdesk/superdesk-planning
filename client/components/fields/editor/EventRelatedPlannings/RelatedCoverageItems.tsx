import * as React from 'react';
import {connect} from 'react-redux';

import {
    IAssignmentPriority,
    ICoverageProvider,
    IG2ContentType, IGenre,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus
} from '../../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import * as List from '../../../UI/List';
import {CoverageEditor} from '../../../Coverages';

import * as selectors from '../../../../selectors';
import * as actions from '../../../../actions';

interface IProps {
    item: DeepPartial<IPlanningItem>;
    coverages: Array<DeepPartial<IPlanningCoverageItem>>;
    disabled?: boolean;
    desks: Array<IDesk>;
    users: Array<IUser>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    genres: Array<IGenre>;
    coverageProviders: Array<ICoverageProvider>;
    priorities: Array<IAssignmentPriority>;
    keywords: Array<string>;

    updateCoverage(field: string, value: any): void;
    removeCoverage(coverage: DeepPartial<IPlanningCoverageItem>): void;
    duplicateCoverage(coverage: DeepPartial<IPlanningCoverageItem>, duplicateAs?: IG2ContentType['qcode']): void;
    setCoverageDefaultDesk(coverage: DeepPartial<IPlanningCoverageItem>): void;
}

const mapStateToProps = (state) => ({
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
    contentTypes: selectors.general.contentTypes(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    genres: state.genres,
    coverageProviders: selectors.vocabs.coverageProviders(state),
    priorities: selectors.getAssignmentPriorities(state),
    keywords: selectors.general.keywords(state),
});

const mapDispatchToProps = (dispatch) => ({
    setCoverageDefaultDesk: (coverage) => dispatch(actions.users.setCoverageDefaultDesk(coverage)),
});

class RelatedCoverageItemsComponent extends React.PureComponent<IProps> {
    render() {
        return (
            <List.Group
                testId="editor--planning-item__coverages"
                spaceBetween={true}
                className="sd-margin-b--0-5"
            >
                {this.props.coverages.map((coverage, index) => (
                    <CoverageEditor
                        testId={`field-coverages[${index}]`}
                        key={coverage.coverage_id}
                        readOnly={this.props.disabled}
                        users={this.props.users}
                        desks={this.props.desks}
                        newsCoverageStatus={this.props.newsCoverageStatus}
                        contentTypes={this.props.contentTypes}
                        genres={this.props.genres}
                        coverageProviders={this.props.coverageProviders}
                        priorities={this.props.priorities}
                        keywords={this.props.keywords}
                        item={this.props.item}
                        diff={this.props.item}
                        index={index}
                        value={coverage}
                        field={`coverages[${index}]`}
                        includeScheduledUpdates={false}

                        onChange={this.props.updateCoverage}
                        remove={() => this.props.removeCoverage(coverage)}
                        onDuplicateCoverage={this.props.duplicateCoverage}
                        setCoverageDefaultDesk={() => this.props.setCoverageDefaultDesk(coverage)}
                        openCoverageIds={[]}
                    />
                ))}
            </List.Group>
        );
    }
}

export const RelatedCoverageItems = connect(
    mapStateToProps,
    mapDispatchToProps
)(RelatedCoverageItemsComponent);
