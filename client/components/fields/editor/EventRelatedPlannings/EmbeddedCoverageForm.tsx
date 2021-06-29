import * as React from 'react';

import {IDesk, IUser} from 'superdesk-api';
import {IPlanningNewsCoverageStatus} from '../../../../interfaces';
import {ICoverageDetails} from './CoverageRowForm';
import {superdeskApi} from '../../../../superdeskApi';

import {getDesksForUser, getUsersForDesk} from '../../../../utils';

import {Select, Option} from 'superdesk-ui-framework/react';
import * as List from '../../../UI/List';
import {Row, SelectUserInput} from '../../../UI/Form';
import {EditorFieldNewsCoverageStatus} from '../NewsCoverageStatus';

interface IProps {
    coverage: ICoverageDetails;
    language?: string;
    errors?: {desk?: string};
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

    onStatusChange(field: string, status: IPlanningNewsCoverageStatus) {
        this.props.update({status: status});
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
                                required={true}
                                invalid={this.props.errors?.desk != null}
                                error={this.props.errors?.desk}
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
                        <EditorFieldNewsCoverageStatus
                            testId="status"
                            item={coverage}
                            field="status"
                            label={gettext('Status:')}
                            onChange={this.onStatusChange}
                            language={this.props.language}
                        />
                    </List.Row>
                </List.Column>
            </List.Item>
        );
    }
}
