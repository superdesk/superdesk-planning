import React from 'react';
import {connect} from 'react-redux';
import {memoize} from 'lodash';
import {Button, ButtonGroup, Checkbox, IconButton, IconLabel, Tooltip} from 'superdesk-ui-framework/react';
import {IDesk, IUser, IVocabularyItem} from 'superdesk-api';

import {IEventItem, IG2ContentType, IPlanningNewsCoverageStatus} from '../../interfaces';
import {gettext, planningUtils} from '../../utils';
import {getUserInterfaceLanguageFromCV} from '../../utils/users';
import {getVocabularyItemFieldTranslated} from '../../utils/vocabularies';
import * as selectors from '../../selectors';
import {CoverageEditableFields} from './CoverageFieldsRow';
import {
    applyDeskChange,
    applyUserChange,
    buildNewCoverages,
    createRowsFromContentTypes,
    duplicateRow,
    getFilteredLanguages,
    ICoverageLineItem,
    ICoverageRow,
    ICoverageRowRules,
    updateRow,
    validateRows,
} from './coverageRows';

import './CoverageAddInlineForm.scss';

const RULES: ICoverageRowRules = {plannedOnDesk: true, deskRequiredForWorkflow: true};

function getContentTypesByQcode(contentTypes: Array<IG2ContentType>): Map<string, IG2ContentType> {
    return new Map(contentTypes.map((contentType) => [
        contentType.qcode ?? contentType['content item type'],
        contentType,
    ]));
}

interface IOwnProps {
    contentTypes: Array<IG2ContentType>;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    desks: Array<IDesk>;
    users: Array<IUser>;
    event?: IEventItem;

    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<ICoverageLineItem>;
    onAdd(newCoverages: Array<DeepPartial<ICoverageLineItem>>): void;
}

interface IReduxStateProps {
    allLanguages: Array<{value: IVocabularyItem}>;
}

type IProps = IOwnProps & IReduxStateProps;

interface IState {
    rows: Array<ICoverageRow>;
    submitted: boolean;
    open: boolean;
}

class CoverageAddInlineFormComponent extends React.Component<IProps, IState> {
    form: React.RefObject<HTMLDivElement>;
    getContentTypesByQcode = memoize(getContentTypesByQcode);

    constructor(props: IProps) {
        super(props);

        this.form = React.createRef();
        this.state = this.getInitialState();
    }

    getInitialState(): IState {
        const {contentTypes, desks, newsCoverageStatus} = this.props;

        return {
            rows: createRowsFromContentTypes(contentTypes, desks, newsCoverageStatus),
            submitted: false,
            open: true,
        };
    }

    clearRows = () => {
        const {rows, submitted} = this.getInitialState();

        this.setState({rows, submitted});
    }

    cancel = () => {
        this.setState({...this.getInitialState(), open: false});
    }

    open = () => {
        this.setState({open: true}, () => {
            this.form.current?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
        });
    }

    update = (row: ICoverageRow, updates: ICoverageRow) => {
        this.setState({rows: updateRow(this.state.rows, row, updates)});
    }

    duplicate = (row: ICoverageRow) => {
        this.setState({
            rows: duplicateRow(this.state.rows, row, this.props.newsCoverageStatus, this.props.desks),
        });
    }

    onDeskChange = (row: ICoverageRow, desk: IDesk | null) => {
        this.update(row, applyDeskChange(
            row,
            desk,
            this.props.users,
            getFilteredLanguages(this.props.allLanguages),
            RULES
        ));
    }

    onUserChange = (row: ICoverageRow, user: IUser | null) => {
        this.update(row, applyUserChange(user, this.props.desks));
    }

    add = () => {
        const errors = validateRows(this.state.rows, RULES);

        if (Object.keys(errors).length > 0) {
            this.setState({submitted: true});
            return;
        }

        this.props.onAdd(buildNewCoverages(this.state.rows, this.props.createCoverage, this.props.event));
        this.clearRows();
    }

    renderTypeLine(row: ICoverageRow, contentTypes: Map<string, IG2ContentType>) {
        return (
            <div
                className="sd-list-item sd-list-item--no-hover sd-shadow--z1"
                data-test-id={`coverage-inline-form__row--${row.qcode}`}
            >
                <div className="sd-list-item__column">
                    <Tooltip flow="top" text={gettext('Enable coverage')}>
                        <Checkbox
                            label={{text: gettext('Coverage enabled'), hidden: true}}
                            checked={row.enabled === true}
                            onChange={() => this.update(row, {enabled: row.enabled !== true})}
                        />
                    </Tooltip>
                </div>
                <div className="sd-list-item__column">
                    <i className={planningUtils.getCoverageIcon(row.qcode)} />
                </div>
                <div className="coverage-inline-form__type sd-list-item__column sd-overflow-ellipsis">
                    {getVocabularyItemFieldTranslated(
                        contentTypes.get(row.qcode),
                        'name',
                        getUserInterfaceLanguageFromCV()
                    )}
                </div>
                <div className="d-flex items-center ml-auto">
                    <IconButton
                        ariaValue={gettext('Duplicate')}
                        icon="plus-sign"
                        onClick={() => this.duplicate(row)}
                    />
                </div>
            </div>
        );
    }

    render() {
        const {newsCoverageStatus, allLanguages} = this.props;
        const {rows, submitted} = this.state;
        const errors = validateRows(rows, RULES);
        const enabledCount = rows.filter((row) => row.enabled === true).length;
        const languages = getFilteredLanguages(allLanguages);
        const contentTypes = this.getContentTypesByQcode(this.props.contentTypes);

        if (!this.state.open) {
            return (
                <button
                    type="button"
                    className="item-association coverage-inline-form__open"
                    data-test-id="coverage-inline-form__open"
                    onClick={this.open}
                >
                    <IconLabel text={gettext('Add Coverages')} icon="plus-sign" type="primary" />
                </button>
            );
        }

        return (
            <div className="coverage-inline-form sd-shadow--z2" data-test-id="coverage-inline-form" ref={this.form}>
                <div className="coverage-inline-form__header py-1 px-2">
                    <span className="form-label">{gettext('Coverage Types')}</span>
                </div>
                <div className="coverage-inline-form__body p-2">
                    <div className="sd-list-item-group sd-list-item-group--space-between-items">
                        {rows.map((row) => (
                            <React.Fragment key={row.rowId}>
                                {this.renderTypeLine(row, contentTypes)}
                                {row.enabled === true && (
                                    <div
                                        className={'coverage-inline-form__fields sd-list-item ' +
                                            'sd-list-item--no-hover sd-shadow--z1'}
                                        data-test-id={`coverage-inline-form__fields--${row.qcode}`}
                                    >
                                        <CoverageEditableFields
                                            coverage={row}
                                            languages={languages}
                                            handleDeskChange={this.onDeskChange}
                                            handleUserChange={this.onUserChange}
                                            updateCoverage={this.update}
                                            duplicateCoverage={this.duplicate}
                                            newsCoverageStatus={newsCoverageStatus}
                                            error={submitted ? errors[row.rowId] : undefined}
                                            stacked
                                            showDuplicate={false}
                                        />
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className="coverage-inline-form__footer d-flex py-1 px-2">
                    <ButtonGroup align="end">
                        <Button
                            type="secondary"
                            text={gettext('Cancel')}
                            onClick={this.cancel}
                        />
                        <Button
                            type="primary"
                            text={gettext('Add Coverage(s)')}
                            disabled={enabledCount === 0}
                            onClick={this.add}
                        />
                    </ButtonGroup>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state): IReduxStateProps => ({
    allLanguages: selectors.vocabs.getLanguagesForTreeSelectInput(state),
});

export const CoverageAddInlineForm = connect<IReduxStateProps, null, IOwnProps>(
    mapStateToProps,
)(CoverageAddInlineFormComponent);
