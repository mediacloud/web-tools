import PropTypes from 'prop-types';
import React from 'react';
import { reduxForm, Field } from 'redux-form';
import { Row, Col } from 'react-flexbox-grid/lib';
import AppButton from '../../common/AppButton';
import withIntlForm from '../../common/hocs/IntlForm';

const localMessages = {
  name: { id: 'topic.form.detail.name', defaultMessage: 'Topic Name (what is this about?)' },
  nameError: { id: 'topic.form.detail.name.error', defaultMessage: 'Your topic needs a short dsecriptive name.' },
  description: { id: 'topic.form.detail.description', defaultMessage: 'Description (why are you making this?)' },
  descriptionError: { id: 'topic.form.detail.desciption.error', defaultMessage: 'Your topic need a description.' },
  maxStories: { id: 'topic.form.detail.maxStories', defaultMessage: 'Maximum # of Stories' },
  maxSeedStoriesHelp: { id: 'topic.form.detail.maxStories', defaultMessage: 'Public users can make topics with up to 100,000 total stories.  Change this if you want to allow a special case exception.' },
  public: { id: 'topic.form.detail.public', defaultMessage: 'Public?' },
  logogram: { id: 'topic.form.detail.logogram', defaultMessage: 'Content in a Logographic Language? (ie. Chinese or Japanese Kanji?)' },
  crimsonHexagon: { id: 'topic.form.detail.crimsonHexagon', defaultMessage: 'Crimson Hexagon Id' },
  crimsonHexagonHelp: { id: 'topic.form.detail.crimsonHexagon.help', defaultMessage: 'If you have set up a Crimson Hexagon monitor on our associated account, enter it\'s numeric ID here and we will automatically pull in all the stories linked to by tweets in your monitor.' },
  maxIterations: { id: 'topic.form.detail.maxIterations', defaultMessage: 'Max Spider Iterations' },
  maxIterationsHelp: { id: 'topic.form.detail.maxIterations.help', defaultMessage: 'You can change how many rounds of spidering you want to do.  If you expect this topic to explode with lots and lots of linked-to stories about the same topic, then keep this small.  Otherwise leave it with the default of 15.' },
};

const TopicSettingsForm = (props) => {
  const { renderTextField, renderCheckbox, handleSubmit, pristine, submitting, asyncValidating, initialValues, onSubmit } = props;
  const { formatMessage } = props.intl;
  return (
    <form className="edit-topic-settings" name="topicForm" onSubmit={handleSubmit(onSubmit.bind(this))}>
      <Row>
        <Col lg={6}>
          <Field
            name="name"
            component={renderTextField}
            fullWidth
            label={formatMessage(localMessages.name)}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={6}>
          <Field
            name="description"
            component={renderTextField}
            fullWidth
            label={formatMessage(localMessages.description)}
            minRows={4}
            multiline
          />
        </Col>
      </Row>
      <Row>
        <Col lg={8}>
          <Field
            name="is_logogram"
            component={renderCheckbox}
            fullWidth
            label={formatMessage(localMessages.logogram)}
          />
        </Col>
      </Row>
      <Row>
        <Col lg={12}>
          <AppButton
            style={{ marginTop: 30 }}
            type="submit"
            disabled={pristine || submitting || asyncValidating === true}
            label={initialValues.buttonLabel}
            primary
          />
        </Col>
      </Row>
    </form>
  );
};

TopicSettingsForm.propTypes = {
  // from compositional chain
  intl: PropTypes.object.isRequired,
  renderTextField: PropTypes.func.isRequired,
  renderCheckbox: PropTypes.func.isRequired,
  renderSelect: PropTypes.func.isRequired,
  // from parent
  initialValues: PropTypes.object,
  handleSubmit: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  error: PropTypes.string,
  asyncValidating: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]).isRequired,
  submitting: PropTypes.bool.isRequired,
};

const reduxFormConfig = {
  form: 'topicForm',
};

export default
withIntlForm(
  reduxForm(reduxFormConfig)(
    TopicSettingsForm
  )
);
