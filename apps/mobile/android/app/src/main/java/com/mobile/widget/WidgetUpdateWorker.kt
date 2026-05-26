package com.mobile.widget

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Rotates the displayed word every 30 minutes. Doze-friendly via WorkManager.
 */
class WidgetUpdateWorker(context: Context, params: WorkerParameters) :
  CoroutineWorker(context, params) {

  override suspend fun doWork(): Result {
    WidgetState.advanceIndex(applicationContext)
    WordWidgetProvider.refreshAll(applicationContext)
    return Result.success()
  }

  companion object {
    private const val UNIQUE_NAME = "quranic_widget_rotation"

    fun schedule(context: Context) {
      val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
        .build()
      val request = PeriodicWorkRequestBuilder<WidgetUpdateWorker>(
        30,
        TimeUnit.MINUTES,
      )
        .setConstraints(constraints)
        .build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(
        UNIQUE_NAME,
        ExistingPeriodicWorkPolicy.KEEP,
        request,
      )
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_NAME)
    }
  }
}
