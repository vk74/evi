/**
 * version: 1.0.0
 * Frontend file state.user.account.ts
 * Purpose: Pinia store managing user account profile, settings, and session state.
 * File type: frontend state store (state.user.account.ts)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, UserSettings, SessionData } from './types.user.account'

export const useUserAccountStore = defineStore('userAccount', () => {
  // State
  const profile = ref<UserProfile>({
    last_name: '',
    first_name: '',
    middle_name: '',
    gender: '',
    mobile_phone: '',
    email: ''
  })

  const settings = ref<UserSettings>({
    workUpdates: false,
    newsletter: true
  })

  const sessionData = ref<SessionData>({
    username: '',
    jwt: '',
    isLoggedIn: false,
    userID: '',
    issuedAt: '',
    issuer: '',
    expiresAt: '',
    timeUntilExpiry: 0
  })

  // Getters
  const getProfile = computed(() => profile.value)
  const getSettings = computed(() => settings.value)
  const getSessionData = computed(() => sessionData.value)

  // Actions
  const updateProfile = (newProfile: Partial<UserProfile>) => {
    profile.value = { ...profile.value, ...newProfile }
  }

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
  }

  const updateSessionData = (newSessionData: Partial<SessionData>) => {
    sessionData.value = { ...sessionData.value, ...newSessionData }
  }

  const resetProfile = () => {
    profile.value = {
      last_name: '',
      first_name: '',
      middle_name: '',
      gender: '',
      mobile_phone: '',
      email: ''
    }
  }

  const resetSettings = () => {
    settings.value = {
      workUpdates: false,
      newsletter: true
    }
  }

  const resetSessionData = () => {
    sessionData.value = {
      username: '',
      jwt: '',
      isLoggedIn: false,
      userID: '',
      issuedAt: '',
      issuer: '',
      expiresAt: '',
      timeUntilExpiry: 0
    }
  }

  return {
    // State
    profile,
    settings,
    sessionData,
    
    // Getters
    getProfile,
    getSettings,
    getSessionData,
    
    // Actions
    updateProfile,
    updateSettings,
    updateSessionData,
    resetProfile,
    resetSettings,
    resetSessionData
  }
})
