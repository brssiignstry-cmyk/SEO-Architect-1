import React, { useState } from 'react';
import { Type } from '@google/genai';
import { getGeminiResponse, getGeminiStream } from '../services/geminiService';
import { Loader2, PlusCircle, Link as LinkIcon, Image as ImageIcon, Send, Code, Copy, CheckCircle, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Props {
  mode: 'STATIC_PAGE' | 'SINGLE_POST';
}

interface OutlineSection {
  title: string;
  description: string;
}

const STATIC_PAGE_TYPES = [
  'home', 'about us', 'why us', 'portfolio', 'testimonials', 'our services', 
  'blogs', 'contact us', 'meet our teams', 'terms and conditions', 
  'privacy policy', 'disclaimer', 'cookie policy', 'warranty policy'
];

export default function ArticleGenerator({ mode }: Props) {
  const [pageType, setPageType] = useState(STATIC_PAGE_TYPES[0]);
  const [blogTitle, setBlogTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');

  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(Array(13).fill(''));
  const [externalLinks, setExternalLinks] = useState('');
  const [internalLinks, setInternalLinks] = useState('');

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerateOutline = async () => {
    setIsGeneratingOutline(true);
    const identifier = mode === 'STATIC_PAGE' ? `Page Type: ${pageType}` : `Blog Title: ${blogTitle}`;
    const prompt = `Based on the following request, generate an outline with exactly 13 sections for a WordPress article.
    ${identifier}
    Description: ${description}
    Focus Keyword: ${focusKeyword}
    
    Structure the 13 sections as follows:
    Section 1: Hero Section
    Section 2-12: Content Sections (based on user intent)
    Section 13: Strong CTA + Footer
    `;

    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Section Title" },
          description: { type: Type.STRING, description: "Section Description" }
        },
        required: ["title", "description"]
      }
    };

    try {
      const response = await getGeminiResponse(prompt, 'You are an expert SEO architect.', true, schema);
      const parsed = JSON.parse(response);
      // Ensure exactly 13 sections
      if (Array.isArray(parsed)) {
        setOutline(parsed.slice(0, 13));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to generate outline.');
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateImagePrompts = async () => {
    if (outline.length === 0) return;
    setIsGeneratingPrompts(true);
    
    const prompt = `Generate exactly 13 image prompts based on this outline:
    ${JSON.stringify(outline, null, 2)}
    
    Requirement: 1 Featured Image (Section 1) and 12 Section-based images.
    Return only a JSON array of 13 strings. Each string is a detailed DALL-E/Midjourney style image prompt targeting Trichy/Tamil Nadu context if requested.`;

    const schema = {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    };

    try {
      const response = await getGeminiResponse(prompt, 'You are an expert AI image prompt engineer.', true, schema);
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
         setImagePrompts(parsed.slice(0, 13));
      }
    } catch(e) {
      console.error(e);
      alert('Failed to generate image prompts.');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateArticle = async () => {
    setIsGeneratingArticle(true);
    setGeneratedArticle('');
    
    const identifier = mode === 'STATIC_PAGE' ? `Page Type: ${pageType}` : `Blog Title: ${blogTitle}`;
    
    const systemInstruction = `You are a world-class SEO Architect and Elementor Code Generator for WordPress.
    Write an article of 1800-3200+ words based exactly on the provided 13 section outline.
    
    CONDITIONS:
    1. If image URLs empty: auto fetch relevant images (Unsplash/Pexels/Pixabay/SVG)
    2. If external links empty: auto generate minimum 25 anchor texts with trusted sources (Google, Bing, Wikipedia, etc).
    3. If internal links empty: auto link to standard pages (/about-us/, /contact/, etc).

    RULES:
    CONTENT: 
    - Table of Contents immediately after Featured Image.
    - H1 used only once. Proper H2, H3, H4 hierarchy. Short paragraphs (5-8 lines).
    - Tone: Conversational, targeting Trichy shop owners & contractors.
    - Formatting: Bullet points, numbers, bold important phrases. Real images. YouTube embeds if relevant.
    - CTA: WhatsApp button & Email button.
    - Comparison: Include a Pros & Cons table and a Comparison table.

    SEO RULES 2026:
    - Keyword density: 0.6% - 1.0%
    - Placement: Title, Meta description, H1, First 100 words, >= 1 H2 or H3, every 150-200 words, final paragraph.
    - Internal links: min 10. External: min 20-25. Use rel="nofollow" where needed.
    - UNIQUE content showing real experience (E-E-A-T), local Trichy/Tamil Nadu, India references.

    FINAL OUTPUT FORMAT:
    Output the exact following format using markdown blocks for the code.
    Title (55-65 chars): <title>
    Meta Description (150-160 chars): <meta>
    Labels: <labels>
    Focus Keyword: <keyword>
    Permalink: <permalink>

    Then output the FULL Elementor compatible HTML code in an html markdown block (\`\`\`html)
    Include 13 sections properly structured.
    `;

    const prompt = `
    Request Context:
    ${identifier}
    Description: ${description}
    Focus Keyword: ${focusKeyword}
    
    Outline:
    ${JSON.stringify(outline, null, 2)}
    
    User Provided Image URLs (Index matched to section):
    ${JSON.stringify(imageUrls)}
    
    User Provided External Links Input:
    ${externalLinks || 'NONE - Apply Condition 2'}
    
    User Provided Internal Links Input:
    ${internalLinks || 'NONE - Apply Condition 3'}
    `;

    try {
      const stream = getGeminiStream(prompt, systemInstruction);
      let content = '';
      for await (const chunk of stream) {
        content += chunk;
        setGeneratedArticle(content);
      }
    } catch(e) {
      console.error(e);
      alert('Failed to generate article.');
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {mode === 'STATIC_PAGE' ? 'Static Page Generator' : 'Single Post Generator'}
        </h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {mode === 'STATIC_PAGE' ? 'Select Page Type' : 'Blog Title'}
            </label>
            {mode === 'STATIC_PAGE' ? (
              <select 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={pageType}
                onChange={e => setPageType(e.target.value)}
              >
                {STATIC_PAGE_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            ) : (
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter blog title..."
                value={blogTitle}
                onChange={e => setBlogTitle(e.target.value)}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Title: Description</label>
            <textarea 
              rows={4}
              className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter comprehensive description (accepts 1000+ words)..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Focus Keyword</label>
            <input 
              className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Short-tail or long-tail keyword..."
              value={focusKeyword}
              onChange={e => setFocusKeyword(e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={handleGenerateOutline}
              disabled={isGeneratingOutline || (!pageType && !blogTitle) || !description || !focusKeyword}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
            >
              {isGeneratingOutline ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              Generate Outline
            </button>
            <button 
              onClick={handleGenerateImagePrompts}
              disabled={isGeneratingPrompts || outline.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-1"
            >
              {isGeneratingPrompts ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              Generate Image Prompts
            </button>
          </div>
        </div>
      </div>

      {outline.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center justify-between">
            Generated Outline (13 Sections)
          </h3>
          <div className="space-y-3">
            {outline.map((sec, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                <h4 className="font-bold text-slate-800 text-sm">
                  {i === 0 ? 'Section 1: Hero' : i === 12 ? 'Section 13: Footer + CTA' : `Section ${i + 1}`} - {sec.title}
                </h4>
                <p className="text-slate-600 text-sm mt-1">{sec.description}</p>
                
                {imagePrompts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Image Prompt</p>
                    <p className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg italic">
                      "{imagePrompts[i]}"
                    </p>
                    <div className="flex gap-3 items-center">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Image URL (optional)" 
                        className="w-full text-sm p-2 rounded-lg border border-slate-300 bg-white"
                        value={imageUrls[i]}
                        onChange={e => {
                          const newUrls = [...imageUrls];
                          newUrls[i] = e.target.value;
                          setImageUrls(newUrls);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {outline.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
           <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-blue-500"/> Linking Strategy
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">External Links Context (Optional)</label>
              <textarea 
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-slate-50 placeholder:text-slate-400"
                placeholder="Paste CSV, lists, or context for external links..."
                value={externalLinks}
                onChange={e => setExternalLinks(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Internal Links Context (Optional)</label>
              <textarea 
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-slate-50 placeholder:text-slate-400"
                placeholder="Paste CSV, lists, or context for internal links..."
                value={internalLinks}
                onChange={e => setInternalLinks(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
             <button 
                onClick={handleGenerateArticle}
                disabled={isGeneratingArticle}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGeneratingArticle ? <Loader2 className="w-6 h-6 animate-spin" /> : <Code className="w-6 h-6" />}
                Generate Article Code for WordPress
              </button>
          </div>
        </div>
      )}

      {(generatedArticle || isGeneratingArticle) && (
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
           <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
             <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Final Output
             </h3>
             {generatedArticle && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedArticle);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 text-sm bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-700 transition"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
             )}
           </div>
           <div className="p-6 overflow-y-auto max-h-[800px] prose prose-invert max-w-none">
              <ReactMarkdown>{generatedArticle}</ReactMarkdown>
           </div>
        </div>
      )}

    </div>
  );
}
