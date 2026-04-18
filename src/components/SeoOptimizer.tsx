import React, { useState } from 'react';
import { getGeminiStream } from '../services/geminiService';
import { Loader2, Code, Copy, CheckCircle, Wand2, FileDown, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LinkUpload } from './LinkUpload';

export default function SeoOptimizer() {
  const [existingHtml, setExistingHtml] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [externalLinks, setExternalLinks] = useState('');
  const [internalLinks, setInternalLinks] = useState('');

  const [targetLocation, setTargetLocation] = useState('Trichy, Tamil Nadu, India');
  const [targetAudience, setTargetAudience] = useState('Shop owners & contractors');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlatform, setGeneratedPlatform] = useState<'wordpress' | 'blogger' | null>(null);

  const handleOptimize = async (platform: 'wordpress' | 'blogger') => {
    setIsGenerating(true);
    setGeneratedCode('');
    setGeneratedPlatform(platform);
    setError(null);
    
    let platformSpecificInstructions = '';
    
    if (platform === 'wordpress') {
      platformSpecificInstructions = `You are a world-class SEO Architect and Elementor Code Optimizer for WordPress.
      You must take the user's existing basic HTML and fully optimize it for SEO in 2026.
      
      - IMAGES: DO NOT use Base64 strings in img src attributes. Use WordPress placeholder paths (e.g., src="/wp-content/uploads/2026/04/[image-name].jpg").
      
      FINAL OUTPUT FORMAT:
      Output exactly ONE single HTML markdown block (\`\`\`html) that contains EVERYTHING.
      At the very top of the HTML code, you MUST include this exact commented header:
      <!-- 
      ================================================================
      1. Title: [Your generated 55-65 chars title]
      2. Meta Description: [Your generated 150-160 chars description]
      3. Labels: [3-6 labels]
      4. Focus Keyword: [The keyword]
      5. Permalink: [The generated slug]
      ================================================================
      -->
      [Followed immediately by the FULL Elementor compatible HTML code]
      
      DO NOT output the metadata outside of this HTML comment block.`;
    } else {
      platformSpecificInstructions = `You are a world-class SEO Architect and HTML Code Optimizer for Google Blogger.
      You must take the user's existing basic HTML and fully optimize it for SEO in 2026 natively for Blogger.
      
      - Blogger Specific Rules: DO NOT use WordPress shortcodes. DO NOT rely on heavy external CSS or Elementor classes. Use standard clean HTML5 and highly-compatible inline CSS or a single <style> block that is compatible with Google Blogger's editor. Maximize semantic HTML.
      - IMAGES: DO NOT use Base64 strings. DO NOT use WordPress (/wp-content/) paths. Use standard placeholder image URLs (e.g., https://via.placeholder.com/800x450).
      
      FINAL OUTPUT FORMAT:
      Output exactly ONE single HTML markdown block (\`\`\`html) that contains EVERYTHING.
      At the very top of the HTML code, you MUST include this exact commented header:
      <!-- 
      ================================================================
      1. Title: [Your generated 55-65 chars title]
      2. Meta Description: [Your generated 150-160 chars description]
      3. Labels: [3-6 labels]
      4. Focus Keyword: [The keyword]
      5. Permalink: [The generated slug]
      ================================================================
      -->
      [Followed immediately by the FULL Google Blogger compatible HTML code]
      
      DO NOT output the metadata outside of this HTML comment block.`;
    }

    const systemInstruction = `${platformSpecificInstructions}
    
    CONDITIONS:
    1. If user provided Image URLs are empty: auto fetch relevant images (Unsplash/Pexels/Pixabay/SVG)
    2. If external links are empty: 
       - Auto generate exactly 25 external links (~2 per section based on anchor text).
       - Use Wikipedia for ONLY 2 sections max (up to 4 links total from Wikipedia).
       - All other links MUST be from unique, valid, diverse sources (e.g., Google, Bing, Yahoo results, and other real website pages).
       - Prevent repeating domains.
    3. If internal links are empty: auto link to standard pages (/about-us/, /contact/, etc).

    SEO RULES 2026 check/apply:
    - Target Focus Keyword heavily but naturally.
    - Keyword density: 0.6% - 1.0%
    - Placement: Title, Meta description, H1, First 100 words, >= 1 H2 or H3, every 150-200 words, final paragraph.
    - Proper H1 (only one), H2, H3 hierarchy.
    - Short paragraphs (5-8 lines). E-E-A-T requirements (experience, trust, local references for ${targetLocation} if context suits). Target Audience: ${targetAudience}.
    - DO NOT include any YouTube video embeds.
    `;

    const prompt = `
    Focus Keyword: ${focusKeyword}
    
    User Provided Image URLs List:
    ${imageUrls || 'NONE - Apply Condition 1'}
    
    User Provided External Links Input:
    ${externalLinks || 'NONE - Apply Condition 2'}
    
    User Provided Internal Links Input:
    ${internalLinks || 'NONE - Apply Condition 3'}

    EXISTING HTML TO OPTIMIZE:
    ${existingHtml}
    `;

    try {
      const stream = getGeminiStream(prompt, systemInstruction);
      let content = '';
      for await (const chunk of stream) {
        content += chunk;
        setGeneratedCode(content);
      }
    } catch(e) {
      console.error(e);
      setError(`Failed to optimize HTML: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 font-display flex items-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-600" />
          SEO Optimizer
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Existing HTML (Non-SEO Code)</label>
            <textarea 
              rows={8}
              className="w-full p-4 font-mono text-sm rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              placeholder="Paste your existing messy or non-seo Elementor HTML here..."
              value={existingHtml}
              onChange={e => setExistingHtml(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Focus Keyword</label>
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                placeholder="The main keyword to optimize for..."
                value={focusKeyword}
                onChange={e => setFocusKeyword(e.target.value)}
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:col-span-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
                <input 
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                  placeholder="e.g., Shop owners & contractors"
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Target Location</label>
                <input 
                  className="w-full p-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                  placeholder="e.g., Trichy, Tamil Nadu, India"
                  value={targetLocation}
                  onChange={e => setTargetLocation(e.target.value)}
                />
              </div>
            </div>
            
            <div>
               <label className="block text-sm font-semibold text-slate-700 mb-1">Image URLs (Optional)</label>
               <textarea 
                  rows={2}
                  className="w-full p-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                  placeholder="Paste list of image URLs..."
                  value={imageUrls}
                  onChange={e => setImageUrls(e.target.value)}
                />
            </div>
            
             <div>
               <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-semibold text-slate-700">External Links (Optional)</label>
                 <LinkUpload type="external" onExtract={(t) => setExternalLinks(prev => prev ? prev + '\n' + t : t)} />
               </div>
               <textarea 
                  rows={3}
                  className="w-full p-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                  placeholder="Relevant external contexts/links. Or upload a file."
                  value={externalLinks}
                  onChange={e => setExternalLinks(e.target.value)}
                />
            </div>

            <div className="md:col-span-2">
               <div className="flex justify-between items-center mb-1">
                 <label className="block text-sm font-semibold text-slate-700">Internal Links (Optional)</label>
                 <LinkUpload type="internal" onExtract={(t) => setInternalLinks(prev => prev ? prev + '\n' + t : t)} />
               </div>
               <textarea 
                  rows={3}
                  className="w-full p-3 text-sm rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 transition-colors"
                  placeholder="Relevant internal targets or specific URLs inside your site. Or upload a file."
                  value={internalLinks}
                  onChange={e => setInternalLinks(e.target.value)}
                />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-4">
             <button 
                onClick={() => handleOptimize('wordpress')}
                disabled={isGenerating || !existingHtml || !focusKeyword}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-xl font-bold text-base hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code className="w-5 h-5" />}
                Generate for WordPress
              </button>
              <button 
                onClick={() => handleOptimize('blogger')}
                disabled={isGenerating || !existingHtml || !focusKeyword}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-bold text-base hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Generate for Google Blogger
              </button>
          </div>
        </div>
      </div>

      {(generatedCode || isGenerating) && (
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
           <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
             <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-400" />
                Optimized Output {generatedPlatform && <span className="text-sm font-normal text-slate-400">({generatedPlatform === 'wordpress' ? 'WordPress' : 'Google Blogger'})</span>}
             </h3>
             {generatedCode && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const blob = new Blob([generatedCode], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `optimized-${focusKeyword.replace(/\s+/g, '-') || 'article'}.html`;
                    link.click();
                  }}
                  className="flex items-center gap-2 text-sm bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition"
                  title="Download HTML Document"
                >
                  <FileDown className="w-4 h-4" /> Download HTML
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 text-sm bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
             )}
           </div>
           <div className="p-6 overflow-y-auto max-h-[800px] prose prose-invert max-w-none">
              <ReactMarkdown>{generatedCode}</ReactMarkdown>
           </div>
        </div>
      )}
    </div>
  );
}
