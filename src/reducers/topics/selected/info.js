import { resolve } from 'redux-simple-promise';
import { FETCH_TOPIC_SUMMARY, UPDATE_TOPIC_SEED_QUERY, UPDATE_TOPIC_SETTINGS, SET_TOPIC_FAVORITE,
  TOPIC_START_SPIDER, TOPIC_GENERATE_SNAPSHOT, TOPIC_CREATE_SNAPSHOT } from '../../../actions/topicActions';
import { createAsyncReducer } from '../../../lib/reduxHelpers';
import { snapshotIsUsable, latestSnapshotByDate, TOPIC_SNAPSHOT_STATE_COMPLETED, TOPIC_SNAPSHOT_STATE_RUNNING } from './snapshots';

const addVersionNumberToJobs = (snapshots, jobStates) => {
  let newJobStates;
  if (snapshots) {
    newJobStates = jobStates.map((j) => {
      const associatedSnapshot = snapshots.find(s => s.snapshots_id === j.snapshots_id);
      const versionNumber = associatedSnapshot ? associatedSnapshot.note : null;
      return { ...j, versionNumber };
    });
  } else {
    newJobStates = jobStates;
  }
  return newJobStates;
};

function checkForAnyPlatformChanges(currentPlatforms, newPlatforms) {
  // if different amount of platforms
  const differentAmount = currentPlatforms.length !== newPlatforms.length;
  if (differentAmount) {
    return true;
  }
  // new platform doesn't exist in current
  const newOneThere = newPlatforms.filter(newPlatform => currentPlatforms.filter(
    currentPlatform => (currentPlatform.platform === newPlatform.platform) && (currentPlatform.source === newPlatform.source)
  ).length === 0).length > 0;
  if (newOneThere) {
    return true;
  }
  // current platform doesn't exist in new
  const oldOneGone = currentPlatforms.filter(currentPlatform => newPlatforms.filter(
    newPlatform => (currentPlatform.platform === newPlatform.platform) && (currentPlatform.source === newPlatform.source)
  ).length === 0).length > 0;
  if (oldOneGone) {
    return true;
  }
  // queries different in any of same platforms?
  const oldOnesInNew = currentPlatforms.filter(currentPlatform => newPlatforms.filter(newPlatform => (currentPlatform.platform === newPlatform.platform) && (currentPlatform.source === newPlatform.source)));
  const numberOfQueriesThatChanged = oldOnesInNew.map(currentPlatform => {
    const matchingNewPlatform = newPlatforms.filter(newPlatform => (currentPlatform.platform === newPlatform.platform) && (currentPlatform.source === newPlatform.source))[0];
    return (currentPlatform.query !== matchingNewPlatform.query) ? 1 : 0;
  }).reduce((a, b) => a + b, 0) > 0;
  if (numberOfQueriesThatChanged > 0) {
    return true;
  }
  return false;
}

// this is important to handle the fact that some older topics don't have any snapshots but do have jobs
export const addLatestStateToTopic = (t) => {
  // 1. figure out latest state and jobs associated with the topic
  let latestState; // this acts as a psuedo-snapshot
  // if no jobs, use original topic state
  if (!t.job_states || t.job_states.length === 0) {
    latestState = {
      state: t.state,
      message: null,
      job_states_id: null,
    };
  } else {
    // if jobs, determine the latest
    const mostRecentJobState = t.job_states[0];
    // handle case where job is done but still importing
    const associatedSnapshot = t.snapshots ? t.snapshots.list.find(s => s.snapshots_id === mostRecentJobState.snapshots_id) : null;
    let stateToUse;
    if (associatedSnapshot && (associatedSnapshot.state === TOPIC_SNAPSHOT_STATE_COMPLETED)) {
      stateToUse = snapshotIsUsable(associatedSnapshot) ? TOPIC_SNAPSHOT_STATE_COMPLETED : TOPIC_SNAPSHOT_STATE_RUNNING;
    } else {
      stateToUse = mostRecentJobState.state;
    }
    latestState = {
      state: stateToUse,
      message: mostRecentJobState.message,
      job_states_id: mostRecentJobState.job_states_id,
    };
  }
  // 2. figure out if there are any new platforms
  const platformsHaveChanged = checkForAnyPlatformChanges(t.topic_seed_queries, (t.snapshots) ? latestSnapshotByDate(t.snapshots.list).platform_seed_queries : []);
  // return augmented state
  return {
    ...t,
    latestState,
    platformsHaveChanged,
    job_states: t.snapshots ? addVersionNumberToJobs(t.snapshots.list, t.job_states) : [],
  };
};

const info = createAsyncReducer({
  action: FETCH_TOPIC_SUMMARY,
  handleSuccess: payload => ({ ...addLatestStateToTopic(payload) }),
  // whenever we change somethign we return whole topic from the server and need update all this stuff
  [resolve(UPDATE_TOPIC_SEED_QUERY)]: payload => ({ ...addLatestStateToTopic(payload) }),
  [resolve(UPDATE_TOPIC_SETTINGS)]: payload => ({ ...addLatestStateToTopic(payload) }),
  [resolve(TOPIC_START_SPIDER)]: payload => ({ ...addLatestStateToTopic(payload) }),
  [resolve(TOPIC_GENERATE_SNAPSHOT)]: payload => ({ ...addLatestStateToTopic(payload) }),
  [resolve(TOPIC_CREATE_SNAPSHOT)]: payload => ({ ...addLatestStateToTopic(payload) }),
  [resolve(SET_TOPIC_FAVORITE)]: payload => ({ ...addLatestStateToTopic(payload) }),
});

export default info;
