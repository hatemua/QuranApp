package com.mobile.widget

import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.IBinder
import android.util.Log

/**
 * Plays a single MP3 URL fire-and-forget. Tears itself down when playback completes
 * or an error occurs.
 */
class WidgetAudioService : Service() {

  private var player: MediaPlayer? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val url = intent?.getStringExtra("url")
    if (url.isNullOrEmpty()) {
      stopSelf(startId)
      return START_NOT_STICKY
    }

    // Stop any previous playback (e.g., rapid tap).
    try { player?.stop(); player?.release() } catch (_: Exception) {}
    player = null

    val mp = MediaPlayer().apply {
      setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build(),
      )
      setOnPreparedListener { it.start() }
      setOnCompletionListener {
        try { it.release() } catch (_: Exception) {}
        player = null
        stopSelf(startId)
      }
      setOnErrorListener { p, what, extra ->
        Log.w(TAG, "MediaPlayer error what=$what extra=$extra")
        try { p.release() } catch (_: Exception) {}
        player = null
        stopSelf(startId)
        true
      }
    }
    player = mp
    try {
      mp.setDataSource(applicationContext, Uri.parse(url))
      mp.prepareAsync()
    } catch (e: Exception) {
      Log.w(TAG, "Failed to start audio: ${e.message}")
      try { mp.release() } catch (_: Exception) {}
      player = null
      stopSelf(startId)
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    try { player?.stop(); player?.release() } catch (_: Exception) {}
    player = null
    super.onDestroy()
  }

  companion object {
    private const val TAG = "WidgetAudioService"
  }
}
