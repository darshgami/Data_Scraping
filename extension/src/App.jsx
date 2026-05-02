import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, MapPin, Loader2, CheckCircle, AlertCircle, Search, Globe, FileSpreadsheet, Hash } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function App() {
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [lastDownload, setLastDownload] = useState(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // Get current tab URL
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          try {
            const url = new URL(tabs[0].url);
            setCurrentUrl(url.hostname);
            setFullUrl(tabs[0].url);
          } catch (e) {
            setCurrentUrl('Webpage');
          }
        }
      });
    }
  }, []);

  const handleScrape = async () => {
    if (!fullUrl || fullUrl.startsWith('chrome://')) {
      setStatus('Cannot scrape this page type.');
      return;
    }

    setLoading(true);
    setStatus('Backend is scraping the page using Playwright...');
    
    try {
      const response = await axios.post(`${API_BASE_URL}/scrape-url/`, {
        url: fullUrl,
        city: city,
        pincode: pincode
      }, {
        responseType: 'blob' // Important for file download
      });

      // Check if response is actually a file
      if (response.data.type === 'application/json') {
          // It's an error message disguised as a blob
          const reader = new FileReader();
          reader.onload = () => {
              const errorData = JSON.parse(reader.result);
              setStatus(`Error: ${errorData.error || 'Scraping failed'}`);
              setLoading(false);
          };
          reader.readAsText(response.data);
          return;
      }

      // Create a link to download the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `BDS_Data_${city || 'Export'}_${new Date().getTime()}.csv`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatus('Successfully extracted & downloaded CSV!');
      setLastDownload(new Date().toLocaleTimeString());
      setLoading(false);
    } catch (err) {
      console.error(err);
      let errorMsg = 'Backend connection failed.';
      if (err.response && err.response.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
              try {
                  const errorData = JSON.parse(reader.result);
                  setStatus(`Error: ${errorData.error || 'Server error'}`);
              } catch(e) {
                  setStatus('Server error during scraping.');
              }
              setLoading(false);
          };
          reader.readAsText(err.response.data);
          return;
      }
      setStatus(errorMsg);
      setLoading(false);
    }
  };

  return (
    <div className="w-[380px] min-h-[550px] bg-white dark:bg-[#0a0a0c] text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none">BDS PRO</h1>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.3em] mt-1">Industrial Data Scraper</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Target Domain</p>
              <p className="text-sm font-bold truncate">{currentUrl || 'Detecting...'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest ml-1">City</label>
              <div className="relative group">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Delhi" 
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-xs"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">Pincode</label>
                <span className="text-[8px] font-bold text-gray-400 uppercase">Optional</span>
              </div>
              <div className="relative group">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="e.g. 110001" 
                  className="w-full pl-9 pr-3 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-xs"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            onClick={handleScrape}
            className={`w-full group relative py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs text-white shadow-lg transition-all active:scale-[0.98] overflow-hidden ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            )}
            <span className="relative">{loading ? 'SCRAPING...' : 'EXTRACT & DOWNLOAD'}</span>
          </button>
        </div>

        {/* Status Area */}
        <div className="min-h-[50px]">
          {status && (
            <div className={`p-4 rounded-xl flex items-start gap-3 text-[10px] font-bold border animate-in fade-in slide-in-from-bottom-2 duration-300 ${status.includes('Successfully') ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400'}`}>
              {status.includes('Successfully') ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="flex-1">
                {status}
                {lastDownload && <p className="text-[9px] mt-1 opacity-60 italic">Downloaded at {lastDownload}</p>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-3 h-3 text-emerald-500" />
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CSV (Backend Generated)</span>
        </div>
        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">PRO EDITION</span>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}} />
    </div>
  );
}

export default App;
