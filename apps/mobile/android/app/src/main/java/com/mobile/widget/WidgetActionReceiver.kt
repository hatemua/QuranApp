package com.mobile.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.SystemClock

class WidgetActionReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    val wordId = intent.getStringExtra("word_id") ?: ""
    val optionText = intent.getStringExtra("option_text") ?: ""

    when (action) {
      ACTION_NEXT -> {
        WidgetState.advanceIndex(context)
        WordWidgetProvider.refreshAll(context)
      }
      ACTION_ANSWER_A, ACTION_ANSWER_B, ACTION_ANSWER_C, ACTION_ANSWER_D -> {
        handleAnswer(context, wordId, optionText)
      }
    }
  }

  private fun handleAnswer(context: Context, wordId: String, optionText: String) {
    val word = WidgetState.currentWord(context) ?: return
    val correctMeaning = word.optString("meaning", "")
    val isCorrect = optionText.isNotEmpty() && optionText == correctMeaning

    WidgetState.queueAnswer(context, wordId, isCorrect)
    WidgetState.setFeedback(context, if (isCorrect) "correct" else "incorrect")
    WordWidgetProvider.refreshAll(context)

    // Schedule auto-advance after feedback dwell.
    scheduleAutoAdvance(context, if (isCorrect) FEEDBACK_DWELL_CORRECT_MS else FEEDBACK_DWELL_INCORRECT_MS)
  }

  private fun scheduleAutoAdvance(context: Context, delayMs: Long) {
    val intent = Intent(context, WidgetActionReceiver::class.java).apply {
      action = ACTION_NEXT
    }
    val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val pending = PendingIntent.getBroadcast(context, "advance".hashCode(), intent, flags)
    val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    am.set(
      AlarmManager.ELAPSED_REALTIME,
      SystemClock.elapsedRealtime() + delayMs,
      pending,
    )
  }

  companion object {
    const val ACTION_NEXT = "com.mobile.widget.ACTION_NEXT"
    const val ACTION_ANSWER_A = "com.mobile.widget.ACTION_ANSWER_A"
    const val ACTION_ANSWER_B = "com.mobile.widget.ACTION_ANSWER_B"
    const val ACTION_ANSWER_C = "com.mobile.widget.ACTION_ANSWER_C"
    const val ACTION_ANSWER_D = "com.mobile.widget.ACTION_ANSWER_D"

    private const val FEEDBACK_DWELL_CORRECT_MS = 1200L
    private const val FEEDBACK_DWELL_INCORRECT_MS = 2200L
  }
}
