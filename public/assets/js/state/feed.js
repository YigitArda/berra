const feedState = {
  threads: [],
  feedData: [],
};

export function getThreads() {
  return feedState.threads;
}

export function setThreads(threads) {
  feedState.threads = threads;
}

export function getFeedData() {
  return feedState.feedData;
}

export function setFeedData(feedData) {
  feedState.feedData = feedData;
}
