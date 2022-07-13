import datetime
import logging
import flask_login
import mediacloud.api
from flask import session

from server import user_db, login_manager, MEDIA_CLOUD_API_TIMEOUT
from server.util.config import get_default_config, ConfigException

logger = logging.getLogger(__name__)

ROLE_ADMIN = 'admin'                        # Do everything, including editing users
ROLE_ADMIN_READ_ONLY = 'admin-readonly'     # Read access to admin interface
ROLE_MEDIA_EDIT = 'media-edit'              # Add / edit media; includes feeds
ROLE_STORY_EDIT = 'story-edit'              # Add / edit stories
ROLE_TM = 'tm'                              # Topic mapper; includes media and story editing
ROLE_STORIES_API = 'stories-api'            # Access to the stories api
ROLE_SEARCH = 'search'                      # Access to the /search pages
ROLE_TM_READ_ONLY = 'tm-readonly'           # Topic mapper; excludes media and story editing

# load the config helper
config = get_default_config()


# User class
class User(flask_login.UserMixin):

    def __init__(self, profile):
        self.profile = profile
        self.name = profile['email']
        self.id = profile['api_key']
        self.active = profile['active']
        self.created = datetime.datetime.now()

    @property
    def is_active(self):
        return self.active

    @property
    def is_anonymous(self):
        return False

    @property
    def is_authenticated(self):
        return True

    def has_auth_role(self, role):
        my_roles = self.profile['auth_roles']
        return (ROLE_ADMIN in my_roles) or (role in my_roles)

    def create_in_db_if_needed(self):
        if self.exists_in_db():
            # if they are in the front-end db, then be sure to update their profile at each login
            logger.debug("user %s already in db", self.name)
            self.update_profile(self.profile)
            return
        logger.debug("user %s created in db", self.name)
        user_db.add_user(self.name, self.profile['api_key'], self.profile)

    def update_profile(self, profile):
        user_db.update_user(self.name, {'api_key': profile['api_key'], 'profile': profile})

    def exists_in_db(self):
        # is this user in the front-end database?
        return user_db.includes_user_named(self.name)

    def get_properties(self):
        return {
            'email': self.name,
            'key': self.profile['api_key'],
            'profile': self.profile
        }

    @classmethod
    def get(cls, userid):
        """
        :param userid: This is the user's API key
        :return: the User object, or null if they aren't authorized
        """
        try:
            # check if the session still exists and is valid (in our shared redis cache)
            # _id seems to only be set if the sessions exists in Redis
            if ('_id' in session) and (session['_user_id'] == userid):
                # so we don't have to refetch their profile on every request
                user_in_db = user_db.find_by_api_key(userid)
                return User(user_in_db['profile'])
            else:
                # the session isn't valid (perhaps we flushed the redis cache?
                return None
        except Exception:
            # be safer here... if anything goes wrong make them login again
            return None


@login_manager.user_loader
def load_user(userid):
    # Flask-login uses this method to lookup users to see if they are logged in already
    logger.debug("trying to load_user %s", userid)
    return User.get(userid)


def is_user_logged_in():
    if flask_login.current_user is None:
        return False
    return flask_login.current_user.is_authenticated


def login_user(user):
    flask_login.login_user(user, remember=True)
    user.create_in_db_if_needed()
    logger.debug("  login succeeded")


def user_has_auth_role(role):
    return flask_login.current_user.has_auth_role(role)


def user_is_admin():
    return user_has_auth_role('admin')


def create_user(profile):
    user = User(profile)
    user.create_in_db_if_needed()
    logger.debug("  added to user cache %s", user.id)
    return user


def load_from_db_by_username(username):
    return user_db.find_by_username(username)


def user_name():
    return flask_login.current_user.name


def user_mediacloud_key():
    # Return the IP-restricted API token for this user from the cookie (note: this is the server IP)
    return flask_login.current_user.profile['api_key']


def user_admin_mediacloud_client(user_mc_key=None):
    # Return a mediacloud admin client for the logged in user.  Passing in a key lets you ovveride reading it out
    # of the request object (which you might not have access to)
    mc_key_to_use = user_mc_key
    if mc_key_to_use is None:
        mc_key_to_use = user_mediacloud_key()
    user_mc = mediacloud.api.AdminMediaCloud(mc_key_to_use)
    user_mc.TIMEOUT_SECS = MEDIA_CLOUD_API_TIMEOUT
    try:
        user_mc.V2_API_URL = config.get('MEDIA_CLOUD_API_URL')
    except ConfigException:
        pass  # just use the default API url because a custom one is not defined
    return user_mc


def user_mediacloud_client(user_mc_key=None):
    # Return a mediacloud client for the logged in user.  Passing in a key lets you ovveride reading it out
    # of the request object (which you might not have access to)
    mc_key_to_use = user_mc_key
    if mc_key_to_use is None:
        mc_key_to_use = user_mediacloud_key()
    user_mc = mediacloud.api.MediaCloud(mc_key_to_use)
    user_mc.TIMEOUT_SECS = MEDIA_CLOUD_API_TIMEOUT
    try:
        user_mc.V2_API_URL = config.get('MEDIA_CLOUD_API_URL')
    except ConfigException:
        pass  # just use the default API url because a custom one is not defined
    return user_mc
