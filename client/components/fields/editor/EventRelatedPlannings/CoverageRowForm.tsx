import * as React from 'react';

import {IDesk, IUser} from 'superdesk-api';
import {IG2ContentType, IPlanningNewsCoverageStatus} from '../../../../interfaces';

import {Checkbox, IconButton, IconLabel} from 'superdesk-ui-framework/react';
import * as List from '../../../UI/List';
import {EmbeddedCoverageForm} from './EmbeddedCoverageForm';

export interface ICoverageDetails {
    id: string;
    enabled: boolean;
    qcode: IG2ContentType['qcode'];
    name: IG2ContentType['name'];
    icon: string;
    desk?: IDesk;
    filteredDesks: Array<IDesk>;
    user?: IUser;
    filteredUsers: Array<IUser>;
    popupContainer?: any;
    status: IPlanningNewsCoverageStatus;
}

interface IProps {
    coverage: ICoverageDetails;
    index: number;
    typeCount: number;
    update(original: ICoverageDetails, updates: Partial<ICoverageDetails>): void;
    duplicate(index: number, coverage: ICoverageDetails): void;
    remove(index: number): void;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    desks: Array<IDesk>;
    users: Array<IUser>;
}

export class CoverageRowForm extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.update = this.update.bind(this);
        this.duplicate = this.duplicate.bind(this);
        this.remove = this.remove.bind(this);
        this.toggleEnabled = this.toggleEnabled.bind(this);
    }

    update(updates: Partial<ICoverageDetails>) {
        this.props.update(this.props.coverage, updates);
    }

    duplicate() {
        this.props.duplicate(this.props.index, this.props.coverage);
    }

    remove() {
        this.props.remove(this.props.index);
    }

    toggleEnabled() {
        this.props.update(this.props.coverage, {enabled: !this.props.coverage.enabled});
    }

    render() {
        return (
            <React.Fragment>
                <List.Item
                    key={this.props.coverage.id}
                    shadow={1}
                    className={this.props.coverage.enabled ? 'enabled' : ''}
                >
                    <List.Column border={false}>
                        <List.Row>
                            <Checkbox
                                checked={this.props.coverage.enabled}
                                onChange={this.toggleEnabled}
                                label={{
                                    text: this.props.coverage.id,
                                    hidden: true,
                                }}
                            />
                        </List.Row>
                    </List.Column>
                    <List.Column
                        grow={true}
                        border={false}
                    >
                        <List.Row>
                            <IconLabel
                                text={this.props.coverage.name}
                                icon={this.props.coverage.icon}
                            />
                        </List.Row>
                    </List.Column>
                    <List.ActionMenu row={true}>
                        {this.props.typeCount < 2 ? null : (
                            <IconButton
                                icon="trash"
                                ariaValue="Remove Coverage"
                                onClick={this.remove}
                            />
                        )}
                        <IconButton
                            icon="plus-sign"
                            ariaValue="Duplicate"
                            onClick={this.duplicate}
                        />
                    </List.ActionMenu>
                </List.Item>
                {!this.props.coverage.enabled ? null : (
                    <EmbeddedCoverageForm
                        coverage={this.props.coverage}
                        newsCoverageStatus={this.props.newsCoverageStatus}
                        desks={this.props.desks}
                        users={this.props.users}
                        update={this.update}
                    />
                )}
            </React.Fragment>
        );
    }
}
