import React from 'react';
import {IG2ContentType, IPlanningCoverageItem} from '../../../interfaces';
import {IDesk} from 'superdesk-api';
import {AddCoveragesWrapper} from './AddCoveragesWrapper';
import {Button} from 'superdesk-ui-framework/react';

interface IProps {
    field: string;
    value: Array<IPlanningCoverageItem>;
    className?: string;
    buttonClass?: string;
    language?: string;
    disabled?: boolean;

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
    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
    }

    onChange(field: string, coverages: Array<DeepPartial<IPlanningCoverageItem>>) {
        this.props.onChange(
            field,
            coverages,
        );
    }

    render() {
        return (
            <AddCoveragesWrapper
                {...this.props}
                onChange={this.onChange}
                target="icon-plus-large"
                button={({toggleMenu}) => (
                    <Button
                        disabled={this.props.disabled}
                        data-test-id="create-button"
                        type="primary"
                        icon="plus-large"
                        text="plus-large"
                        shape="round"
                        size="small"
                        iconOnly={true}
                        onClick={toggleMenu}
                    />
                )}
            />
        );
    }
}
