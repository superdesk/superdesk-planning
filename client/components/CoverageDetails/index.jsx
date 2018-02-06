import React from 'react';
import {connect} from 'react-redux';
import {formValueSelector} from 'redux-form';
import PropTypes from 'prop-types';
import {fields} from '../../components';
import {Field} from 'redux-form';
import {get} from 'lodash';
import {planningUtils} from '../../utils';
import {PLANNING, FORM_NAMES} from '../../constants';
import {change} from 'redux-form';

export class CoverageDetailsComponent extends React.Component {
    componentWillUpdate(nextProps) {
        if (nextProps.hasAssignment &&
            nextProps.newsCoverageStatus.qcode !== 'ncostat:int' &&
            nextProps.newsCoverageStatus.qcode !== PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode) {
            this.props.changeCoverageStatusPlanned();
        }
    }

    render() {
        const {
            coverage,
            readOnly,
            contentType,
            formProfile,
            assignmentState,
            hasAssignment,
            newsCoverageStatus,
            coverageId,
        } = this.props;

        const isTextCoverage = contentType === 'text';
        const isExistingCoverage = !!coverageId;
        // for assignment form coverage props is object
        // for coverage form coverage props is string
        const fieldNamePrefix = typeof coverage === 'string' ? `${coverage}.` : '';
        const coverageStatusPrefix = fieldNamePrefix ? fieldNamePrefix : 'planning.';
        const coverageCancelledInput = {value: 'Coverage Cancelled'};

        const isCancelled = get(this.props, 'newsCoverageStatus.qcode') ===
            PLANNING.NEWS_COVERAGE_CANCELLED_STATUS.qcode;
        const roFields = planningUtils.getCoverageReadOnlyFields(
            readOnly,
            newsCoverageStatus,
            hasAssignment,
            isExistingCoverage,
            assignmentState
        );

        return (
            <div>
                {get(formProfile, 'editor.slugline.enabled') &&
                    <div className="form__row">
                        <Field
                            name={`${fieldNamePrefix}planning.slugline`}
                            component={fields.InputField}
                            type="text"
                            label="Slugline"
                            required={get(formProfile, 'schema.slugline.required')}
                            readOnly={roFields.slugline} />
                    </div>
                }
                {get(formProfile, 'editor.ednote.enabled') &&
                    <div className="form__row">
                        <Field
                            name={`${fieldNamePrefix}planning.ednote`}
                            component={fields.InputTextAreaField}
                            autoFocus={true}
                            type="text"
                            label="Ed Note"
                            required={get(formProfile, 'schema.ednote.required')}
                            readOnly={roFields.ednote} />
                    </div>
                }
                {get(formProfile, 'editor.internal_note.enabled') &&
                    <div className="form__row">
                        <Field
                            name={`${fieldNamePrefix}planning.internal_note`}
                            component={fields.InputTextAreaField}
                            label="Internal Note"
                            required={get(formProfile, 'schema.internal_note.required')}
                            readOnly={roFields.internal_note} />
                    </div>
                }

                {get(formProfile, 'editor.g2_content_type.enabled') &&
                    <div className="form__row">
                        <Field
                            name={`${fieldNamePrefix}planning.g2_content_type`}
                            component={fields.ContentTypeField}
                            label="Type"
                            clearable={true}
                            required={get(formProfile, 'schema.g2_content_type.required')}
                            readOnly={roFields.g2_content_type} />
                    </div>
                }

                {get(formProfile, 'editor.genre.enabled') && isTextCoverage && (
                    <div className="form__row">
                        <Field name={`${fieldNamePrefix}planning.genre`}
                            component={fields.GenreField}
                            label="Genre"
                            readOnly={roFields.genre} />
                    </div>
                )}
                <div className="form__row">
                    { !isCancelled &&
                    (
                        <Field
                            name={`${coverageStatusPrefix}news_coverage_status`}
                            component={fields.CoverageStatusField}
                            label="Coverage Status"
                            clearable={false}
                            readOnly={roFields.newsCoverageStatus} />
                    ) || (
                            <fields.InputField
                                input={coverageCancelledInput}
                                readOnly={true}
                                label="Coverage Status" />
                        )}
                </div>

                {get(formProfile, 'editor.scheduled.enabled') &&
                    <Field
                        name={`${fieldNamePrefix}planning.scheduled`}
                        component={fields.DayPickerInput}
                        withTime={true}
                        label="Due"
                        readOnly={roFields.scheduled} />
                }
            </div>
        );
    }
}

CoverageDetailsComponent.propTypes = {
    coverage: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]).isRequired,
    contentType: PropTypes.string,
    readOnly: PropTypes.bool,
    formProfile: PropTypes.object,
    keywords: PropTypes.array,
    assignmentState: PropTypes.string,
    changeCoverageStatusPlanned: PropTypes.func,
    newsCoverageStatus: PropTypes.object,
    hasAssignment: PropTypes.bool,
    coverageId: PropTypes.string,
};

const selector = formValueSelector(FORM_NAMES.PlanningForm);
const mapStateToProps = (state, ownProps) => {
    const fieldName = ownProps.coverage + '.news_coverage_status';

    return {newsCoverageStatus: selector(state, fieldName)};
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    changeCoverageStatusPlanned: () =>
        (dispatch(change(FORM_NAMES.PlanningForm, ownProps.coverage + '.news_coverage_status',
            {qcode: 'ncostat:int'}))),
});

export const CoverageDetails = connect(mapStateToProps, mapDispatchToProps)(CoverageDetailsComponent);
