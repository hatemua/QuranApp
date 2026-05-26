package com.mobile.widget

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import org.json.JSONArray
import org.json.JSONObject

/**
 * Bridge between JS and the home-screen widget. JS calls these methods to push
 * daily words to the widget and to drain queued answers when the app reopens.
 */
class WidgetDataModule(private val context: ReactApplicationContext) :
  ReactContextBaseJavaModule(context) {

  override fun getName(): String = "QuranicWidget"

  @ReactMethod
  fun pushDailyWords(words: ReadableArray, promise: Promise) {
    try {
      val arr = JSONArray()
      for (i in 0 until words.size()) {
        val map = words.getMap(i) ?: continue
        arr.put(toJson(map))
      }
      WidgetState.saveWords(context, arr)
      WordWidgetProvider.refreshAll(context)
      WidgetUpdateWorker.schedule(context)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("WIDGET_PUSH_FAILED", e)
    }
  }

  @ReactMethod
  fun clearWords(promise: Promise) {
    try {
      WidgetState.clearAll(context)
      WordWidgetProvider.refreshAll(context)
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("WIDGET_CLEAR_FAILED", e)
    }
  }

  @ReactMethod
  fun flushQueuedAnswers(promise: Promise) {
    try {
      val drained = WidgetState.drainQueuedAnswers(context)
      val out: WritableArray = Arguments.createArray()
      for (i in 0 until drained.length()) {
        val obj = drained.optJSONObject(i) ?: continue
        val map = Arguments.createMap()
        map.putString("wordId", obj.optString("word_id"))
        map.putBoolean("correct", obj.optBoolean("correct"))
        map.putDouble("ts", obj.optLong("ts").toDouble())
        out.pushMap(map)
      }
      promise.resolve(out)
    } catch (e: Exception) {
      promise.reject("WIDGET_FLUSH_FAILED", e)
    }
  }

  private fun toJson(map: ReadableMap): JSONObject {
    val out = JSONObject()
    val iter = map.keySetIterator()
    while (iter.hasNextKey()) {
      val key = iter.nextKey()
      when (map.getType(key)) {
        ReadableType.Null -> out.put(key, JSONObject.NULL)
        ReadableType.Boolean -> out.put(key, map.getBoolean(key))
        ReadableType.Number -> out.put(key, map.getDouble(key))
        ReadableType.String -> out.put(key, map.getString(key))
        ReadableType.Array -> {
          val inner = map.getArray(key) ?: continue
          val arr = JSONArray()
          for (i in 0 until inner.size()) {
            when (inner.getType(i)) {
              ReadableType.String -> arr.put(inner.getString(i))
              ReadableType.Boolean -> arr.put(inner.getBoolean(i))
              ReadableType.Number -> arr.put(inner.getDouble(i))
              ReadableType.Map -> arr.put(toJson(inner.getMap(i)))
              else -> {}
            }
          }
          out.put(key, arr)
        }
        ReadableType.Map -> {
          val inner = map.getMap(key) ?: continue
          out.put(key, toJson(inner))
        }
      }
    }
    return out
  }
}
