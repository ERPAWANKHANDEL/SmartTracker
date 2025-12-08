package com.smarttracker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.provider.Telephony
import android.telephony.SmsMessage
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SmsReceiverModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var smsReceiver: BroadcastReceiver? = null
    private var isListening = false

    override fun getName(): String {
        return "SmsReceiverModule"
    }

    @ReactMethod
    fun startListening(promise: Promise) {
        if (isListening) {
            promise.resolve(true)
            return
        }

        try {
            smsReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    if (intent?.action == Telephony.Sms.Intents.SMS_RECEIVED_ACTION) {
                        val bundle = intent.extras
                        if (bundle != null) {
                            val pdus = bundle.get("pdus") as Array<*>
                            val messages = arrayOfNulls<SmsMessage>(pdus.size)
                            
                            for (i in pdus.indices) {
                                messages[i] = SmsMessage.createFromPdu(pdus[i] as ByteArray)
                            }
                            
                            for (message in messages) {
                                message?.let {
                                    val smsMap = Arguments.createMap()
                                    smsMap.putString("address", it.originatingAddress)
                                    smsMap.putString("body", it.messageBody)
                                    smsMap.putDouble("date", it.timestampMillis.toDouble())
                                    sendEvent("onSmsReceived", smsMap)
                                }
                            }
                        }
                    }
                }
            }

            val filter = IntentFilter(Telephony.Sms.Intents.SMS_RECEIVED_ACTION)
            reactApplicationContext.registerReceiver(smsReceiver, filter)
            isListening = true
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_LISTENER_ERROR", "Failed to start SMS listener: ${e.message}", e)
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        try {
            smsReceiver?.let {
                reactApplicationContext.unregisterReceiver(it)
                smsReceiver = null
                isListening = false
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_LISTENER_ERROR", "Failed to stop SMS listener: ${e.message}", e)
        }
    }

    @ReactMethod
    fun isListening(promise: Promise) {
        promise.resolve(isListening)
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        smsReceiver?.let {
            try {
                reactApplicationContext.unregisterReceiver(it)
            } catch (e: Exception) {
                // Receiver already unregistered
            }
        }
    }
}
