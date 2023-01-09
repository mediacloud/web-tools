import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
// import { hot } from 'react-hot-loader/root';
import Snackbar from '@material-ui/core/Snackbar';
import { Col, Row } from 'react-flexbox-grid/lib';
import NavToolbar from './common/header/NavToolbar';
import ErrorBoundary from './common/ErrorBoundary';
import messages from '../resources/messages';
import { getVersion } from '../config';
import { ErrorNotice, WarningNotice } from './common/Notice';
import { assetUrl } from '../lib/assetUtil';
import AppNoticesContainer from './common/header/AppNoticesContainer';
import { fetchStaticTags } from '../actions/systemActions';
import withAsyncData from './common/hocs/AsyncDataContainer';
import AppButton from './common/AppButton';

const localMessages = {
  privacyPolicy: { id: 'app.privacyPolicy', defaultMessage: 'Read our privacy policy.' },
  maintenance: { id: 'app.maintenance', defaultMessage: 'Sorry, we have taken our system down right now for maintenance' },
};

class AppContainer extends React.Component {
  state = {
    open: false,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { feedback } = this.props;
    if (nextProps.feedback.message !== feedback.message) {
      this.setState({ open: true });
    }
  }

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    const { children, feedback, name, user } = this.props;
    let content = children;
    if (document.appConfig.maintenanceMode === 1) {
      content = (
        <div className="maintenance">
          <Row center="lg">
            <ErrorNotice>
              <br /><br />
              <FormattedMessage {...localMessages.maintenance} />
              <br /><br />
              <img alt="under-constrction" src={assetUrl('/static/img/under-construction.gif')} />
              <br /><br />
            </ErrorNotice>
          </Row>
        </div>
      );
    }

    return (
      <div className={`app-container app-${name}`}>
        <AppNoticesContainer />
        <header>
          <NavToolbar />
        </header>
        <ErrorBoundary>
          <div id="content">
            { document.appConfig.systemWarning
              && (
              <div style={{ textAlign: 'center' }}>
                <WarningNotice>
                  <span dangerouslySetInnerHTML={{ __html: document.appConfig.systemWarning }} />
                </WarningNotice>
              </div>
            )}
            {user.isLoggedIn && !user.isAdmin && (
              <Row center="md">
                <Col lg={6} offset={3}>
                  <h1>No Longer Available</h1>
                  <p>
                    <b>As of January 2023 the legacy Media Cloud Explorer and Source Manager tools are no longer available.</b>
                  </p>
                  <p>
                    They have been replaced by the new <a href="https://search.mediacloud.org/search">Search</a> and
                    <a href="https://search.mediacloud.org/directory">Directory</a> web tools, which support cross-platform
                    search  of online content from multiple archives.
                  </p>
                  <AppButton><a href="https://search.mediacloud.org">Try Our New Tools</a></AppButton>
                </Col>
              </Row>
            )}
            {(!user.isLoggedIn || (user.isLoggedIn && user.isAdmin)) && (content)}
          </div>
        </ErrorBoundary>
        <footer>
          <Row center="md">
            <Col lg={6} md={8}>
              <p>
                <small>
                  Media Cloud is a consortium research project across multiple institutions, including the {' '}
                  <a href="https://www.umass.edu/">
                    University of Massachusetts at Amherst
                  </a>
                  , {' '}
                  <a href="https://www.northeastern.edu/">
                    Northeastern University
                  </a>
                  , and {' '}
                  <a href="https://cyber.law.harvard.edu">
                    the Berkman Klein Center for Internet & Society at Harvard University
                  </a>.
                  <br />
                  <FormattedHTMLMessage {...messages.supportOptions} />
                  <br />
                  <a href="https://mediacloud.org/privacy-policy"><FormattedHTMLMessage {...localMessages.privacyPolicy} /></a>
                  <br />
                  v{getVersion()}
                </small>
              </p>
            </Col>
          </Row>
        </footer>
        <Snackbar
          className={feedback.classes ? feedback.classes : 'info_notice'}
          open={this.state.open}
          onClose={this.handleClose}
          message={feedback.message}
          action={feedback.action}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          autoHideDuration={5000}
        />
      </div>
    );
  }
}

AppContainer.propTypes = {
  children: PropTypes.node,
  handleTouchTapLeftIconButton: PropTypes.func,
  intl: PropTypes.object.isRequired,
  // from state
  feedback: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  // from parent
  name: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  showLoginButton: PropTypes.bool,
};

AppContainer.contextTypes = {
  router: PropTypes.object.isRequired,
};

const mapStateToProps = state => ({
  fetchStatus: state.system.staticTags.fetchStatus,
  feedback: state.app.feedback,
  user: state.user,
});

const fetchAsyncData = (dispatch) => {
  dispatch(fetchStaticTags());
};

export default
injectIntl(
  connect(mapStateToProps)(
    withAsyncData(fetchAsyncData)(
      AppContainer
    )
  )
);
