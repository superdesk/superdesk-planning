import React from 'react';
import PropTypes from 'prop-types';
import {get, isEmpty} from 'lodash';

import {ContentBlock} from '../UI/SidePanel';
import {InputArray} from '../UI/Form';
import {CoverageEditor} from './CoverageEditor';
import {CoverageAddButton} from './CoverageAddButton';

import {gettext, planningUtils} from '../../utils';

export class CoverageArrayInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {openCoverageIds: []};

        this.onCoverageClose = this.onCoverageClose.bind(this);
        this.onCoverageOpen = this.onCoverageOpen.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        if (isEmpty(get(this.props, 'diff'))) {
            // Autosave loading in progress
            return;
        }

        if (get(nextProps, 'value.length', 0) > get(this.props, 'value.length', 0) &&
            (!nextProps.readOnly || nextProps.addNewsItemToPlanning)) {
            const coverageId = nextProps.value[nextProps.value.length - 1].coverage_id;
            // A coverage was just added, mark it to be opened in the editor

            if (!nextProps.useLocalNavigation && !isEmpty(nextProps.navigation)) {
                nextProps.navigation.onItemOpen(coverageId);
            } else {
                this.onCoverageOpen(coverageId);
            }
        }
    }

    onCoverageOpen(coverageId) {
        if (!this.state.openCoverageIds.includes(coverageId)) {
            this.setState({openCoverageIds: [...this.state.openCoverageIds, coverageId]});
        }
    }

    onCoverageClose(coverageId) {
        if (this.state.openCoverageIds.includes(coverageId)) {
            this.setState({openCoverageIds: this.state.openCoverageIds.filter((c) => c !== coverageId)});
        }
    }

    render() {
        const {
            field,
            value,
            onChange,
            addButtonText,
            defaultDesk,
            contentTypes,
            newsCoverageStatus,
            maxCoverageCount,
            addOnly,
            originalCount,
            readOnly,
            message,
            popupContainer,
            onPopupOpen,
            onPopupClose,
            setCoverageDefaultDesk,
            preferredCoverageDesks,
            diff,
            navigation,
            useLocalNavigation,
            autoAssignToWorkflow,
            event,
            longEventDurationThreshold,
            ...props
        } = this.props;

        const coverageNavigation = !useLocalNavigation ? navigation : {
            onItemOpen: this.onCoverageOpen,
            onItemClose: this.onCoverageClose,
        };

        return (
            <div>
                <ContentBlock className="coverages__array">
                    <InputArray
                        label={gettext('Coverages')}
                        labelClassName="side-panel__heading side-panel__heading--big"
                        field={field}
                        value={value}
                        onChange={onChange}
                        addButtonText={addButtonText}
                        addButtonComponent={CoverageAddButton}
                        addButtonProps={{
                            contentTypes,
                            defaultDesk,
                            onPopupOpen,
                            onPopupClose,
                            preferredCoverageDesks,
                        }}
                        element={CoverageEditor}
                        defaultElement={planningUtils.defaultCoverageValues.bind(null, newsCoverageStatus,
                            diff,
                            event,
                            longEventDurationThreshold)}
                        readOnly={readOnly}
                        maxCount={maxCoverageCount}
                        addOnly={addOnly}
                        originalCount={originalCount}
                        message={message}
                        row={false}
                        buttonWithLabel
                        popupContainer={popupContainer}
                        onPopupOpen={onPopupOpen}
                        onPopupClose={onPopupClose}
                        setCoverageDefaultDesk={setCoverageDefaultDesk}
                        contentTypes={contentTypes}
                        defaultDesk={defaultDesk}
                        newsCoverageStatus={newsCoverageStatus}
                        diff={diff}
                        navigation={coverageNavigation}
                        openCoverageIds={this.state.openCoverageIds}
                        autoAssignToWorkflow={autoAssignToWorkflow}
                        {...props}
                    />
                </ContentBlock>
            </div>);
    }
}

CoverageArrayInput.propTypes = {
    field: PropTypes.string,
    value: PropTypes.array,
    onChange: PropTypes.func,
    addButtonText: PropTypes.string,
    newsCoverageStatus: PropTypes.array,
    contentTypes: PropTypes.array,
    defaultValue: PropTypes.object,
    readOnly: PropTypes.bool,
    maxCoverageCount: PropTypes.number,
    addOnly: PropTypes.bool,
    originalCount: PropTypes.number,
    message: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
    ]),
    diff: PropTypes.object,
    formProfile: PropTypes.object,
    useLocalNavigation: PropTypes.bool,
    navigation: PropTypes.shape({
        onItemOpen: PropTypes.func,
    }),
    defaultDesk: PropTypes.object,
    popupContainer: PropTypes.func,
    onPopupOpen: PropTypes.func,
    onPopupClose: PropTypes.func,
    setCoverageDefaultDesk: PropTypes.func,
    preferredCoverageDesks: PropTypes.object,
    autoAssignToWorkflow: PropTypes.bool,
    event: PropTypes.object,
    longEventDurationThreshold: PropTypes.number,
    addNewsItemToPlanning: PropTypes.bool,
};

CoverageArrayInput.defaultProps = {
    field: 'coverages',
    addButtonText: 'Add a coverage',
    maxCoverageCount: 0,
};
