import type {SessionCompleteResponse} from '@/types';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Read: undefined;
  Today: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  WordDetail: {wordId: string};
  Session: {sessionId: string};
  SessionSummary: {result: SessionCompleteResponse};
};
