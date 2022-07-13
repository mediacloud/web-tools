import json
import logging.config
import os
import sys
import tempfile
from flask import Flask, render_template
from flask_webpack import Webpack
from flask_mail import Mail
import flask_login
from raven.conf import setup_logging
from raven.contrib.flask import Sentry
from raven.handlers.logging import SentryHandler
import mediacloud.api
from cliff.api import Cliff
import redis
import jinja2
from flask_executor import Executor

from server.sessions import RedisSessionInterface
from server.util.config import get_default_config, ConfigException
from server.commands import sync_frontend_db
from server.database import UserDatabase, AnalyticsDatabase

SERVER_MODE_DEV = "dev"
SERVER_MODE_PROD = "prod"

SERVER_APP_TOPICS = "topics"
SERVER_APP_SOURCES = "sources"
SERVER_APP_TOOLS = "tools"
SERVER_APP_EXPLORER = "explorer"

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_dir = os.path.join(base_dir, 'server', 'static', 'data')

# setup logging
with open(os.path.join(base_dir, 'config', 'server-logging.json'), 'r') as f:
    logging_config = json.load(f)
    logging_config['handlers']['file']['filename'] = os.path.join(base_dir,
                                                                  logging_config['handlers']['file']['filename'])
logging.config.dictConfig(logging_config)
logger = logging.getLogger(__name__)
logger.info("---------------------------------------------------------------------------")
flask_login_logger = logging.getLogger('flask_login')
flask_login_logger.setLevel(logging.DEBUG)

# load the config helper
config = get_default_config()

server_mode = config.get('SERVER_MODE').lower()
if server_mode not in [SERVER_MODE_DEV, SERVER_MODE_PROD]:
    logger.error("Unknown server mode '{}', set a mode in the `config/app.config` file".format(server_mode))
    sys.exit(1)
else:
    logger.info("Started server in %s mode", server_mode)

# setup optional sentry logging service
try:
    handler = SentryHandler(config.get('SENTRY_DSN'))
    handler.setLevel(logging.ERROR)
    setup_logging(handler)
except ConfigException as e:
    logger.info("no sentry logging")


# Connect to MediaCloud
TOOL_API_KEY = config.get('MEDIA_CLOUD_API_KEY')
MEDIA_CLOUD_API_TIMEOUT = config.get('MEDIA_CLOUD_API_TIMEOUT')
logger.info("MEDIA_CLOUD_API_TIMEOUT set to {}".format(MEDIA_CLOUD_API_TIMEOUT))

mc = mediacloud.api.AdminMediaCloud(TOOL_API_KEY)
mc.TIMEOUT_SECS = MEDIA_CLOUD_API_TIMEOUT
try:
    mc.V2_API_URL = config.get('MEDIA_CLOUD_API_URL')
except ConfigException:
    pass  # just use the default API url because a custom one is not defined
logger.info("Connected to mediacloud")

# Connect to CLIFF if the settings are there
cliff = None
try:
    cliff = Cliff(config.get('CLIFF_URL'))
except KeyError as e:
    logger.warning("no CLIFF connection")

NYT_THEME_LABELLER_URL = config.get('NYT_THEME_LABELLER_URL')

# Connect to the app's mongo DB
try:
    user_db = UserDatabase(config.get('MONGO_URL'))
    analytics_db = AnalyticsDatabase(config.get('MONGO_URL'))
    user_db.check_connection()
    logger.info("Connected to DB: {}".format(config.get('MONGO_URL')))
except Exception as err:
    logger.error("DB error: {0}".format(err))
    logger.exception(err)
    sys.exit()


def is_dev_mode():
    return server_mode == SERVER_MODE_DEV


def is_prod_mode():
    return server_mode == SERVER_MODE_PROD


webpack = Webpack()
mail = Mail()


def create_app():
    # Factory method to create the app
    prod_app_name = config.get('SERVER_APP')
    my_app = Flask(__name__)
    # set up uploading
    my_app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB
    my_app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()
    # Set up sentry logging
    my_app.config['SENTRY_USER_ATTRS'] = ['email']
    try:
        sentry_dsn = config.get('SENTRY_DSN')
        Sentry(my_app, dsn=sentry_dsn)
    except ConfigException as ce:
        logger.warning(ce)
    # set up webpack
    if is_dev_mode():
        manifest_path = '../build/public/manifest.json'
    else:
        manifest_path = '../server/static/gen/{}/manifest.json'.format(prod_app_name)
    webpack_config = {
        'DEBUG': is_dev_mode(),
        'WEBPACK_MANIFEST_PATH': manifest_path
    }
    # caching and CDN config
    my_app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 7 * 24 * 60 * 60
    try:
        cdn_asset_url = config.get('ASSET_URL')
        webpack_config['WEBPACK_ASSETS_URL'] = cdn_asset_url
        logger.info("Asset pipeline: {}".format(cdn_asset_url))
    except ConfigException:
        logger.info("Asset pipeline: no cdn")
    my_app.config.update(webpack_config)
    webpack.init_app(my_app)
    # set up mail sending
    try:
        if config.get('SMTP_ENABLED') == '1':
            mail_config = {     # @see https://pythonhosted.org/Flask-Mail/
                'MAIL_SERVER': config.get('SMTP_SERVER'),
                'MAIL_PORT': int(config.get('SMTP_PORT')),
                'MAIL_USE_SSL': config.get('SMTP_USE_SSL'),
                'MAIL_USERNAME': config.get('SMTP_USER'),
                'MAIL_PASSWORD': config.get('SMTP_PASS'),
            }
            my_app.config.update(mail_config)
            mail.init_app(my_app)
            logger.info('Mailing from {} via {}'.format(config.get('SMTP_USER'), config.get('SMTP_SERVER')))
            # need to tell jinja to look in "emails" directory directly for the shared email templates
            # because the `imports` in them don't include relative paths
            my_loader = jinja2.ChoiceLoader([
                my_app.jinja_loader,
                jinja2.FileSystemLoader([os.path.join(base_dir, 'server', 'templates'),
                                         os.path.join(base_dir, 'server', 'templates', 'emails')])
            ])
            my_app.jinja_loader = my_loader
        else:
            logger.warning("Mail configured, but not enabled")
    except ConfigException as ce:
        logger.exception(ce)
        logger.warning("No mail configured")
    # set up thread pooling
    my_app.config['EXECUTOR_PROPAGATE_EXCEPTIONS'] = True
    my_app.config['EXECUTOR_MAX_WORKERS'] = 20
    # app.config['EXECUTOR_TYPE'] = 'thread' # valid options - 'thread' (default) or 'process'
    # set up user login
    cookie_domain = config.get('COOKIE_DOMAIN')
    my_app.config['SESSION_COOKIE_NAME'] = "mc_session"
    my_app.config['REMEMBER_COOKIE_NAME'] = "mc_remember_token"
    if cookie_domain != 'localhost':    # can't set cookie domain on localhost
        my_app.config['SESSION_COOKIE_DOMAIN'] = cookie_domain
        my_app.config['REMEMBER_COOKIE_DOMAIN'] = cookie_domain
    # connect to the shared session storage
    my_app.session_interface = RedisSessionInterface(redis.StrictRedis.from_url(config.get('SESSION_REDIS_URL')))

    my_app.cli.add_command(sync_frontend_db)

    return my_app


server_app = config.get('SERVER_APP')
app = create_app()
app.secret_key = config.get('SECRET_KEY')

# Create user login manager
login_manager = flask_login.LoginManager()
login_manager.init_app(app)

# connect executor pool to app, so it loads context for us automatically on each parallel process :-)
# using one shared executor pool for now - can revisit later if we need to
executor = Executor(app)

# set up all the views
@app.route('/')
def index():
    logger.debug("homepage request")
    try:
        maintenance_mode = config.get('MAINTENANCE_MODE')
    except ConfigException:
        maintenance_mode = 0
    try:
        system_warning = config.get('SYSTEM_WARNING')
        system_warning = "" if system_warning == '""' else system_warning
    except ConfigException:
        system_warning = ""

    return render_template('index.html',
                           cookie_domain=config.get('COOKIE_DOMAIN'),
                           maintenance_mode=maintenance_mode,
                           system_warning=system_warning,
                           )


# now load in the appropriate view endpoints, after the app has been initialized
import server.views.user
import server.views.app
import server.views.admin.users
import server.views.admin.analytics
import server.views.download
import server.views.stories
import server.views.media_search
import server.views.media_picker
import server.views.sources.search
import server.views.metadata
import server.views.platforms
if (server_app == SERVER_APP_SOURCES) or is_dev_mode():
    import server.views.sources.collection
    import server.views.sources.collectionedit
    import server.views.sources.source
    import server.views.sources.feeds
    import server.views.sources.suggestions
    import server.views.sources.words
    import server.views.sources.geocount
if (server_app == SERVER_APP_TOPICS) or is_dev_mode():
    import server.views.topics.media
    import server.views.topics.story
    import server.views.topics.stories
    import server.views.topics.topic
    import server.views.topics.topiclist
    import server.views.topics.topiccreate
    import server.views.topics.topicsnapshot
    import server.views.topics.words
    import server.views.topics.platforms.platforms_manage
    import server.views.topics.platforms.platforms_generic_csv
    import server.views.topics.foci.focalsets
    import server.views.topics.foci.focaldefs
    import server.views.topics.foci.retweetpartisanship
    import server.views.topics.foci.topcountries
    import server.views.topics.foci.nyttheme
    import server.views.topics.foci.mediatype
    import server.views.topics.permissions
    import server.views.topics.files
    import server.views.topics.provider
if (server_app == SERVER_APP_EXPLORER) or is_dev_mode():
    import server.views.explorer.explorer_query
    import server.views.explorer.sentences
    import server.views.explorer.words
    import server.views.explorer.story_samples
    import server.views.explorer.story_counts
    import server.views.explorer.geo
    import server.views.explorer.tags
    import server.views.explorer.saved_searches
