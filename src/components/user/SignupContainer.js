import PropTypes from 'prop-types';
import React from 'react';
import { Field, reduxForm } from 'redux-form';
import { Grid, Row, Col } from 'react-flexbox-grid/lib';
import { connect } from 'react-redux';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';
import { replace } from 'react-router-redux';
import { signupUser } from '../../actions/userActions';
// import { updateFeedback } from '../../actions/appActions';
import AppButton from '../common/AppButton';
import Captcha from '../common/form/Captcha';
import messages from '../../resources/messages';
import { emptyString, invalidEmail, passwordTooShort, stringsDoNotMatch } from '../../lib/formValidators';
import withIntlForm from '../common/hocs/IntlForm';
import { addNotice } from '../../actions/appActions';
import { LEVEL_ERROR, WarningNotice } from '../common/Notice';
import PageTitle from '../common/PageTitle';

const localMessages = {
  intro: { id: 'user.signup.intro', defaultMessage: 'Create an account to use all our tools for free.' },
  missingEmail: { id: 'user.missingEmail', defaultMessage: 'You need to enter a valid email address.' },
  missingFullname: { id: 'user.missingName', defaultMessage: 'You need to enter your full name.' },
  missingPassword: { id: 'user.missingPassword', defaultMessage: 'You need to enter your password.' },
  missingNotes: { id: 'user.missingNotes', defaultMessage: 'You have to tell us a little about why you want to use Media Cloud.' },
  missingConsent: { id: 'user.missingConsent', defaultMessage: 'You must agree to our Terms and Policies' },
  feedback: { id: 'user.signUp.feedback', defaultMessage: 'Successfully signed up.' },
  notesHint: { id: 'user.notes.hint', defaultMessage: 'Tell us a little about what you want to use Media Cloud for' },
  userAlreadyExists: { id: 'user.signUp.error.alreadyExists', defaultMessage: 'Sorry, but a user with that email already exists! Did you <a href="/#/request-password-reset">need to reset your password</a>?' },
  disabled: { id: 'user.signUp.disabled', defaultMessage: 'We are transitioning to a new search system and have disabled new account signups for now in Explorer and Source Manager.' },
  newSearch: { id: 'user.signUp.newSearch', defaultMessage: 'Try our <a href="https://search.mediacloud.org/">new search tool</a>.' },
  signupSuccess: { id: 'user.signUp.success',
    defaultMessage: '<h1>Click the link we just emailed you</h1>'
    + '<p>To make sure your email is valid, we have sent you a message with a magic link for you to click.  Click the link in the email to confirm that we got your email right.<p>'
    + '<p><a href="post-to-recover-password">Click here to send the email again</a>.</p>.' },
};

class SignupContainer extends React.Component {
  state = {
    passedCaptcha: false,
  }

  passedCaptcha() {
    this.setState({ passedCaptcha: true });
  }

  render() {
    const { handleSubmit, handleSignupSubmission, pristine, submitting, renderTextField, renderCheckbox } = this.props;
    const { formatMessage } = this.props.intl;
    const signupAllowed = document.appConfig.signupAllowed === 1;
    return (
      <Grid>
        <PageTitle value={messages.userSignup} />
        { !signupAllowed && (
          <>
            <br />
            <br />
            <WarningNotice>
              <FormattedMessage {...localMessages.disabled} /> <FormattedHTMLMessage {...localMessages.newSearch} />
            </WarningNotice>
          </>
        )}
        { signupAllowed && (
          <form onSubmit={handleSubmit(handleSignupSubmission.bind(this))} className="app-form signup-form">
            <Row>
              <Col lg={12}>
                <h1><FormattedMessage {...messages.userSignup} /></h1>
                <p><FormattedMessage {...localMessages.intro} /></p>
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Field
                  name="email"
                  fullWidth
                  component={renderTextField}
                  label={messages.userEmail}
                />
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Field
                  name="fullName"
                  type="text"
                  fullWidth
                  component={renderTextField}
                  label={messages.userFullName}
                />
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Field
                  name="password"
                  type="password"
                  fullWidth
                  component={renderTextField}
                  label={messages.userPassword}
                />
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Field
                  name="confirmPassword"
                  type="password"
                  fullWidth
                  component={renderTextField}
                  label={messages.userConfirmPassword}
                />
              </Col>
            </Row>
            <Row>
              <Col lg={6}>
                <Field
                  name="notes"
                  multiline
                  fullWidth
                  minRows={2}
                  maxRows={4}
                  component={renderTextField}
                  placeholder={formatMessage(localMessages.notesHint)}
                  label={messages.userNotes}
                />
              </Col>
            </Row>
            <Row>
              <Col lg={8}>
                <Field
                  name="has_consented"
                  component={renderCheckbox}
                  fullWidth
                  label={messages.userConsent}
                />
              </Col>
            </Row>
            <Row>
              <Captcha onChange={() => this.passedCaptcha()} />
            </Row>
            <Row>
              <Col lg={12}>
                <AppButton
                  type="submit"
                  label={formatMessage(messages.userSignup)}
                  primary
                  disabled={!this.state.passedCaptcha || pristine || submitting}
                />
              </Col>
            </Row>
          </form>
        )}
      </Grid>
    );
  }
}

SignupContainer.propTypes = {
  // from composition
  intl: PropTypes.object.isRequired,
  location: PropTypes.object,
  redirect: PropTypes.string,
  handleSubmit: PropTypes.func.isRequired,
  renderTextField: PropTypes.func.isRequired,
  renderCheckbox: PropTypes.func.isRequired,
  pristine: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  // from state
  fetchStatus: PropTypes.string.isRequired,
  // from dispatch
  handleSignupSubmission: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.user.fetchStatus,
});

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleSignupSubmission: values => dispatch(signupUser(values))
    .then((response) => {
      if (response.success !== 1) {
        if (response.message.includes('already exists')) {
          dispatch(addNotice({ level: LEVEL_ERROR, htmlMessage: ownProps.intl.formatMessage(localMessages.userAlreadyExists) }));
        } else {
          dispatch(addNotice({ level: LEVEL_ERROR, message: response.message }));
        }
      } else {
        dispatch(replace('/user/signup-success'));
      }
    }),
});

// in-browser validation callback
function validate(values) {
  const errors = {};
  if (invalidEmail(values.email)) {
    errors.email = localMessages.missingEmail;
  }
  if (emptyString(values.fullName)) {
    errors.fullName = localMessages.missingName;
  }
  if (emptyString(values.password)) {
    errors.password = localMessages.missingPassword;
  }
  if (passwordTooShort(values.password)) {
    errors.password = messages.passwordTooShort;
  }
  if (passwordTooShort(values.confirmPassword)) {
    errors.confirmPassword = messages.passwordTooShort;
  }
  if (stringsDoNotMatch(values.password, values.confirmPassword)) {
    errors.password = messages.passwordsMismatch;
  }
  if (!values.has_consented) {
    errors.has_consented = localMessages.missingConsent;
  }
  if (emptyString(values.notes)) {
    errors.notes = localMessages.missingNotes;
  }
  return errors;
}

const reduxFormConfig = {
  form: 'signup',
  validate,
};

export default
withIntlForm(
  reduxForm(reduxFormConfig)(
    connect(mapStateToProps, mapDispatchToProps)(
      SignupContainer
    )
  )
);
