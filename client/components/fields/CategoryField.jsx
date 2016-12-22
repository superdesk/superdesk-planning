import React from 'react'
import Select from 'react-select'
import 'react-select/dist/react-select.css'
import { connect } from 'react-redux'
import * as actions from '../../actions'

class CategoryFieldComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.props.loadCategories()
    }

    render() {
        const { input, label, options, selectedOptions } = this.props
        const { touched, error, warning } = this.props.meta
        return (
            <div className="field">
                {label && <label>{label}</label>}
                <Select
                    value={selectedOptions}
                    multi={true}
                    options={options}
                    onChange={(opts) => (
                        input.onChange(opts.map((opt) => (opt.value)))
                    )}
                    className="line-input"
                />
                {touched && ((error && <span className="help-block">{error}</span>) ||
                (warning && <span className="help-block">{warning}</span>))}
            </div>
        )
    }
}
CategoryFieldComponent.propTypes = {
    input: React.PropTypes.object.isRequired,
    label: React.PropTypes.string,
    meta: React.PropTypes.object.isRequired,
    options: React.PropTypes.array.isRequired,
    selectedOptions: React.PropTypes.array.isRequired,
    loadCategories: React.PropTypes.func.isRequired,
}

const mapStateToProps = (state, ownProps) => ({
    options: state.vocabularies.anpaCategories.map((cat) => (
        { label: cat.name, value: cat }
    )),
    selectedOptions: (ownProps.input.value || []).map((cat) => (
        { label: cat.name, value: cat }
    )),
})

const mapDispatchToProps = (dispatch) => ({
    loadCategories: () => dispatch(actions.loadCategories())
})

export const CategoryField = connect(mapStateToProps, mapDispatchToProps)(CategoryFieldComponent)
