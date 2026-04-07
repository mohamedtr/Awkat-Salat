import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from './store';
import citiesData from './constants/cities.json';
import ahadithData from './constants/ahadith.json';
import { calculatePrayerTimes, calculateIqama, getNextPrayer, getClosestCity } from './utils';
import { format, differenceInSeconds } from 'date-fns';
import { ar, fr, enUS } from 'date-fns/locale';
import { Settings, X, ImagePlus, Globe, Volume2, MapPin, Monitor, BellOff, Clock } from 'lucide-react';
import './index.css';

// --- Pure Helpers (Outside to avoid TDZ and recreation) ---

const renderTimes = (athan, type, delay, nextAthan) => {
  let result = athan;
  if (type === 'fixed') result = calculateIqama(athan, delay);
  else if (type === 'before' && nextAthan) result = new Date(nextAthan.getTime() - (parseInt(delay) || 0) * 60000);
  else result = calculateIqama(athan, delay);
  
  return { timeObj: athan, athanFormat: format(athan, 'HH:mm'), iqamaFormat: format(result, 'HH:mm') };
};

const formatRemaining = (diff) => {
  const h = Math.floor(diff / 3600).toString().padStart(2, '0');
  const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
  const s = (diff % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// --- Sub-Components ---

const SettingsModal = ({ close, cities, store }) => {
  const { t, i18n } = useTranslation();
  const [localState, setLocalState] = useState({ ...store.settings });
  const [localAdj, setLocalAdj] = useState({ ...store.adjustments });
  const [localIqama, setLocalIqama] = useState({ ...store.iqamaDelays });
  const [localTypes, setLocalTypes] = useState({ ...store.iqamaTypes });
  const [mosqueNameLocal, setMosqueNameLocal] = useState(store.mosqueName);
  const [localLat, setLocalLat] = useState(store.customLat);
  const [localLng, setLocalLng] = useState(store.customLng);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    return cities.filter(c => 
      c.town.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [searchTerm, cities]);

  const uniqueCountries = Array.from(new Set(cities.map(c => c.country)));
  const availableRegions = Array.from(new Set(cities.filter(c => c.country === store.selectedCountry).map(c => c.city)));
  const availableTowns = cities.filter(c => c.country === store.selectedCountry && c.city === store.selectedRegion);

  const saveAndClose = () => {
      store.updateSettings(localState);
      store.updateAdjustments(localAdj);
      store.updateIqamaDelays(localIqama);
      store.updateIqamaTypes(localTypes);
      store.updateMosqueName(mosqueNameLocal);
      store.updateCustomLocation(localLat, localLng);
      close();
  };

  const handleGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocalLat(pos.coords.latitude);
          setLocalLng(pos.coords.longitude);
          setLocalState({...localState, useCustomLocation: true});
        },
        (err) => alert("Error: " + err.message)
      );
    }
  };

  const fileInputRef = useRef(null);
  const defaultThumbnails = [
    '/bg.jpg', 
    'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=300&q=80',
    'https://images.unsplash.com/photo-1579017308347-815e076632c0?w=300&q=80',
    'https://images.unsplash.com/photo-1564121211835-e88c852648ab?w=300&q=80'
  ];

  return (
    <div className="modal-overlay">
      <div className={`premium-settings ${localState.language === 'ar' ? 'ar-mode' : ''}`} dir={localState.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="settings-header">
          <h2><Settings size={22} color="#cca655" /> {t('settings')}</h2>
          <button className="btn-close" onClick={close}><X size={24} /></button>
        </div>

        <div className="settings-section-title"><Globe size={16} /> {t('language')}</div>
        <div className="segmented-control">
          <button className={localState.language === 'ar' ? 'active' : ''} onClick={() => setLocalState({...localState, language: 'ar'})}>العربية</button>
          <button className={localState.language === 'en' ? 'active' : ''} onClick={() => setLocalState({...localState, language: 'en'})}>English</button>
          <button className={localState.language === 'fr' ? 'active' : ''} onClick={() => setLocalState({...localState, language: 'fr'})}>Français</button>
        </div>

        <div className="settings-section-title"><Monitor size={16} /> {t('fullscreen')}</div>
        <div className="segmented-control">
          <button className={!localState.isFullscreenEnabled ? 'active' : ''} onClick={() => setLocalState({...localState, isFullscreenEnabled: false})}>{t('cancel')}</button>
          <button className={localState.isFullscreenEnabled ? 'active' : ''} onClick={() => setLocalState({...localState, isFullscreenEnabled: true})}>{t('autoFullscreen')}</button>
        </div>

        <div className="settings-section-title">{t('mosqueName')}</div>
        <input className="settings-input" value={mosqueNameLocal} onChange={e => setMosqueNameLocal(e.target.value)} />

        <div className="settings-section-title">{t('location')}</div>
        
        <div style={{position:'relative', marginBottom:'1.5rem'}}>
          <input 
            className="settings-input" 
            placeholder={i18n.language === 'ar' ? 'بحث عن مدينة...' : 'Search for a city...'} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
          />
          {filteredCities.length > 0 && (
            <div style={{position:'absolute', top:'100%', left:0, right:0, background:'#1c2128', border:'1px solid #30363d', borderRadius:'6px', zIndex:1000, marginTop:'4px', overflow:'hidden'}}>
              {filteredCities.map(c => (
                <div key={c.id} style={{padding:'10px', cursor:'pointer', borderBottom:'1px solid #30363d'}} onMouseDown={() => {
                  store.updateSelectedCountry(c.country);
                  store.updateSelectedRegion(c.city);
                  store.updateCity(c.id);
                  setSearchTerm('');
                }}>
                  <div style={{fontSize:'0.9rem', fontWeight:'bold'}}>{c.town}</div>
                  <div style={{fontSize:'0.75rem', color:'#8b949e'}}>{c.city}, {c.country}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="segmented-control" style={{marginBottom: '1rem'}}>
          <button className={!localState.useCustomLocation ? 'active' : ''} onClick={() => setLocalState({...localState, useCustomLocation: false})}>Dropdown List</button>
          <button className={localState.useCustomLocation ? 'active' : ''} onClick={() => setLocalState({...localState, useCustomLocation: true})}>{t('useCustomLoc')}</button>
        </div>

        {!localState.useCustomLocation ? (
          <div className="grid-3">
              <div>
                <label style={{fontSize: '0.85rem', color: '#8b949e', display: 'block', marginBottom: '8px'}}>{t('country')}</label>
                <select className="settings-input" value={store.selectedCountry} onChange={(e) => {
                    store.updateSelectedCountry(e.target.value);
                    const regions = Array.from(new Set(cities.filter(c => c.country === e.target.value).map(c => c.city)));
                    store.updateSelectedRegion(regions[0] || '');
                    const firstCity = cities.find(c => c.country === e.target.value && c.city === regions[0]);
                    if(firstCity) store.updateCity(firstCity.id);
                }}>
                    {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize: '0.85rem', color: '#8b949e', display: 'block', marginBottom: '8px'}}>Region</label>
                <select className="settings-input" value={store.selectedRegion} onChange={(e) => {
                    store.updateSelectedRegion(e.target.value);
                    const town = cities.find(c => c.country === store.selectedCountry && c.city === e.target.value);
                    if (town) store.updateCity(town.id);
                }}>
                    {availableRegions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{fontSize: '0.85rem', color: '#8b949e', display: 'block', marginBottom: '8px'}}>{t('city')}</label>
                <select className="settings-input" value={store.cityId} onChange={e => store.updateCity(e.target.value)}>
                    {availableTowns.map(tn => <option key={tn.id} value={tn.id}>{tn.town}</option>)}
                </select>
              </div>
          </div>
        ) : (
          <div style={{background: '#1c2128', padding: '1rem', borderRadius: '8px', border: '1px solid #30363d'}}>
            <button className="btn-save" style={{width: '100%', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}} onClick={handleGPS}>
              <MapPin size={20} /> {t('findLocation')}
            </button>
            <div className="grid-2">
              <div><label style={{fontSize: '0.85rem', color: '#8b949e'}}>{t('latitude')}</label><input className="settings-input" type="number" value={localLat} onChange={e => setLocalLat(e.target.value)} /></div>
              <div><label style={{fontSize: '0.85rem', color: '#8b949e'}}>{t('longitude')}</label><input className="settings-input" type="number" value={localLng} onChange={e => setLocalLng(e.target.value)} /></div>
            </div>
          </div>
        )}

        <div className="settings-section-title">{t('calcMethod')}</div>
        <select className="settings-input"><option>Muslim World League</option></select>

        <div className="settings-section-title">{t('madhab')}</div>
        <div className="segmented-control">
          <button className="active">{t('shafii')}</button>
          <button>{t('hanafi')}</button>
        </div>

        <div className="settings-section-title">{t('timezoneAdj')}</div>
        <div className="stepper-card">
           <div className="stepper-desc">{t('timezoneDesc')}</div>
           <div className="stepper-controls" dir="ltr">
              <button onClick={() => setLocalState({...localState, timezoneOffset: (localState.timezoneOffset || 0) - 1})}>-</button>
              <div className="stepper-val">{localState.timezoneOffset > 0 ? `+${localState.timezoneOffset}` : localState.timezoneOffset || 0}</div>
              <button onClick={() => setLocalState({...localState, timezoneOffset: (localState.timezoneOffset || 0) + 1})}>+</button>
           </div>
        </div>

        <div className="settings-section-title">{t('prayerAdj')}</div>
        <div className="adjustment-grid">
           {['fajr', 'shuruq', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
              <div key={p} className="adj-box">
                  <span>{t(p)}</span>
                  <input type="number" dir="ltr" value={localAdj[p]} onChange={e => setLocalAdj({...localAdj, [p]: parseInt(e.target.value)||0})} />
              </div>
           ))}
        </div>

        <div className="settings-section-title">{t('iqamaTimes')}</div>
        {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
           <div key={p} className="iqama-row">
               <div className="iqama-row-top">
                   <div className="prayer-name">{t(p)}</div>
                   <div className="segmented-control" style={{background: '#111418', border: '1px solid #30363d'}}>
                       <button className={localTypes[p] === 'after' ? 'active' : ''} onClick={() => setLocalTypes({...localTypes, [p]: 'after'})}>{t('afterAthan')}</button>
                       <button className={localTypes[p] === 'fixed' ? 'active' : ''} onClick={() => setLocalTypes({...localTypes, [p]: 'fixed'})}>{t('fixedTime')}</button>
                       <button className={localTypes[p] === 'before' ? 'active' : ''} onClick={() => setLocalTypes({...localTypes, [p]: 'before'})}>{t('beforeNext')}</button>
                   </div>
               </div>
               <div className="iqama-row-bottom">
                   {localTypes[p] === 'fixed' ? (i18n.language === 'ar' ? 'الوقت (ساعة:دقيقة):' : 'Fixed Time (HH:mm):') : 
                    localTypes[p] === 'before' ? (i18n.language === 'ar' ? 'دقائق قبل الصلاة القادمة:' : 'Minutes before next:') :
                    t('minsAfterAthan')}
                   <input dir="ltr" value={localIqama[p]} onChange={e => setLocalIqama({...localIqama, [p]: e.target.value})} placeholder={localTypes[p] === 'fixed' ? '12:30' : '15'} />
               </div>
           </div>
        ))}

        <div className="settings-section-title">{t('bgPicture')}</div>
        <div className="segmented-control">
          <button className={localState.backgroundType === 'default' ? 'active' : ''} onClick={() => setLocalState({...localState, backgroundType: 'default'})}>{t('default')}</button>
          <button className={localState.backgroundType === 'unsplash' ? 'active' : ''} onClick={() => setLocalState({...localState, backgroundType: 'unsplash'})}>{t('islamic')}</button>
          <button className={localState.backgroundType === 'local' ? 'active' : ''} onClick={() => setLocalState({...localState, backgroundType: 'local'})}>{t('local')}</button>
        </div>
        
        <div className="bg-gallery">
           {defaultThumbnails.map((src, i) => (
               <div key={i} className={`bg-thumbnail ${localState.backgroundUrl === src ? 'active' : ''}`} style={{backgroundImage: `url(${src})`}} onClick={() => setLocalState({...localState, backgroundUrl: src})}></div>
           ))}
        </div>
        
        <input type="file" style={{display: 'none'}} ref={fileInputRef} accept="image/*" onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setLocalState({...localState, backgroundUrl: reader.result, backgroundType: 'local'});
                reader.readAsDataURL(file);
            }
        }}/>
        <div className="bg-upload-box" style={{marginTop:'10px'}} onClick={() => fileInputRef.current.click()}>
            <ImagePlus size={24} style={{marginRight: '8px'}}/> {t('uploadCustom')}
        </div>

        <div className="settings-section-title">{t('newsTicker')}</div>
        <div className="ticker-card">
           <div className="ticker-card-top">
               <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Volume2 size={18}/> {t('enableTicker')}</span>
               <div className={`toggle-switch ${localState.showNewsBar ? 'on' : ''}`} onClick={() => setLocalState({...localState, showNewsBar: !localState.showNewsBar})}></div>
           </div>
           {localState.showNewsBar && <textarea rows={2} value={localState.newsText} onChange={e => setLocalState({...localState, newsText: e.target.value})} />}
        </div>

        <div className="settings-section-title"><Clock size={16} /> {t('iqamaTimes')}</div>
        <div className="ticker-card">
           <div className="ticker-card-top">
               <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Monitor size={18}/> {t('enableIqamaCountdown')}</span>
               <div className={`toggle-switch ${localState.enableIqamaCountdown ? 'on' : ''}`} onClick={() => setLocalState({...localState, enableIqamaCountdown: !localState.enableIqamaCountdown})}></div>
           </div>
           {localState.enableIqamaCountdown && (
             <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8b949e'}}>
               <span>{t('iqamaCountdownMinsLabel')}</span>
               <input 
                 type="number" 
                 style={{width: '70px', background: '#111418', border: '1px solid #30363d', borderRadius: '6px', color: '#fff', padding: '6px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold'}}
                 value={localState.iqamaCountdownMins} 
                 onChange={e => setLocalState({...localState, iqamaCountdownMins: parseInt(e.target.value) || 10})} 
               />
             </div>
           )}
        </div>

        <div className="modal-footer">
            <button className="btn-save" onClick={saveAndClose}>{t('save')}</button>
            <button className="btn-cancel" onClick={close}>{t('cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// --- Main App ---

const App = () => {
  const { t, i18n } = useTranslation();
  const { 
    mosqueName, cityId, settings, adjustments, iqamaDelays, iqamaTypes, 
    customLat, customLng, offlineCache, selectedCountry, selectedRegion,
    updateMosqueName, updateSettings, updateAdjustments, updateIqamaDelays, 
    updateIqamaTypes, updateCity, updateSelectedCountry, updateSelectedRegion, 
    updateCustomLocation, updateOfflineCache 
  } = useStore();

  const [now, setNow] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [hadithIndex, setHadithIndex] = useState(0);
  const [hadithClass, setHadithClass] = useState('hadith-fade-in');
  const [isAthanTime, setIsAthanTime] = useState(false);

  // Sync i18n dynamically
  useEffect(() => {
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language || 'ar');
    }
  }, [settings.language]);

  const cityObj = citiesData.find(c => c.id === cityId) || citiesData[0];
  const finalLat = settings.useCustomLocation && customLat ? parseFloat(customLat) : cityObj.lat;
  const finalLng = settings.useCustomLocation && customLng ? parseFloat(customLng) : cityObj.lng;
  
  const closestCity = useMemo(() => {
    if (settings.useCustomLocation) {
      return getClosestCity(finalLat, finalLng, citiesData);
    }
    return null;
  }, [finalLat, finalLng, settings.useCustomLocation]);

  // Only recalculate times if the date or settings change, not every second (now)
  const dateKey = now.toISOString().split('T')[0];

  const times = useMemo(() => {
    try {
      return calculatePrayerTimes(now, finalLat, finalLng, adjustments, settings);
    } catch (e) {
      // Fallback to cache without making it a dependency
      return offlineCache || calculatePrayerTimes(now, 36.8065, 10.1815, adjustments, settings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, finalLat, finalLng, adjustments, settings]); // <-- REMOVED offlineCache and 'now'


  // Safe Cache Update (Effect, not during render)
  useEffect(() => {
    if (times && times.fajr) {
      updateOfflineCache(times);
    }
  }, [times, updateOfflineCache]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = new Date();
      setNow(currentTime);
      
      // Check for Athan Time Flash (Duration: 15 seconds)
      if (times) {
        const matchingPrayer = Object.values(times).find(t => {
          const diff = Math.abs(differenceInSeconds(t, currentTime));
          return diff < 2; // Match within 2 seconds
        });
        if (matchingPrayer) {
          setIsAthanTime(true);
          setTimeout(() => setIsAthanTime(false), 15000); // Flash for 15 seconds
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [times]);

  // Hadith rotation with animation
  useEffect(() => {
    const timer = setInterval(() => {
      setHadithClass(''); // Reset animation
      setTimeout(() => {
        setHadithIndex((prev) => (prev + 1) % ahadithData.length);
        setHadithClass('hadith-fade-in');
      }, 50);
    }, 45000); // 45 seconds rotation
    return () => clearInterval(timer);
  }, []);

  // Auto-Fullscreen logic
  useEffect(() => {
    if (settings.isFullscreenEnabled) {
      const enterFS = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => console.log("FS error", e));
        }
      };
      // Fullscreen requires user interaction, so we listen for the first click
      window.addEventListener('click', enterFS, { once: true });
      return () => window.removeEventListener('click', enterFS);
    }
  }, [settings.isFullscreenEnabled]);

  // Detect Hijri Month (Ramadan = 9)
  const hijriInfo = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-uma-nu-latn', { month: 'numeric' });
      return { month: parseInt(formatter.format(now)) };
    } catch (e) {
      return { month: 0 };
    }
  }, [now]);

  const isRamadan = hijriInfo.month === 9;
  const isFriday = now.getDay() === 5;

  const prayers = useMemo(() => {
    const list = [];
    if (isRamadan) {
      const imsakTime = new Date(times.fajr.getTime() - 10 * 60000);
      list.push({ id: 'imsak', label: t('imsak'), athanFormat: format(imsakTime, 'HH:mm'), iqamaFormat: '---' });
    }
    list.push({ id: 'fajr', label: t('fajr'), ...renderTimes(times.fajr, iqamaTypes.fajr, iqamaDelays.fajr, times.dhuhr) });
    list.push({ id: 'shuruq', label: t('shuruq'), athanFormat: format(times.shuruq, 'HH:mm'), iqamaFormat: '---' });
    list.push({ id: 'dhuhr', label: isFriday ? t('jumuah') : t('dhuhr'), isJumuah: isFriday, ...renderTimes(times.dhuhr, iqamaTypes.dhuhr, iqamaDelays.dhuhr, times.asr) });
    list.push({ id: 'asr', label: t('asr'), ...renderTimes(times.asr, iqamaTypes.asr, iqamaDelays.asr, times.maghrib) });
    list.push({ id: 'maghrib', label: isRamadan ? t('iftar') : t('maghrib'), ...renderTimes(times.maghrib, iqamaTypes.maghrib, iqamaDelays.maghrib, times.isha) });
    list.push({ id: 'isha', label: t('isha'), ...renderTimes(times.isha, iqamaTypes.isha, iqamaDelays.isha, new Date(times.fajr.getTime() + 24*3600000)) });
    return list;
  }, [times, iqamaTypes, iqamaDelays, isRamadan, isFriday, t]);

  const nextP = useMemo(() => getNextPrayer(times, now), [times, now]);
  const diffSecs = differenceInSeconds(nextP.time, now);
  
  const bgStyle = useMemo(() => {
    if (settings.backgroundUrl) return { backgroundImage: `url(${settings.backgroundUrl})` };
    if (settings.backgroundType === 'local') return { backgroundImage: `url('/bg.jpg')` };
    if (settings.backgroundType === 'unsplash') return { backgroundImage: `url(https://source.unsplash.com/1920x1080/?islamic,mosque,landscape)` };
    return { backgroundImage: `url('/bg.jpg')` };
  }, [settings.backgroundType, settings.backgroundUrl]);

  // --- Iqama Focus Logic ---
  const activePrayer = prayers.find(p => p.id === nextP.name);
  const isAfterAthan = nextP.name !== 'isha' ? (now >= times[nextP.name]) : (now >= times.isha || now < times.fajr);
  const timeToIqama = activePrayer?.timeObj ? differenceInSeconds(activePrayer.timeObj, now) : -1;
  const showFocusMode = settings.enableIqamaCountdown && isAfterAthan && timeToIqama > 0 && timeToIqama < (settings.iqamaCountdownMins || 10) * 60;

  return (
    <div className={`app-container`} style={bgStyle} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {showFocusMode && (
        <div className="focus-overlay">
           <div className="focus-icon"><BellOff size={100} /></div>
           <div className="focus-timer">{formatRemaining(timeToIqama)}</div>
           <div className="focus-msg">{t('silenceReminder')}</div>
        </div>
      )}
      {isAthanTime && <div className="athan-flash" />}
      <div className="overlay"></div>

      {settings.showNewsBar && (
        <div className="ticker-news">
          <span>{settings.newsText}</span>
        </div>
      )}

      <button className="settings-btn" onClick={() => setShowSettings(true)}>
        <Settings size={28} />
      </button>

      <div className="top-dates" style={{marginTop: settings.showNewsBar ? '3.5rem' : '0.5rem'}}>
        {new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-TN' : i18n.language === 'fr' ? 'fr-FR' : 'en-GB', { 
            weekday: 'long', day: 'numeric', month: 'long' 
        }).format(now)}
        {i18n.language === 'ar' ? ' هـ ' : ' '} • {format(now, 'yyyy/MM/dd')}
      </div>

      <div style={{display:'flex', gap:'15px', zIndex:10}}>
          {isRamadan && <div className="ramadan-banner">🌙 {t('ramadanMubarak')}</div>}
          {isFriday && <div className="jumuah-banner">📢 {t('jumuahMessage')}</div>}
      </div>

      <div className="mosque-title">
        {mosqueName} - {settings.useCustomLocation ? (closestCity?.town || closestCity?.name || 'GPS') : (cityObj.town || cityObj.name)}
      </div>

      <div className="big-clock" style={{flexDirection: i18n.language === 'ar' ? 'row' : 'row-reverse'}}>
        <span className="hours-mins">{format(now, 'HH:mm')}</span>
        <span className="seconds" style={{marginLeft: i18n.language === 'ar' ? '0' : '1.2rem', marginRight: i18n.language === 'ar' ? '1.2rem' : '0'}}>{format(now, 'ss')}</span>
      </div>

      <div className="remaining-pill">
        {t('remainingFor')} {prayers.find(p => p.id === nextP.name)?.label || t('fajr')}
        <span>{formatRemaining(diffSecs)}</span>
      </div>

      <div className="verse-text">
        {isFriday ? t('jumuahVerse') : t('mosqueVerse')}
      </div>

      <div className="prayer-cards-container">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="mobile-list-header">
           <span>{t('prayer')}</span>
           <span>{t('athan')}</span>
           <span>{t('iqama')}</span>
        </div>
        
        {prayers.map((p) => {
          const isActive = nextP.name === p.id;
          return (
            <div key={p.id} className={`prayer-card ${isActive ? 'active' : ''} ${p.isJumuah ? 'jumuah-highlight' : ''}`}>
              <div className="card-title">{p.label}</div>
              <div className="card-times-wrapper">
                <div className="card-athan">{p.athanFormat}</div>
                <div className="card-iqama">{p.iqamaFormat}</div>
              </div>
              <div className="card-footer-label">{t('athanIqama')}</div>
            </div>
          )
        })}
      </div>

      <div className={`bottom-ticker ${hadithClass}`}>
         {i18n.language === 'ar' ? ahadithData[hadithIndex].arabic : (i18n.language === 'fr' ? ahadithData[hadithIndex].french : ahadithData[hadithIndex].english)}
      </div>

      {settings.isFirstLaunch && (
        <div className="modal-overlay" style={{background: 'rgba(0,0,0,0.95)'}}>
          <div className="premium-settings" style={{maxWidth: '500px', height: 'auto', textAlign: 'center'}}>
             <div style={{color: '#cca655', marginBottom: '1.5rem'}}><MapPin size={60} style={{margin:'0 auto'}}/></div>
             <h2 style={{fontSize: '2rem', marginBottom: '1rem'}}>{t('welcome')}</h2>
             <p style={{color: '#8b949e', marginBottom: '2rem', fontSize: '1.1rem'}}>{t('setupDesc')}</p>
             <button className="btn-save" style={{width: '100%', marginBottom: '1rem'}} onClick={() => {
                if(navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    updateCustomLocation(pos.coords.latitude, pos.coords.longitude);
                    updateSettings({ useCustomLocation: true, isFirstLaunch: false });
                  }, () => {
                    updateSettings({ isFirstLaunch: false });
                    setShowSettings(true);
                  });
                } else {
                  updateSettings({ isFirstLaunch: false });
                  setShowSettings(true);
                }
             }}>
               {t('getStarted')}
             </button>
             <button className="btn-cancel" style={{width: '100%'}} onClick={() => {
               updateSettings({ isFirstLaunch: false });
               setShowSettings(true);
             }}>
               {t('skipSetup')}
             </button>
          </div>
        </div>
      )}

      {showSettings && (
        <SettingsModal 
          close={() => setShowSettings(false)} 
          cities={citiesData}
          store={{ 
            mosqueName, cityId, settings, adjustments, iqamaDelays, iqamaTypes, customLat, customLng,
            selectedCountry, selectedRegion,
            updateMosqueName, updateCity, updateSettings, updateAdjustments, updateIqamaDelays, updateIqamaTypes,
            updateSelectedCountry, updateSelectedRegion, updateCustomLocation
          }}
        />
      )}
    </div>
  );
};

export default App;
