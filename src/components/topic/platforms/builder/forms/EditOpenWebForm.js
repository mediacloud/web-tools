import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm, formValueSelector } from 'redux-form';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Row, Col } from 'react-flexbox-grid/lib';
import withIntlForm from '../../../../common/hocs/IntlForm';
import messages from '../../../../../resources/messages';
import MediaPickerDialog from '../../../../common/mediaPicker/MediaPickerDialog';
import QueryHelpDialog from '../../../../common/help/QueryHelpDialog';
import OpenWebMediaFieldArray from '../../../../common/form/OpenWebMediaFieldArray';

const formSelector = formValueSelector('platform');

class EditOpenWebForm extends React.Component {
  state = {
    childDialogOpen: false,
  };

  setQueryFormChildDialogOpen = () => {
    this.setState(prevState => ({ childDialogOpen: !prevState.childDialogOpen }));
  };

  selectMediaAndChangeFormValues = selected => {
    const { onFormChange } = this.props;
    onFormChange('media', selected);
  }

  render() {
    const { renderSolrTextField, intl, initialValues, selectedMedia, onFormChange } = this.props;
    return (
      <Row>
        <Col lg={6}>
          <label htmlFor="query"><FormattedMessage {...messages.query} /></label>
          <Row>
            <Col lg={12}>
              <div>
                <Field
                  className="query-field"
                  name="query"
                  component={renderSolrTextField}
                  multiline
                  minRows={2}
                  maxRows={4}
                  fullWidth
                />
                <small>
                  <b><QueryHelpDialog trigger={intl.formatMessage(messages.queryHelpLink)} /></b>
                </small>
              </div>
            </Col>
          </Row>
        </Col>
        <Col lg={6}>
          <div className="media-field-wrapper">
            <label htmlFor="media"><FormattedMessage {...messages.topicSourceCollectionsProp} /></label>
            <OpenWebMediaFieldArray
              formatMessage={intl.formatMessage}
              className="query-field"
              form="platform"
              enableReinitialize
              keepDirtyOnReinitialize
              destroyOnUnmount={false}
              fieldName="media"
              initialValues={initialValues} // to and from MediaPicker
              allowRemoval
              onDelete={onFormChange}
            />
            <MediaPickerDialog
              initMedia={selectedMedia.media ? selectedMedia.media : initialValues.media}
              onConfirmSelection={selected => this.selectMediaAndChangeFormValues(selected)}
              setQueryFormChildDialogOpen={this.setQueryFormChildDialogOpen}
            />
          </div>
        </Col>
      </Row>
    );
  }
}

EditOpenWebForm.propTypes = {
  // from parent
  initialValues: PropTypes.object,
  onEnterKey: PropTypes.func,
  state: PropTypes.object,
  // from state
  change: PropTypes.func.isRequired,
  // from dispatch
  onFormChange: PropTypes.func.isRequired,
  selectedMedia: PropTypes.object,
  // from compositional helper
  intl: PropTypes.object.isRequired,
  renderSolrTextField: PropTypes.func.isRequired,
  handleMediaDelete: PropTypes.func,
};

const reduxFormConfig = {
  form: 'platform', // make sure this matches the sub-components and other wizard steps
  destroyOnUnmount: false, // <------ preserve form data
  forceUnregisterOnUnmount: true, // <------ unregister fields on unmount
  enableReinitialize: true,
};

const mapStateToProps = state => ({
  selectedMedia: formSelector(state, 'uid', 'media', 'sources', 'collections', 'searches'),
});

export default
injectIntl(
  withIntlForm(
    reduxForm(reduxFormConfig)(
      connect(mapStateToProps)(
        EditOpenWebForm
      )
    )
  )
);
