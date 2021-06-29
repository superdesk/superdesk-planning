import * as React from 'react';

import {getUserInterfaceLanguage} from 'appConfig';
import {IDesk, IUser} from 'superdesk-api';
import {IG2ContentType, IPlanningNewsCoverageStatus} from '../../../../interfaces';

import {planningUtils} from '../../../../utils';
import {getVocabularyItemFieldTranslated} from '../../../../utils/vocabularies';

import {Checkbox, IconButton, IconLabel} from 'superdesk-ui-framework/react';
import * as List from '../../../UI/List';
import {EmbeddedCoverageForm} from './EmbeddedCoverageForm';

export interface ICoverageDetails {
    id: string;
    enabled: boolean;
    type: IG2ContentType;
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
    language?: string;
    errors?: {desk?: string};
    update(original: ICoverageDetails, updates: Partial<ICoverageDetails>): void;
    duplicate(index: number, coverage: ICoverageDetails): void;
    remove(index: number): void;
    desks: Array<IDesk>;
    users: Array<IUser>;
}

function getCoverageIconName(type: IG2ContentType): string {
    const name = planningUtils.getCoverageIcon(type['content item type'] || type.qcode, null);

    return name.substr(5); // remove `icon-` from the name
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
            <div
                data-test-id={`coverage_${this.props.index}`}
                style={{display: 'contents'}}
            >
                <List.Item
                    key={this.props.coverage.id}
                    shadow={1}
                    className={this.props.coverage.enabled ? 'enabled' : ''}
                >
                    <List.Column border={false}>
                        <List.Row testId="enabled">
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
                                text={getVocabularyItemFieldTranslated(
                                    this.props.coverage.type,
                                    'name',
                                    this.props.language ?? getUserInterfaceLanguage()
                                )}
                                icon={getCoverageIconName(this.props.coverage.type)}
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
                        language={this.props.language}
                        errors={this.props.errors}
                        desks={this.props.desks}
                        users={this.props.users}
                        update={this.update}
                    />
                )}
            </div>
        );
    }
}
