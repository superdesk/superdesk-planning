import React from 'react';
import {isEqual} from 'lodash';

import {IG2ContentType, IPlanningCoverageItem} from '../../../interfaces';
import {IDesk} from 'superdesk-api';
import {superdeskApi} from '../../../superdeskApi';

import {AddCoveragesWrapper} from './AddCoveragesWrapper';

interface IProps {
    field: string;
    value: Array<IPlanningCoverageItem>;
    className?: string;
    buttonClass?: string;
    language?: string;

    onChange(field: string, value: Array<DeepPartial<IPlanningCoverageItem>>): void;
    createCoverage(qcode: IG2ContentType['qcode']): DeepPartial<IPlanningCoverageItem>;
    onOpen?(): void;
    onAdd(
        qcode: IG2ContentType['qcode'],
        defaultDesk?: IDesk,
        preferredCoverageDesks?: {[key: string]: IDesk['_id']}
    ): void;
    onPopupOpen?(): void;
    onPopupClose?(): void;
}

export class CoverageAddButton extends React.Component<IProps> {
    shouldComponentUpdate(nextProps: Readonly<IProps>, nextState: Readonly<{}>, nextContext: any): boolean {
        // For some reason this component get's re-rendered (which causes problems with e2e tests)
        // Make sure to only re-render if Coverage ID's change
        const prevIds = (this.props.value ?? []).map((coverage) => coverage.coverage_id);
        const nextIds = (nextProps.value ?? []).map((coverage) => coverage.coverage_id);

        return this.props.field !== nextProps.field ||
            !isEqual(prevIds, nextIds) ||
            this.props.language !== nextProps.language;
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {
            className = 'dropdown dropdown--align-right dropdown--dropup pull-right',
            buttonClass = 'dropdown__toggle sd-create-btn',
            ...props
        } = this.props;

        return (
            <AddCoveragesWrapper
                {...props}
                target="icon-plus-large"
                button={({toggleMenu}) => (
                    <div className={className}>
                        <button
                            className={buttonClass}
                            onClick={toggleMenu}
                            title={gettext('Create new coverage')}
                        >
                            <i className="icon-plus-large" />
                            <span className="circle" />
                        </button>
                    </div>
                )}
            />
        );
    }
}
