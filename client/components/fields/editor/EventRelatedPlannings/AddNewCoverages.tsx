import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../../superdeskApi';
import {
    IEventItem,
    IG2ContentType,
    IPlanningCoverageItem,
    IPlanningItem,
    IPlanningNewsCoverageStatus
} from '../../../../interfaces';
import {IDesk, IUser} from 'superdesk-api';

import * as selectors from '../../../../selectors';
import {planningUtils, generateTempId} from '../../../../utils';

import {ButtonGroup, Button, IconLabel} from 'superdesk-ui-framework/react';
import {ICoverageDetails, CoverageRowForm} from './CoverageRowForm';
import {Group} from '../../../UI/List';

interface IProps {
    event: IEventItem;
    item: DeepPartial<IPlanningItem>;
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    desks: Array<IDesk>;
    users: Array<IUser>;
    updatePlanningItem(updates: DeepPartial<IPlanningItem>): void;
}

interface IState {
    inEditMode: boolean;
    coverages: Array<ICoverageDetails>;
    dirty: boolean;
    errors: Dictionary<ICoverageDetails['id'], {desk?: string;}>;
    invalid?: boolean;
    submitted?: boolean;
}

const mapStateToProps = (state) => ({
    contentTypes: selectors.general.contentTypes(state),
    newsCoverageStatus: selectors.general.newsCoverageStatus(state),
    desks: selectors.general.desks(state),
    users: selectors.general.users(state),
});

class AddNewCoveragesComponent extends React.Component<IProps, IState> {
    editForm: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.state = {
            ...this.getInitialState(),
            inEditMode: !this.props.item.coverages?.length,
        };

        this.editForm = React.createRef();

        this.resetForm = this.resetForm.bind(this);
        this.updateCoverage = this.updateCoverage.bind(this);
        this.duplicateCoverage = this.duplicateCoverage.bind(this);
        this.removeCoverage = this.removeCoverage.bind(this);
        this.save = this.save.bind(this);
        this.openEditMode = this.openEditMode.bind(this);
    }

    getInitialState(): IState {
        return {
            inEditMode: false,
            dirty: false,
            errors: {},
            invalid: false,
            submitted: false,
            coverages: this.props.contentTypes.map(
                (type) => ({
                    id: generateTempId(),
                    enabled: false,
                    type: type,
                    desk: null,
                    filteredDesks: this.props.desks,
                    user: null,
                    filteredUsers: this.props.users,
                    popupContainer: null,
                    status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
                })
            ),
        };
    }

    resetForm() {
        this.setState(this.getInitialState());
    }

    updateCoverage(original: ICoverageDetails, updates: Partial<ICoverageDetails>) {
        const {gettext} = superdeskApi.localization;
        const errors: IState['errors'] = {};
        const coverages = this.state.coverages.map((coverage) => {
            const updatedCoverage = original.id === coverage.id ?
                Object.assign({}, coverage, updates) :
                coverage;

            if (updatedCoverage.enabled && updatedCoverage.desk == null) {
                errors[updatedCoverage.id] = {desk: gettext('Desk is required')};
            }

            return updatedCoverage;
        });

        this.setState({
            coverages: coverages,
            dirty: true,
            errors: errors,
            invalid: Object.keys(errors).length > 0,
        });
    }

    getCoverageTypeCounts(): {[key: string]: number} {
        const counts: {[key: string]: number} = {};

        this.state.coverages.forEach(
            (coverage) => {
                if (counts[coverage.type.qcode] == null) {
                    counts[coverage.type.qcode] = 1;
                } else {
                    counts[coverage.type.qcode] += 1;
                }
            }
        );

        return counts;
    }

    duplicateCoverage(index: number, coverage: ICoverageDetails) {
        const coverages = Array.from(this.state.coverages);
        const newCoverage: ICoverageDetails = {
            id: generateTempId(),
            enabled: false,
            type: coverage.type,
            desk: null,
            user: null,
            popupContainer: null,
            status: planningUtils.getDefaultCoverageStatus(this.props.newsCoverageStatus),
            filteredDesks: this.props.desks,
            filteredUsers: this.props.users,
        };

        coverages.splice(index + 1, 0, newCoverage);
        this.setState({coverages: coverages});
    }

    removeCoverage(index: number) {
        const coverages = Array.from(this.state.coverages);

        coverages.splice(index, 1);
        this.setState({coverages: coverages});
    }

    save() {
        if (this.state.invalid) {
            // If any coverages are invalid, then set `submitted` to true
            // This will then display error messages in the coverage form
            this.setState({submitted: true});
            return;
        }

        const coverages: Array<DeepPartial<IPlanningCoverageItem>> = this.state.coverages
            .filter((coverage) => coverage.enabled)
            .map((coverage) => {
                let newCoverage: DeepPartial<IPlanningCoverageItem> = planningUtils.defaultCoverageValues(
                    this.props.newsCoverageStatus,
                    this.props.item,
                    this.props.event,
                    coverage.type.qcode
                );

                newCoverage.assigned_to = {
                    user: coverage.user?._id,
                    desk: coverage.desk?._id,
                };

                if (coverage.status) {
                    newCoverage.news_coverage_status = coverage.status;
                }

                return newCoverage;
            });

        this.props.updatePlanningItem({
            coverages: [
                ...this.props.item.coverages ?? [],
                ...coverages,
            ],
        });

        this.resetForm();
    }

    openEditMode() {
        this.setState({inEditMode: true}, () => {
            this.editForm.current?.scrollIntoView({behavior: 'smooth'});
        });
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const typeCounts = this.getCoverageTypeCounts();

        return !this.state.inEditMode ? (
            <div
                data-test-id="editor--planning-item__add-coverage"
                className="coverage-form coverage-form--initial info-box--dashed"
                onClick={this.openEditMode}
            >
                <IconLabel
                    text={gettext('Add Coverages')}
                    icon="plus-sign"
                    type="primary"
                />
            </div>
        ) : (
            <div
                data-test-id="editor--planning-item__add-coverage"
                className="coverage-form sd-shadow--z2"
            >
                <div className="coverage-form__header">
                    <span className="form-label">{gettext('Coverage Types')}</span>
                </div>
                <div
                    className="coverage-form__body"
                    ref={this.editForm}
                >
                    <Group spaceBetween={true}>
                        {this.state.coverages.map((coverage, index) => (
                            <CoverageRowForm
                                key={coverage.id}
                                coverage={coverage}
                                index={index}
                                typeCount={typeCounts[coverage.type.qcode]}
                                language={this.props.event.language}
                                errors={!this.state.submitted ? {} : this.state.errors[coverage.id]}
                                update={this.updateCoverage}
                                duplicate={this.duplicateCoverage}
                                remove={this.removeCoverage}
                                desks={this.props.desks}
                                users={this.props.users}
                            />
                        ))}
                    </Group>
                </div>
                <div className="coverage-form__footer">
                    <ButtonGroup align="right">
                        <Button
                            data-test-id="footer--cancel"
                            type="default"
                            text={gettext('Cancel')}
                            onClick={this.resetForm}
                        />
                        <Button
                            data-test-id="footer--add_coverage"
                            type="primary"
                            text={gettext('Add Coverage(s)')}
                            disabled={!this.state.dirty}
                            onClick={this.save}
                        />
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

export const AddNewCoverages = connect(mapStateToProps)(AddNewCoveragesComponent);
