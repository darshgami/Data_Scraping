import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { Download, MapPin, Loader2, CheckCircle, AlertCircle, Search, Globe, FileSpreadsheet, Hash, Sparkles, Building2, ExternalLink, Mail, Phone } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

function App() {
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [fullUrl, setFullUrl] = useState('');
  const [detectedSearch, setDetectedSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
          try {
            const url = new URL(tabs[0].url);
            setCurrentUrl(url.hostname);
            setFullUrl(tabs[0].url);

            const params = new URLSearchParams(url.search);
            let query = params.get('q') || params.get('query') || params.get('term') || params.get('keyword') || params.get('search') || params.get('s');
            
            if (query) {
              setDetectedSearch(decodeURIComponent(query).replace(/\+/g, ' '));
            } else {
              const title = tabs[0].title.split('|')[0].split('-')[0].trim();
              setDetectedSearch(title || 'Data Analysis');
            }
          } catch (e) {
            setCurrentUrl('Unknown Page');
          }
        }
      });
    }
  }, []);

  const handleScrape = async () => {
    const cleanCity = city.trim();
    if (!cleanCity) {
      setError('Please enter a City.');
      return;
    }

    setLoading(true);
    setStatus(`Scanning page for businesses in ${cleanCity}...`);
    setError('');
    setResults([]);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/scrape/`, {
        url: fullUrl,
        city: cleanCity,
        pincode: pincode.trim()
      });

      if (response.data.results && response.data.results.length > 0) {
          setResults(response.data.results);
          setStatus(`Success! Extracted ${response.data.results.length} companies.`);
      } else {
          setError(`No data found for '${cleanCity}'. Please ensure this city is visible on the webpage results.`);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. The website structure might be complex.');
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (results.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(results.map(item => ({
      "Company Name": item["Company Name"],
      "Address": item["Address"],
      "Website": item["Website"],
      "Email": item["Email"],
      "Contact": item["Contact"]
    })));
    worksheet['!cols'] = [{ wch: 40 }, { wch: 60 }, { wch: 40 }, { wch: 30 }, { wch: 20 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Business Data");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BDS_Industrial_Data_${city.trim().replace(/\s+/g, '_')}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-[450px] min-h-[600px] max-h-[900px] bg-[#f8faff] dark:bg-[#0a0a0c] text-gray-900 dark:text-gray-100 flex flex-col font-sans overflow-hidden">
      <div className="p-7 bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-900 relative shrink-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black text-white tracking-tight leading-none uppercase">BDS PRO ANALYZER</h1>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.3em] mt-1">Industrial Extraction Engine</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5 overflow-y-auto custom-scrollbar">
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                    <Search className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Active Discovery</p>
                    <p className="text-sm font-black truncate">{detectedSearch}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="e.g. Rajkot" 
                className="w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-xs"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Optional" 
                className="w-full pl-10 pr-3 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-bold text-xs"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button 
          disabled={loading}
          onClick={handleScrape}
          className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs text-white shadow-xl transition-all active:scale-[0.98] ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100 dark:shadow-none'}`}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>{loading ? 'SCANNING PAGE...' : 'ANALYZE & PREVIEW'}</span>
        </button>

        <div className="space-y-4">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400 flex items-start gap-3 text-[11px] font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          {results.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        Found {results.length} Matches
                    </p>
                    <button 
                        onClick={downloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black transition-all shadow-xl shadow-emerald-50 active:scale-95"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        DOWNLOAD EXCEL
                    </button>
                </div>
                
                <div className="border border-gray-100 dark:border-white/10 rounded-2xl bg-white dark:bg-white/5 overflow-hidden shadow-sm">
                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                        <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {results.map((res, i) => (
                                <div key={i} className="p-4 space-y-2 hover:bg-blue-50/30 dark:hover:bg-white/5 transition-colors">
                                    <h3 className="text-[11px] font-black text-blue-800 dark:text-blue-400 leading-tight">{res['Company Name']}</h3>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        <div className="flex items-start gap-2 text-[10px] text-gray-500 font-bold">
                                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                            <span>{res['Address']}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                <span>{res['Email']}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                <span>{res['Contact']}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>

      <footer className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex items-center justify-center">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Emergency Extraction Engine • V1.7</span>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef2f6; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
      `}} />
    </div>
  );
}

export default App;
