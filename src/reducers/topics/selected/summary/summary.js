import { combineReducers } from 'redux';
import topStories from './topStories';
import topMedia from './topMedia';
import topWords from './topWords';
import sentenceCount from './sentenceCount';
import storyTotals from './storyTotals';

const summaryReducer = combineReducers({
  topStories,
  topMedia,
  topWords,
  sentenceCount,
  storyTotals,
});

export default summaryReducer;
