import React from 'react';
import {connect} from 'react-redux';
import classNames from 'classnames';
import {get} from 'lodash';
import moment from 'moment';

import {IUser} from 'superdesk-api';
import {IEventOrPlanningItem, IPlanningCoverageItem, IIngestProvider} from '../../interfaces';
import {superdeskApi} from '../../superdeskApi';

import * as selectors from '../../selectors';
import {InternalNoteLabel} from '../index';

import './style.scss';

interface IProps {
    users: Array<IUser>;
    ingestProviders: Array<IIngestProvider>;
    createdBy: IUser | IIngestProvider['id'] | undefined;
    createdAt: string;
    updatedBy: IUser | IIngestProvider['id'] | undefined;
    updatedAt: string;
    postedBy?: IUser | IIngestProvider['id'] | undefined;
    postedAt?: string;
    showStateInformation?: boolean;
    item: IEventOrPlanningItem | IPlanningCoverageItem;
    withPadding?: boolean;
}

const mapStateToProps = (state) => ({
    users: selectors.general.users(state),
    ingestProviders: selectors.general.ingestProviders(state),
});

class AuditInformationComponent extends React.PureComponent<IProps> {
    getCreator() {
        const {gettext} = superdeskApi.localization;
        const {users, ingestProviders} = this.props;

        const user = get(this.props.createdBy, 'display_name') ?
            this.props.createdBy :
            users.find((u) => (u._id === this.props.createdBy));

        const provider = ingestProviders ?
            ingestProviders.find((p) => (p.id === this.props.createdBy)) :
            null;

        if (user == null && provider != null) {
            provider.display_name = gettext('Ingest: {{ name }}', {name: provider.name});
        }

        return user || provider;
    }

    getUsers() {
        const {
            createdBy,
            createdAt,
            updatedBy,
            updatedAt,
            postedBy,
            postedAt,
            users,
        } = this.props;

        const creator = this.getCreator();
        const versionCreator = get(updatedBy, 'display_name') ?
            updatedBy :
            users.find((user) => user._id === updatedBy);
        const createdDateTime = createdAt ?
            moment(createdAt).fromNow() :
            null;
        const modifiedDateTime = updatedAt ?
            moment(updatedAt).fromNow() :
            null;
        const postCreator = get(postedBy, 'display_name') ?
            postedBy :
            users.find((user) => user._id === postedBy);
        const postedDateTime = postedAt ?
            moment(postedAt).fromNow() :
            null;

        return {
            creator,
            versionCreator,
            createdDateTime,
            modifiedDateTime,
            postCreator,
            postedDateTime,
        };
    }

    render() {
        const {gettext} = superdeskApi.localization;
        const {showStateInformation, item, withPadding} = this.props;
        const {
            creator,
            versionCreator,
            createdDateTime,
            modifiedDateTime,
            postCreator,
            postedDateTime,
        } = this.getUsers();

        return (
            <div className={classNames('TimeAndAuthor', {'TimeAndAuthor--withPadding': withPadding})}>
                {createdDateTime && creator && (
                    <div className="sd-text__date-and-author">
                        <time>
                            {gettext('Created') + ' ' + createdDateTime + ' ' + gettext('by') + ' '}
                        </time>
                        <span className="sd-text__author">
                            {creator?.display_name || creator?.name}
                        </span>
                    </div>
                )}

                {modifiedDateTime && versionCreator && (
                    <div className="sd-text__date-and-author">
                        <time>
                            {gettext('Updated') + ' ' + modifiedDateTime + ' ' + gettext('by') + ' '}
                        </time>
                        <span className="sd-text__author">
                            {versionCreator?.display_name}
                        </span>
                    </div>
                )}

                {postedDateTime && postCreator && (
                    <div className="sd-text__date-and-author">
                        <time>
                            {gettext('Posted') + ' ' + modifiedDateTime + ' ' + gettext('by') + ' '}
                        </time>
                        <span className="sd-text__author">
                            {postCreator?.display_name}
                        </span>
                    </div>
                )}
                {showStateInformation && (
                    <InternalNoteLabel
                        item={item}
                        noteField="state_reason"
                        showText
                        showTooltip={false}
                        stateField="state"
                    />
                )}
            </div>
        );
    }
}

export const AuditInformation = connect(mapStateToProps)(AuditInformationComponent);
