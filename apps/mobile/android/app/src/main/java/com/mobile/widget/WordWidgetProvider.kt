package com.mobile.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.mobile.R
import org.json.JSONObject

class WordWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    appWidgetIds.forEach { id -> render(context, appWidgetManager, id) }
    // Make sure the periodic refresh worker is scheduled.
    WidgetUpdateWorker.schedule(context)
  }

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    WidgetUpdateWorker.schedule(context)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
    WidgetUpdateWorker.cancel(context)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)
    // For external broadcasts (APPWIDGET_UPDATE) the base class handles dispatch.
    // We also catch our internal explicit ACTION_REFRESH here to redraw.
    if (intent.action == ACTION_REFRESH) {
      refreshAll(context)
    }
  }

  companion object {
    const val ACTION_REFRESH = "com.mobile.widget.ACTION_REFRESH"

    fun refreshAll(context: Context) {
      val mgr = AppWidgetManager.getInstance(context)
      val ids = mgr.getAppWidgetIds(ComponentName(context, WordWidgetProvider::class.java))
      ids.forEach { id -> render(context, mgr, id) }
    }

    private fun render(context: Context, mgr: AppWidgetManager, appWidgetId: Int) {
      val views: RemoteViews = buildViews(context)
      mgr.updateAppWidget(appWidgetId, views)
    }

    private fun buildViews(context: Context): RemoteViews {
      val word = WidgetState.currentWord(context)
        ?: return RemoteViews(context.packageName, R.layout.widget_loading).also {
          it.setOnClickPendingIntent(R.id.widget_loading_root, openAppPendingIntent(context, null))
        }

      val feedback = WidgetState.feedbackState(context)
      val layout = when (feedback) {
        "correct" -> R.layout.widget_feedback_correct
        "incorrect" -> R.layout.widget_feedback_incorrect
        else -> R.layout.widget_word
      }
      val views = RemoteViews(context.packageName, layout)

      val arabic = word.optString("arabic_text", "")
      val translit = word.optString("transliteration", "")
      val meaning = word.optString("meaning", "")
      val locationLabel = locationLabel(word)
      val wordId = word.optString("word_id", "")
      val audioUrl = word.optString("audio_url", "")

      when (layout) {
        R.layout.widget_feedback_correct -> {
          views.setTextViewText(R.id.feedback_arabic, arabic)
          views.setOnClickPendingIntent(
            R.id.feedback_root,
            actionPendingIntent(context, WidgetActionReceiver.ACTION_NEXT, wordId),
          )
        }
        R.layout.widget_feedback_incorrect -> {
          views.setTextViewText(R.id.feedback_arabic, arabic)
          views.setTextViewText(R.id.feedback_correct_label, "Correct: $meaning")
          views.setOnClickPendingIntent(
            R.id.feedback_root,
            actionPendingIntent(context, WidgetActionReceiver.ACTION_NEXT, wordId),
          )
        }
        else -> {
          views.setTextViewText(R.id.widget_location, locationLabel)
          views.setTextViewText(R.id.widget_arabic, arabic)
          views.setTextViewText(R.id.widget_translit, translit)

          val options = WidgetState.currentOptions(context)
          val optionIds = intArrayOf(
            R.id.widget_option_a,
            R.id.widget_option_b,
            R.id.widget_option_c,
            R.id.widget_option_d,
          )
          val actions = arrayOf(
            WidgetActionReceiver.ACTION_ANSWER_A,
            WidgetActionReceiver.ACTION_ANSWER_B,
            WidgetActionReceiver.ACTION_ANSWER_C,
            WidgetActionReceiver.ACTION_ANSWER_D,
          )
          for (i in optionIds.indices) {
            val text = if (i < options.length()) options.optString(i, "") else ""
            views.setTextViewText(optionIds[i], text)
            views.setOnClickPendingIntent(
              optionIds[i],
              actionPendingIntent(context, actions[i], wordId, text),
            )
          }

          views.setOnClickPendingIntent(
            R.id.widget_action_audio,
            audioPendingIntent(context, audioUrl),
          )
          views.setOnClickPendingIntent(
            R.id.widget_action_next,
            actionPendingIntent(context, WidgetActionReceiver.ACTION_NEXT, wordId),
          )
          views.setOnClickPendingIntent(
            R.id.widget_action_open,
            openAppPendingIntent(context, wordId),
          )
          views.setOnClickPendingIntent(
            R.id.widget_arabic,
            openAppPendingIntent(context, wordId),
          )
        }
      }

      return views
    }

    private fun locationLabel(word: JSONObject): String {
      val ex = word.optJSONObject("example_ayah") ?: return ""
      val s = ex.optInt("surah", 0)
      val a = ex.optInt("ayah", 0)
      if (s == 0 || a == 0) return ""
      return "$s:$a"
    }

    private fun actionPendingIntent(
      context: Context,
      action: String,
      wordId: String,
      optionText: String = "",
    ): PendingIntent {
      val intent = Intent(context, WidgetActionReceiver::class.java).apply {
        this.action = action
        putExtra("word_id", wordId)
        putExtra("option_text", optionText)
      }
      val requestCode = (action + wordId + optionText).hashCode()
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      return PendingIntent.getBroadcast(context, requestCode, intent, flags)
    }

    private fun audioPendingIntent(context: Context, url: String): PendingIntent {
      val intent = Intent(context, WidgetAudioService::class.java).apply {
        putExtra("url", url)
      }
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      return PendingIntent.getService(context, url.hashCode(), intent, flags)
    }

    private fun openAppPendingIntent(context: Context, wordId: String?): PendingIntent {
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
        ?: Intent()
      launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      if (wordId != null) launch.putExtra("openWordId", wordId)
      val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      return PendingIntent.getActivity(context, "open-app".hashCode(), launch, flags)
    }
  }
}
