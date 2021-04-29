import * as React from 'react';
import {connect} from 'react-redux';

import {superdeskApi} from '../../../superdeskApi';
import {IDesk} from 'superdesk-api';
import {IEditorFieldProps} from '../../../interfaces';

import {desks as getDesks, userDesks as getUserDesks} from '../../../selectors/general';
import {EditorFieldSelect} from './base/select';

interface IProps extends IEditorFieldProps {
    desks: Array<IDesk>;
    restrictToUser?: boolean;
    userDesks: Array<IDesk>;
    includePersonal?: boolean;
}

const mapStateToProps = (state) => ({
    desks: getDesks(state),
    userDesks: getUserDesks(state),
});

export class EditorFieldDeskIdComponent extends React.PureComponent<IProps> {
    render() {
        const {gettext} = superdeskApi.localization;
        const desks: Array<Partial<IDesk>> = !this.props.restrictToUser ?
            Array.from(this.props.desks) :
            Array.from(this.props.userDesks);

        if (this.props.includePersonal) {
            desks.push({
                _id: 'personal-workspace',
                name: gettext('Personal Workspace'),
            });
        }

        return (
            <EditorFieldSelect
                {...this.props}
                field={this.props.field ?? 'desk'}
                label={this.props.label ?? gettext('Desk')}
                options={desks}
                labelField={'name'}
                keyField={'_id'}
                valueAsString={true}
                defaultValue={this.props.desks[0]._id}
            />
        );
    }
}

export const EditorFieldDeskId = connect(
    mapStateToProps,
    null,
    null,
    {forwardRef: true}
)(EditorFieldDeskIdComponent);
