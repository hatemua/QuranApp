package com.mobile.widget

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Persisted widget state in app-private SharedPreferences.
 *
 * Keys:
 *   - daily_words      : JSONArray of words pushed from JS
 *   - current_index    : Int  — which word in daily_words is currently displayed
 *   - shuffled_options : JSONArray of length 4 — the displayed multiple-choice ordering
 *   - feedback_state   : "idle" | "correct" | "incorrect"
 *   - queued_answers   : JSONArray of {word_id, correct, ts} synced when app opens
 */
object WidgetState {
  const val PREFS_NAME = "widget_state"
  const val KEY_WORDS = "daily_words"
  const val KEY_INDEX = "current_index"
  const val KEY_OPTIONS = "shuffled_options"
  const val KEY_FEEDBACK = "feedback_state"
  const val KEY_QUEUED = "queued_answers"

  fun prefs(context: Context): SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun loadWords(context: Context): JSONArray {
    val raw = prefs(context).getString(KEY_WORDS, null) ?: return JSONArray()
    return try { JSONArray(raw) } catch (e: Exception) { JSONArray() }
  }

  fun saveWords(context: Context, words: JSONArray) {
    prefs(context).edit()
      .putString(KEY_WORDS, words.toString())
      .putInt(KEY_INDEX, 0)
      .putString(KEY_FEEDBACK, "idle")
      .remove(KEY_OPTIONS)
      .apply()
  }

  fun clearAll(context: Context) {
    prefs(context).edit().clear().apply()
  }

  fun currentIndex(context: Context): Int = prefs(context).getInt(KEY_INDEX, 0)

  fun advanceIndex(context: Context) {
    val total = loadWords(context).length()
    if (total <= 0) return
    val next = (currentIndex(context) + 1) % total
    prefs(context).edit()
      .putInt(KEY_INDEX, next)
      .putString(KEY_FEEDBACK, "idle")
      .remove(KEY_OPTIONS)
      .apply()
  }

  fun currentWord(context: Context): JSONObject? {
    val words = loadWords(context)
    if (words.length() == 0) return null
    val idx = currentIndex(context).coerceIn(0, words.length() - 1)
    return words.optJSONObject(idx)
  }

  fun feedbackState(context: Context): String =
    prefs(context).getString(KEY_FEEDBACK, "idle") ?: "idle"

  fun setFeedback(context: Context, state: String) {
    prefs(context).edit().putString(KEY_FEEDBACK, state).apply()
  }

  /**
   * Returns the 4 displayed options for the current word, shuffling and persisting
   * on first call so the same set is shown across refreshes until the word advances.
   */
  fun currentOptions(context: Context): JSONArray {
    val cached = prefs(context).getString(KEY_OPTIONS, null)
    if (cached != null) {
      try { return JSONArray(cached) } catch (_: Exception) {}
    }
    val word = currentWord(context) ?: return JSONArray()
    val correct = word.optString("meaning", "")
    val distractors = word.optJSONArray("distractor_meanings") ?: JSONArray()
    val options = mutableListOf(correct)
    for (i in 0 until distractors.length()) options.add(distractors.optString(i))
    while (options.size < 4) options.add("")
    options.shuffle()
    val arr = JSONArray()
    options.take(4).forEach { arr.put(it) }
    prefs(context).edit().putString(KEY_OPTIONS, arr.toString()).apply()
    return arr
  }

  fun queueAnswer(context: Context, wordId: String, correct: Boolean) {
    val queued = prefs(context).getString(KEY_QUEUED, "[]") ?: "[]"
    val arr = try { JSONArray(queued) } catch (_: Exception) { JSONArray() }
    val item = JSONObject()
      .put("word_id", wordId)
      .put("correct", correct)
      .put("ts", System.currentTimeMillis())
    arr.put(item)
    prefs(context).edit().putString(KEY_QUEUED, arr.toString()).apply()
  }

  fun drainQueuedAnswers(context: Context): JSONArray {
    val queued = prefs(context).getString(KEY_QUEUED, "[]") ?: "[]"
    val arr = try { JSONArray(queued) } catch (_: Exception) { JSONArray() }
    prefs(context).edit().remove(KEY_QUEUED).apply()
    return arr
  }
}
