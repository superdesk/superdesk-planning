import React from 'react';

import {IDesk, IUser} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {superdeskApi} from '../../superdeskApi';
import {
    IEventOrPlanningItem,
    IFile,
    IPlanningCoverageItem,
    IPlanningNewsCoverageStatus,
} from '../../interfaces';

import {getFileDownloadURL} from '../../utils';
import {getCoverageFields} from '../../api/editor/item_planning';
import {CoveragePreview} from './CoveragePreview';

interface IProps {
    item: IEventOrPlanningItem;
    users: Array<IUser>;
    desks: Array<IDesk>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    files: {[key: string]: IFile};
    inner?: boolean;
    currentCoverageId?: IPlanningCoverageItem['coverage_id'];
}

export class CoveragesPreview extends React.PureComponent<IProps> {
    // Kept as a method rather than a component defined in render(), so the coverage
    // subtree is not remounted (and its CollapseBox state lost) on every render
    renderCoveragePreview(coverage: IPlanningCoverageItem, index: number) {
        const {item, users, desks, newsCoverageStatus, inner, files} = this.props;
        const {profile} = getCoverageFields(coverage.planning.g2_content_type);

        return (
            <CoveragePreview
                item={item}
                key={coverage.coverage_id}
                index={index}
                coverage={coverage}
                users={users}
                desks={desks}
                newsCoverageStatus={newsCoverageStatus}
                formProfile={profile}
                inner={inner}
                files={files}
                createLink={getFileDownloadURL}
                canScheduleUpdates={
                    profile.editor.flags && appConfig.planning_allow_scheduled_updates
                }
                scrollInView={true}
            />
        );
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const coverages = this.props.item.coverages ?? [];

        if (coverages.length === 0) {
            return null;
        }

        const currentCoverage = this.props.currentCoverageId == null ?
            null :
            coverages.find((coverage) => coverage.coverage_id === this.props.currentCoverageId);
        const otherCoverages = currentCoverage == null ?
            coverages :
            coverages.filter((coverage) => coverage.coverage_id !== this.props.currentCoverageId);

        if (currentCoverage == null) {
            return (
                <>
                    <h3 className="side-panel__heading--big">{gettext('Coverages')}</h3>
                    {otherCoverages.map((coverage, i) => this.renderCoveragePreview(coverage, i))}
                </>
            );
        }

        return (
            <>
                <h3 className="side-panel__heading--big">{gettext('This Coverage')}</h3>
                {this.renderCoveragePreview(currentCoverage, 0)}

                {otherCoverages.length > 0 && (
                    <>
                        <h3 className="side-panel__heading--big">{gettext('Other Coverages')}</h3>
                        {otherCoverages.map((coverage, i) => this.renderCoveragePreview(coverage, i))}
                    </>
                )}
            </>
        );
    }
}
