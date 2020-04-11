import { createAsyncAction } from '../../lib/reduxHelpers';
import * as api from '../../lib/serverApi/topicProvider';

export const FETCH_TOPIC_PROVIDER_WORDS = 'FETCH_TOPIC_PROVIDER_WORDS';
export const fetchTopicProviderWords = createAsyncAction(FETCH_TOPIC_PROVIDER_WORDS, api.topicProviderWords);

export const FETCH_TOPIC_PROVIDER_STORIES = 'FETCH_TOPIC_PROVIDER_STORY_LIST';
export const fetchTopicProviderStories = createAsyncAction(FETCH_TOPIC_PROVIDER_STORIES, api.topicProviderStories);
