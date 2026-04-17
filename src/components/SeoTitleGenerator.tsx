import React, { useState } from 'react';
import { Type } from '@google/genai';
import { getGeminiResponse } from '../services/geminiService';
import { Loader2, Search, Copy, CheckCircle, Lightbulb, AlertCircle } from 'lucide-react';

export default function SeoTitleGenerator() {
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [targetLocation, setTargetLocation] = useState('Trichy, Tamil Nadu, India');
  const [targetAudience, setTargetAudience] = useState('Shop owners & contractors');

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedTitles([]);
    setError(null);
    
    const prompt = `Generate exactly 20 SEO titles for the focus keyword: "${focusKeyword}".
    Target Audience: ${targetAudience}
    Target Location: ${targetLocation}
    
    Requirements:
    - Exactly 20 titles.
    - Length: strictly 55 to 65 characters long.
    - Must use power words (e.g., Best, 2026, Guide, Top, Price, Ultimate, Secret, etc.).
    - Ensure location is included naturally in some titles if applicable.
    - Return a JSON array of strings.`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Array of 20 SEO optimized titles"
    };

    try {
      const response = await getGeminiResponse(prompt, 'You are an expert SEO architect.', true, schema);
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
         setGeneratedTitles(parsed);
      }
    } catch(e) {
      console.error(e);
      setError(`Failed to generate titles: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display flex items-center gap-2">
          <Search className="w-6 h-6 text-amber-500" />
          SEO Title Generator
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Focus Keyword</label>
            <input 
              className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-lg"
              placeholder="Enter your main focus keyword..."
              value={focusKeyword}
              onChange={e => setFocusKeyword(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 transition-colors"
                placeholder="e.g., Shop owners & contractors"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Location</label>
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-amber-500 transition-colors"
                placeholder="e.g., Trichy, Tamil Nadu, India"
                value={targetLocation}
                onChange={e => setTargetLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
             <button 
                onClick={handleGenerate}
                disabled={isGenerating || !focusKeyword}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Lightbulb className="w-6 h-6" />}
                Generate 20 SEO Titles
              </button>
          </div>
        </div>
      </div>

      {generatedTitles.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <CheckCircle className="w-6 h-6 text-green-500"/> 20 Generated SEO Titles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {generatedTitles.map((title, i) => (
                <div key={i} className="flex flex-col p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-amber-300 hover:shadow-sm transition group">
                   <div className="flex-1">
                      <p className="text-slate-800 font-medium">{title}</p>
                   </div>
                   <div className="mt-3 flex items-center justify-between">
                     <span className={`text-xs font-bold ${title.length >= 55 && title.length <= 65 ? 'text-green-600' : 'text-amber-600'}`}>
                        {title.length} chars
                     </span>
                     <button
                        onClick={() => copyToClipboard(title, i)}
                        className="text-sm font-semibold flex items-center gap-1.5 text-slate-500 group-hover:text-amber-600 transition"
                     >
                       {copiedIndex === i ? (
                         <><CheckCircle className="w-4 h-4 text-green-500"/> Copied</>
                       ) : (
                         <><Copy className="w-4 h-4"/> Copy</>
                       )}
                     </button>
                   </div>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
}

