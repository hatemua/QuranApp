import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {Check, X} from 'lucide-react-native';
import {useRoute, useNavigation, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {Screen} from '@/components/Screen';
import {Button} from '@/components/Button';
import {LoadingState} from '@/components/LoadingState';
import {ErrorState} from '@/components/ErrorState';
import {WordCard} from '@/components/WordCard';
import {sessionsApi} from '@/api/sessions';
import {wordsApi} from '@/api/words';
import {queueAnswer} from '@/lib/db';
import {useOfflineStatus} from '@/hooks/useOfflineStatus';
import {colors} from '@/lib/colors';
import {fonts} from '@/lib/fonts';
import {useQuery} from '@tanstack/react-query';
import type {DailyWord} from '@/types';
import type {MainStackParamList} from '@/navigation/types';

type Nav = NativeStackNavigationProp<MainStackParamList, 'Session'>;
type Rt = RouteProp<MainStackParamList, 'Session'>;

type QuizType = 'multiple' | 'fill' | 'match';

function pickQuiz(seed: number): QuizType {
  const m = seed % 3;
  if (m === 0) return 'multiple';
  if (m === 1) return 'fill';
  return 'match';
}

export function SessionScreen() {
  const {t} = useTranslation();
  const nav = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const sessionId = route.params.sessionId;
  const offlineStatus = useOfflineStatus();

  const dailyQuery = useQuery({
    queryKey: ['words', 'daily'],
    queryFn: () => wordsApi.getDaily(),
  });

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answer, setAnswer] = useState<'correct' | 'incorrect' | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());

  const words = dailyQuery.data?.words ?? [];
  const currentWord: DailyWord | undefined = words[index];
  const quizType: QuizType = useMemo(() => pickQuiz(index), [index]);

  useEffect(() => {
    setStartTime(Date.now());
  }, [index]);

  const recordAnswer = useCallback(
    (correct: boolean) => {
      if (!currentWord) return;
      const responseTimeMs = Date.now() - startTime;
      setAnswer(correct ? 'correct' : 'incorrect');
      if (correct) setCorrectCount(c => c + 1);

      if (offlineStatus.isConnected) {
        void sessionsApi
          .answer(sessionId, {
            wordId: currentWord.word_id,
            correct,
            responseTimeMs,
          })
          .catch(() => {
            void queueAnswer({
              sessionId,
              wordId: currentWord.word_id,
              correct,
              responseTimeMs,
            });
          });
      } else {
        void queueAnswer({
          sessionId,
          wordId: currentWord.word_id,
          correct,
          responseTimeMs,
        });
      }
    },
    [currentWord, sessionId, startTime, offlineStatus.isConnected],
  );

  const advance = useCallback(async () => {
    if (index < words.length - 1) {
      setIndex(i => i + 1);
      setRevealed(false);
      setAnswer(null);
      return;
    }
    try {
      const result = await sessionsApi.complete(sessionId);
      nav.replace('SessionSummary', {result});
    } catch {
      nav.replace('SessionSummary', {
        result: {
          wordsLearned: correctCount,
          accuracy: correctCount / Math.max(1, words.length),
          newMasteries: [],
        },
      });
    }
  }, [index, words.length, sessionId, nav, correctCount]);

  if (dailyQuery.isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }
  if (dailyQuery.error || !currentWord) {
    return (
      <Screen>
        <ErrorState
          onRetry={() => void dailyQuery.refetch()}
          message={(dailyQuery.error as Error | null)?.message}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <ProgressDots total={words.length} current={index} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close session"
          onPress={() => nav.popToTop()}
          style={({pressed}) => [styles.closeBtn, pressed && styles.closeBtnPressed]}>
          <X size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={styles.cardWrap}>
        <WordCard
          word={currentWord}
          variant="session"
          revealed={revealed}
          onReveal={() => setRevealed(true)}
        />
      </View>

      {revealed && answer === null ? (
        <Quiz
          word={currentWord}
          allWords={words}
          quizType={quizType}
          onAnswer={recordAnswer}
        />
      ) : null}

      {answer ? <Feedback answer={answer} correctMeaning={currentWord.meaning} /> : null}

      <View style={styles.footer}>
        {answer ? (
          <Button
            label={
              index === words.length - 1 ? t('session.complete') : t('session.nextWord')
            }
            onPress={() => void advance()}
          />
        ) : (
          <Button
            label={
              index === words.length - 1 ? t('session.complete') : t('session.nextWord')
            }
            variant="secondary"
            onPress={() => void advance()}
          />
        )}
      </View>
    </Screen>
  );
}

function ProgressDots({total, current}: {total: number; current: number}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({length: total}).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && styles.dotDone,
            i === current && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

interface QuizProps {
  word: DailyWord;
  allWords: DailyWord[];
  quizType: QuizType;
  onAnswer: (correct: boolean) => void;
}

function Quiz({word, allWords, quizType, onAnswer}: QuizProps) {
  const {t} = useTranslation();
  const distractors = word.distractor_meanings.slice(0, 3);
  const choices = useMemo(() => {
    const all = [word.meaning, ...distractors];
    return shuffle(all);
  }, [word.meaning, distractors]);

  if (quizType === 'multiple') {
    return (
      <View style={styles.quizBlock}>
        <Text style={styles.quizPrompt}>
          {t('session.whatDoesItMean', {word: word.arabic_text})}
        </Text>
        {choices.map(choice => (
          <Pressable
            key={choice}
            onPress={() => onAnswer(choice === word.meaning)}
            style={({pressed}) => [styles.choice, pressed && styles.choicePressed]}>
            <Text style={styles.choiceText}>{choice}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (quizType === 'fill') {
    const text = word.example_ayah.text_arabic;
    const segments = text.split(/\s+/);
    return (
      <View style={styles.quizBlock}>
        <Text style={styles.quizPrompt}>{t('session.fillBlank')}</Text>
        <View style={styles.arabicRow}>
          {segments.map((seg, idx) => {
            const isBlank = idx + 1 === word.example_ayah.highlighted_word_position;
            return (
              <Text
                key={`${seg}-${idx}`}
                style={[styles.arabicMedium, isBlank && styles.blank]}>
                {isBlank ? '_____' : seg}{' '}
              </Text>
            );
          })}
        </View>
        {[word.arabic_text, ...(allWords.filter(w => w.word_id !== word.word_id).slice(0, 3).map(w => w.arabic_text))].length > 0 ? (
          <View style={styles.fillOptions}>
            {shuffle([
              word.arabic_text,
              ...allWords
                .filter(w => w.word_id !== word.word_id)
                .slice(0, 3)
                .map(w => w.arabic_text),
            ]).map(opt => (
              <Pressable
                key={opt}
                onPress={() => onAnswer(opt === word.arabic_text)}
                style={({pressed}) => [styles.fillChoice, pressed && styles.choicePressed]}>
                <Text style={styles.fillChoiceText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return <MatchingQuiz word={word} allWords={allWords} onAnswer={onAnswer} />;
}

function MatchingQuiz({
  word,
  allWords,
  onAnswer,
}: {
  word: DailyWord;
  allWords: DailyWord[];
  onAnswer: (correct: boolean) => void;
}) {
  const {t} = useTranslation();
  const others = allWords.filter(w => w.word_id !== word.word_id).slice(0, 2);
  const triplet = [word, ...others];
  const arabicCol = triplet;
  const meaningCol = useMemo(() => shuffle(triplet.map(w => w.meaning)), []);
  const [selectedArabic, setSelectedArabic] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (Object.keys(pairs).length === triplet.length) {
      const allCorrect = triplet.every(w => pairs[w.word_id] === w.meaning);
      onAnswer(allCorrect && !errored);
    }
  }, [pairs, onAnswer, triplet, errored]);

  const tryMatch = (wordId: string, meaning: string): void => {
    const correctMeaning = triplet.find(w => w.word_id === wordId)?.meaning;
    if (correctMeaning === meaning) {
      setPairs(p => ({...p, [wordId]: meaning}));
      setSelectedArabic(null);
    } else {
      setErrored(true);
      setSelectedArabic(null);
    }
  };

  return (
    <View style={styles.quizBlock}>
      <Text style={styles.quizPrompt}>{t('session.matchPairs')}</Text>
      <View style={styles.matchTable}>
        <View style={styles.matchCol}>
          {arabicCol.map(w => {
            const matched = pairs[w.word_id] !== undefined;
            const selected = selectedArabic === w.word_id;
            return (
              <Pressable
                key={w.word_id}
                disabled={matched}
                onPress={() => setSelectedArabic(w.word_id)}
                style={[
                  styles.matchCell,
                  matched && styles.matchCellDone,
                  selected && styles.matchCellSelected,
                ]}>
                <Text style={styles.matchArabic}>{w.arabic_text}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.matchCol}>
          {meaningCol.map(m => {
            const matched = Object.values(pairs).includes(m);
            return (
              <Pressable
                key={m}
                disabled={matched || !selectedArabic}
                onPress={() => selectedArabic && tryMatch(selectedArabic, m)}
                style={[styles.matchCell, matched && styles.matchCellDone]}>
                <Text style={styles.matchMeaning}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function Feedback({
  answer,
  correctMeaning,
}: {
  answer: 'correct' | 'incorrect';
  correctMeaning: string;
}) {
  const {t} = useTranslation();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, {duration: 200});
    opacity.value = withTiming(1, {duration: 200});
  }, [scale, opacity, answer]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  if (answer === 'correct') {
    return (
      <Animated.View style={[styles.feedback, animStyle]}>
        <View style={styles.checkBubble}>
          <Check size={20} color={'#FFFFFF'} />
        </View>
        <Text style={styles.feedbackArabic}>{t('session.wellDone')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.feedbackIncorrect, animStyle]}>
      <Text style={styles.feedbackIncorrectText}>
        {t('session.correctAnswer', {meaning: correctMeaning})}
      </Text>
    </Animated.View>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnPressed: {opacity: 0.7},
  footer: {marginTop: 'auto', paddingTop: 12},
  dotsRow: {flexDirection: 'row', gap: 6, alignSelf: 'center'},
  dot: {width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border},
  dotDone: {backgroundColor: colors.primary},
  dotActive: {backgroundColor: colors.primaryMuted, borderWidth: 2, borderColor: colors.primary},
  cardWrap: {marginBottom: 16},
  quizBlock: {gap: 10, marginTop: 8},
  quizPrompt: {fontFamily: fonts.latinSemibold, fontSize: 16, color: colors.text},
  choice: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  choicePressed: {backgroundColor: colors.primaryMuted},
  choiceText: {fontFamily: fonts.latin, fontSize: 15, color: colors.text},
  arabicRow: {flexDirection: 'row-reverse', flexWrap: 'wrap'},
  arabicMedium: {
    fontFamily: fonts.arabic,
    fontSize: 22,
    color: colors.text,
    lineHeight: 40,
    writingDirection: 'rtl',
  },
  blank: {color: colors.textFaint, fontFamily: fonts.latin},
  fillOptions: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  fillChoice: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fillChoiceText: {
    fontFamily: fonts.arabic,
    fontSize: 22,
    color: colors.text,
    writingDirection: 'rtl',
  },
  matchTable: {flexDirection: 'row', gap: 12},
  matchCol: {flex: 1, gap: 8},
  matchCell: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  matchCellSelected: {borderColor: colors.primary, backgroundColor: colors.primaryMuted},
  matchCellDone: {opacity: 0.5},
  matchArabic: {
    fontFamily: fonts.arabicBold,
    fontSize: 24,
    color: colors.text,
    writingDirection: 'rtl',
  },
  matchMeaning: {fontFamily: fonts.latin, fontSize: 14, color: colors.text, textAlign: 'center'},
  feedback: {alignItems: 'center', gap: 8, marginTop: 16},
  checkBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackArabic: {fontFamily: fonts.arabicBold, fontSize: 28, color: colors.primary},
  feedbackIncorrect: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  feedbackIncorrectText: {fontFamily: fonts.latin, fontSize: 14, color: colors.text},
});
