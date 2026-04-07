import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      mosqueName: 'جامع النور',
      selectedCountry: 'تونس',
      selectedRegion: 'نابل',
      cityId: 'beni_khalled_tn',
      customLat: '',
      customLng: '',
      offlineCache: null,
      settings: {
        language: 'ar',
        orientation: 'portrait',
        backgroundType: 'default',
        backgroundUrl: '',
        showNewsBar: false,
        newsText: 'Welcome to our Mosque. Please turn off your phones.',
        fixedDhuhr: false,
        dhuhrFixedTime: '13:00',
        dhuhrAlwaysBeforeAsr: false,
        dhuhrBeforeAsrMins: 15,
        timezoneOffset: 0,
        useCustomLocation: false,
        isFullscreenEnabled: false,
        isFirstLaunch: true,
        enableIqamaCountdown: true,
        iqamaCountdownMins: 10
      },
      adjustments: {
        fajr: 0,
        shuruq: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0
      },
      iqamaDelays: {
        fajr: '15',
        dhuhr: '10',
        asr: '10',
        maghrib: '10',
        isha: '10'
      },
      iqamaTypes: { // 'after', 'fixed', 'before'
        fajr: 'after',
        dhuhr: 'after',
        asr: 'after',
        maghrib: 'after',
        isha: 'after'
      },
      
      updateMosqueName: (name) => set({ mosqueName: name }),
      updateSelectedCountry: (country) => set({ selectedCountry: country }),
      updateSelectedRegion: (region) => set({ selectedRegion: region }),
      updateCity: (id) => set({ cityId: id }),
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      updateAdjustments: (newAdj) => set((state) => ({ adjustments: { ...state.adjustments, ...newAdj } })),
      updateIqamaDelays: (newDelays) => set((state) => ({ iqamaDelays: { ...state.iqamaDelays, ...newDelays } })),
      updateIqamaTypes: (newTypes) => set((state) => ({ iqamaTypes: { ...state.iqamaTypes, ...newTypes } })),
      updateCustomLocation: (lat, lng) => set({ customLat: lat, customLng: lng }),
      updateOfflineCache: (cache) => set({ offlineCache: cache })
    }),
    {
      name: 'mosque-storage', // name of the item in the storage (must be unique)
    }
  )
);
