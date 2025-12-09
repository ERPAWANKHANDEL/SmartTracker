package com.smarttracker

import android.Manifest
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "SmsModule"
    }

    @ReactMethod
    fun getAllSms(promise: Promise) {
        if (!hasReadSmsPermission()) {
            promise.reject("PERMISSION_DENIED", "SMS read permission not granted")
            return
        }

        try {
            val smsList = Arguments.createArray()
            val uri = Uri.parse("content://sms/inbox")
            val projection = arrayOf("_id", "address", "body", "date", "type")
            
            // Get SMS from last 30 days
            val thirtyDaysAgo = System.currentTimeMillis() - (30 * 24 * 60 * 60 * 1000L)
            val selection = "date >= ?"
            val selectionArgs = arrayOf(thirtyDaysAgo.toString())
            val sortOrder = "date DESC LIMIT 1000"

            val cursor: Cursor? = reactApplicationContext.contentResolver.query(
                uri,
                projection,
                selection,
                selectionArgs,
                sortOrder
            )

            cursor?.use {
                val addressIndex = it.getColumnIndex("address")
                val bodyIndex = it.getColumnIndex("body")
                val dateIndex = it.getColumnIndex("date")
                val typeIndex = it.getColumnIndex("type")

                while (it.moveToNext()) {
                    val smsMap = Arguments.createMap()
                    smsMap.putString("address", it.getString(addressIndex))
                    smsMap.putString("body", it.getString(bodyIndex))
                    smsMap.putString("date", it.getString(dateIndex))
                    smsMap.putInt("type", it.getInt(typeIndex))
                    smsList.pushMap(smsMap)
                }
            }

            promise.resolve(smsList)
        } catch (e: Exception) {
            promise.reject("READ_SMS_ERROR", "Failed to read SMS: ${e.message}", e)
        }
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        promise.resolve(hasReadSmsPermission())
    }

    private fun hasReadSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            reactApplicationContext,
            Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
