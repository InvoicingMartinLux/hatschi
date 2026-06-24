package com.allergyradar.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.allergyradar.app.ui.AllergyScreen
import com.allergyradar.app.ui.theme.AllergyRadarTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            AllergyRadarTheme {
                AllergyScreen()
            }
        }
    }
}
