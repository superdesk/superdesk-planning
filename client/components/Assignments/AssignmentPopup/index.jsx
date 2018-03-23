import React from 'react';
import PropTypes from 'prop-types';

import {set, cloneDeep} from 'lodash';
import {gettext} from '../../../utils';

import {ButtonList} from '../../UI';
import {Popup, Header, Footer, Content} from '../../UI/Popup';
import {AssignmentEditor} from '../AssignmentEditor';

import './style.scss';

export class AssignmentPopup extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            diff: cloneDeep(props.value) || {},
            valid: true,
        };
        this.dom = {popupContainer: null};

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.getPopupContainer = this.getPopupContainer.bind(this);
        this.setValid = this.setValid.bind(this);
    }

    onChange(field, value) {
        const diff = cloneDeep(this.state.diff);

        set(diff, field, value);
        this.setState({diff});
    }

    onSubmit() {
        this.props.onChange(this.props.field, this.state.diff);
        this.props.onClose();
    }

    getPopupContainer() {
        return this.dom.popupContainer;
    }

    setValid(valid) {
        this.setState({valid});
    }

    render() {
        const {
            onClose,
            target,
            users,
            desks,
            coverageProviders,
            priorities,
            priorityPrefix,
            disableDeskSelection,
        } = this.props;

        const {diff} = this.state;

        const buttonList = [{
            color: 'primary',
            className: 'pull-right',
            onClick: this.onSubmit,
            disabled: !this.state.valid,
            text: gettext('OK'),
            enterKeyIsClick: true,
        },
        {
            className: 'pull-right',
            onClick: onClose,
            text: gettext('Cancel'),
            enterKeyIsClick: true,
        }];

        return (
            <Popup
                close={onClose}
                target={target}
                className="assignment-popup"
                onKeyDown={this.onKeyDown}
            >
                <Header text="Assignment Details" onClose={onClose} />
                <Content>
                    <AssignmentEditor
                        value={diff}
                        onChange={this.onChange}
                        onClose={onClose}
                        users={users}
                        desks={desks}
                        coverageProviders={coverageProviders}
                        priorities={priorities}
                        priorityPrefix={priorityPrefix}
                        popupContainer={this.getPopupContainer}
                        disableDeskSelection={disableDeskSelection}
                        setValid={this.setValid}
                    />
                </Content>
                <Footer>
                    <ButtonList buttonList={buttonList} captureShiftTab={false} />
                </Footer>
                <div ref={(node) => this.dom.popupContainer = node} />
            </Popup>
        );
    }
}

AssignmentPopup.propTypes = {
    field: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func,
    onClose: PropTypes.func,
    target: PropTypes.string,
    users: PropTypes.array,
    desks: PropTypes.array,
    coverageProviders: PropTypes.array,
    priorities: PropTypes.array,
    priorityPrefix: PropTypes.string,
    disableDeskSelection: PropTypes.bool,
};

AssignmentPopup.defaultProps = {priorityPrefix: ''};
