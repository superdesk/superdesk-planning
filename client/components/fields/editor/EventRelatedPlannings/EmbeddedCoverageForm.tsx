import * as React from 'react';

import {IDesk, IUser} from 'superdesk-api';
import {IPlanningNewsCoverageStatus} from '../../../../interfaces';
import {ICoverageDetails} from './CoverageRowForm';
import {superdeskApi} from '../../../../superdeskApi';

import {getDesksForUser, getUsersForDesk} from '../../../../utils';

import {Select, Option} from 'superdesk-ui-framework/react';
import * as List from '../../../UI/List';
import {Row, SelectUserInput} from '../../../UI/Form';

interface IProps {
    coverage: ICoverageDetails;
    newsCoverageStatus: Array<IPlanningNewsCoverageStatus>;
    desks: Array<IDesk>;
    users: Array<IUser>;

    update(updates: Partial<ICoverageDetails>): void;
}

export class EmbeddedCoverageForm extends React.PureComponent<IProps> {
    constructor(props) {
        super(props);

        this.onDeskChange = this.onDeskChange.bind(this);
        this.onStatusChange = this.onStatusChange.bind(this);
        this.onUserChange = this.onUserChange.bind(this);
    }

    onDeskChange(deskId?: IDesk['_id']) {
        const newDesk = deskId == null ?
            null :
            this.props.desks.find((desk) => desk._id === deskId);

        const updates: Partial<ICoverageDetails> = {
            desk: newDesk,
            filteredUsers: getUsersForDesk(newDesk, this.props.users),
        };

        this.props.update(updates);
    }

    onStatusChange(statusId: IPlanningNewsCoverageStatus['qcode']) {
        const newStatus = this.props.newsCoverageStatus.find(
            (status) => status.qcode === statusId
        );

        this.props.update({status: newStatus});
    }

    onUserChange(field: string, user?: IUser) {
        const updates: Partial<ICoverageDetails> = {
            user: user,
            filteredDesks: getDesksForUser(user, this.props.desks),
        };

        this.props.update(updates);
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {coverage} = this.props;

        return (
            <List.Item shadow={1} className="sd-margin-t--0">
                <List.Column
                    grow={true}
                    border={false}
                >
                    <List.Row>
                        <Row
                            testId="desk"
                            noPadding={true}
                        >
                            <Select
                                label={gettext('Desk:')}
                                value={coverage.desk?._id}
                                onChange={this.onDeskChange}
                            >
                                <Option />
                                {coverage.filteredDesks.map(
                                    (desk) => (
                                        <Option
                                            key={desk._id}
                                            value={desk._id}
                                        >
                                            {desk.name}
                                        </Option>
                                    )
                                )}
                            </Select>
                        </Row>
                    </List.Row>
                    <List.Row>
                        <Row
                            testId="user"
                            noPadding={true}
                        >
                            <SelectUserInput
                                field="user"
                                placeholder={gettext('Search users')}
                                value={coverage.user}
                                onChange={this.onUserChange}
                                users={coverage.filteredUsers}
                            />
                        </Row>
                    </List.Row>
                    <List.Row>
                        <Row
                            testId="status"
                            noPadding={true}
                        >
                            <Select
                                label={gettext('Status:')}
                                value={coverage.status.qcode}
                                onChange={this.onStatusChange}
                            >
                                {this.props.newsCoverageStatus.map(
                                    (status) => (
                                        <Option
                                            key={status.qcode}
                                            value={status.qcode}
                                        >
                                            {status.name}
                                        </Option>
                                    )
                                )}
                            </Select>
                        </Row>
                    </List.Row>
                </List.Column>
            </List.Item>
        );
    }
}
