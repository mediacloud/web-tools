import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Row, Col } from 'react-flexbox-grid/lib';
import withIntlForm from '../../../common/hocs/IntlForm';

const localMessages = {
  nameLabel: { id: 'source.add.name.label', defaultMessage: 'Name of Source' },
  urlLabel: { id: 'source.add.url.label', defaultMessage: 'URL' },
  editorNotesLabel: { id: 'source.add.editorNotes.label', defaultMessage: 'Editor\'s Notes' },
  editorNotesHint: { id: 'source.add.editorNotes.hint', defaultMessage: 'Add some editor-only notes about this source - these won\'t show up for normal users' },
  nameError: { id: 'source.add.name.error', defaultMessage: 'You have to enter a name for this source.' },
  urlError: { id: 'source.add.url.error', defaultMessage: 'Pick have to enter a url for this source.' },
  publicNotesLabel: { id: 'source.add.publicNotes.label', defaultMessage: 'Public Notes' },
  publicNotesHint: { id: 'source.add.publicNotes.hint', defaultMessage: 'Add some public notes about this source' },
  isMonitoredLabel: { id: 'source.add.monitor.label', defaultMessage: 'Monitored' },
};

const SourceDetailsForm = (props) => {
  const { renderTextField, renderCheckbox, initialValues } = props;
  return (
    <div className="source-details-form">
      <Row>
        <Col md={2}>
          <span className="label unlabeled-field-label">
            <FormattedMessage {...localMessages.nameLabel} />
          </span>
        </Col>
        <Col md={4}>
          <Field
            name="name"
            component={renderTextField}
            fullWidth
          />
        </Col>
      </Row>
      <Row>
        <Col md={2}>
          <span className="label unlabeled-field-label">
            <FormattedMessage {...localMessages.urlLabel} />
          </span>
        </Col>
        <Col md={4}>
          <Field
            name="url"
            component={renderTextField}
            fullWidth
          />
        </Col>
      </Row>
      <Row>
        <Col md={2}>
          <span className="label unlabeled-field-label">
            <FormattedMessage {...localMessages.publicNotesLabel} />
          </span>
        </Col>
        <Col md={8}>
          <Field
            name="public_notes"
            component={renderTextField}
            label={localMessages.publicNotesHint}
            fullWidth
            disabled={initialValues.disabled}
            minRows={2}
          />
        </Col>
      </Row>
      <Row>
        <Col md={2}>
          <span className="label unlabeled-field-label">
            <FormattedMessage {...localMessages.editorNotesLabel} />
          </span>
        </Col>
        <Col md={8}>
          <Field
            name="editor_notes"
            component={renderTextField}
            label={localMessages.editorNotesHint}
            disabled={initialValues.disabled}
            fullWidth
            minRows={2}
          />
        </Col>
      </Row>
      <Row>
        <Col md={2}>
          <Field
            name="monitored"
            component={renderCheckbox}
            fullWidth
            label={localMessages.isMonitoredLabel}
            disabled={initialValues.disabled}
          />
        </Col>
      </Row>
    </div>
  );
};

SourceDetailsForm.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  renderTextField: PropTypes.func.isRequired,
  renderCheckbox: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
};

const reduxFormConfig = {
  form: 'sourceForm',
};

export default
injectIntl(
  withIntlForm(
    reduxForm(reduxFormConfig)(
      SourceDetailsForm
    )
  )
);
