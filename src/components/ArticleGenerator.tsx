import React, { useState } from 'react';
import { Type } from '@google/genai';
import { getGeminiResponse, getGeminiStream, generateImageWithGemini } from '../services/geminiService';
import { Loader2, PlusCircle, Link as LinkIcon, Image as ImageIcon, Send, Code, Copy, CheckCircle, FileText, Wand2, Download, FileDown, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LinkUpload } from './LinkUpload';
import { ContentUpload } from './ContentUpload';

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
  const [targetLocation, setTargetLocation] = useState('Trichy, Tamil Nadu, India');
  const [targetAudience, setTargetAudience] = useState('Shop owners & contractors');

  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>(Array(13).fill(''));
  
  // New state for rendering the actual visual images generated via AI
  const [generatedImages, setGeneratedImages] = useState<string[]>(Array(13).fill(''));
  const [isGeneratingImageMap, setIsGeneratingImageMap] = useState<Record<number, boolean>>({});

  const [externalLinks, setExternalLinks] = useState('');
  const [internalLinks, setInternalLinks] = useState('');

  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlatform, setGeneratedPlatform] = useState<'wordpress' | 'blogger' | null>(null);

  const handleGenerateOutline = async () => {
    setIsGeneratingOutline(true);
    setGeneratedImages(Array(13).fill('')); // Reset generated images on new outline
    setError(null);
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
      setError(`Failed to generate outline: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateImagePrompts = async () => {
    if (outline.length === 0) return;
    setIsGeneratingPrompts(true);
    setGeneratedImages(Array(13).fill('')); // Reset generated images on new prompts
    setError(null);
    
    const prompt = `Generate exactly 13 image prompts based on this outline:
    ${JSON.stringify(outline, null, 2)}
    
    Requirement: 1 Featured Image (Section 1) and 12 Section-based images.
    Return only a JSON array of 13 strings. Each string is a detailed DALL-E/Midjourney style image prompt targeting ${targetLocation || 'general'} context if requested.`;

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
      setError(`Failed to generate image prompts: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateVisualImage = async (index: number) => {
    const prompt = imagePrompts[index];
    if (!prompt) return;

    setIsGeneratingImageMap(prev => ({ ...prev, [index]: true }));
    setError(null);
    try {
      const imageBase64 = await generateImageWithGemini(prompt);
      const newImages = [...generatedImages];
      newImages[index] = imageBase64;
      setGeneratedImages(newImages);
      // DO NOT assign base64 to imageUrls. This avoids passing 100KB strings to the text model
      // and lets the text model use native WP placeholder references instead.
    } catch (e) {
      console.error(e);
      setError(`Failed to generate image from AI: ${e instanceof Error ? e.message : 'DALL-E call unsuccessful.'}`);
    } finally {
      setIsGeneratingImageMap(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadImage = (index: number) => {
    const dataUrl = generatedImages[index];
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `section-${index + 1}-image.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateArticle = async (platform: 'wordpress' | 'blogger') => {
    setIsGeneratingArticle(true);
    setGeneratedArticle('');
    setGeneratedPlatform(platform);
    setError(null);
    
    const identifier = mode === 'STATIC_PAGE' ? `Page Type: ${pageType}` : `Blog Title: ${blogTitle}`;
    
    let platformSpecificInstructions = '';
    if (platform === 'wordpress') {
      platformSpecificInstructions = `You are a world-class SEO Architect and Elementor Code Generator for WordPress.
You are generating a complete SEO-optimized, highly-designed WordPress article/page based on the provided inputs.

SECTION 7: MEDIA RULES
Each section must include a relevant image. Follow the explicit 'Image Directives' strictly.
DO NOT use Base64 strings. Use native WP paths. DO NOT include any YouTube video embeds.
If no directive, automatically insert placeholders from Unsplash/Pexels/Pixabay/Freepik.

SECTION 10: HTML OUTPUT REQUIREMENTS
- Clean HTML + inline CSS (or grouped <style> block). NO external CSS file dependencies. Elementor Custom HTML widget compatible. Use class-based styling.
`;
    } else {
      platformSpecificInstructions = `You are a world-class SEO Architect and HTML Code Generator for Google Blogger.
You are generating a complete SEO-optimized, highly-designed Blogger post/page based on the provided inputs.

SECTION 7: MEDIA RULES
Each section must include a relevant image. Follow the explicit 'Image Directives' strictly.
DO NOT use Base64 strings. DO NOT use WordPress (/wp-content/) paths. Use standard HTTP Web image URLs. DO NOT include any YouTube video embeds.
If no directive, automatically insert placeholders from Unsplash/Pexels/Pixabay via standard https formats.

SECTION 10: HTML OUTPUT REQUIREMENTS
- Google Blogger Specific Rules: DO NOT use WordPress shortcodes. DO NOT rely on heavy external CSS or Elementor classes. Use standard clean HTML5 and highly-compatible inline CSS or a single <style> block that is perfectly compatible with Google Blogger's editor. Maximize semantic HTML.
`;
    }

    const systemInstruction = `${platformSpecificInstructions}

ARTICLE WRITING & SEO ENGINE:

SECTION 1: KEYWORD STRATEGY
- Use ONLY ONE focus keyword.
- Generate natural keyword variations (location-based, plural/singular, semantic).

SECTION 2: METADATA GENERATION
Generate BEFORE article:
1. Title: 55–65 characters, starts with focus keyword, includes power words (Best, 2026, Guide, Price, Top, Ultimate).
2. Meta Description: 150–160 characters, include keyword, benefit + CTA.
3. Permalink: Short, clean, keyword-based.
4. Labels: 3–6 relevant tags.

SECTION 3: ARTICLE STRUCTURE
Generate EXACTLY 13 sections:
1. Hero Section (Intro)
2–12. Content Sections
13. Strong CTA + Footer

SECTION 4: CONTENT RULES
- Total word count: 1800–3200+ words.
- Tone: conversational, human-like.
- Target audience: ${targetAudience || 'local business owners'}.
- Avoid generic AI writing.
- Paragraphs: 5–8 lines max, clear and readable.
- Use: Bullet points, Numbered lists, Bold key phrases.

SECTION 5: HEADING STRUCTURE
- H1 → Only once
- H2 → Main sections
- H3/H4 → Subsections
- No skipping hierarchy

SECTION 6: TABLE OF CONTENTS
- Add immediately after featured image
- Auto-linked anchor navigation

SECTION 8: KEYWORD PLACEMENT
Must include keyword in: Title, Meta description, H1, First 100 words, At least one H2 or H3, Every 150–200 words, Final paragraph.
Density: 0.6% – 1%. Avoid over-optimization.

SECTION 9: INTERNAL LINKING
- Minimum 10 internal links. Follow User Provided Internal Links exactly.
- If none provided, auto link to standard pages (home, about us, services, blog, contact, privacy policy, terms, disclaimer, cookie policy, warranty policy).

SECTION 10: EXTERNAL LINKING
- Target exactly 25 external links across the 13 sections (exactly 2 new external links per section) related to anchor texts.
- If User Provided External Links exist, use them.
- If none provided, auto-generate valid external links:
  - SOURCING RULE: Use Wikipedia for ONLY 2 sections max (up to 4 links total from Wikipedia).
  - All other external links MUST be from unique, valid, diverse sources (e.g., Google, Bing, Yahoo results and other real, highly-relevant website pages).
  - Do not repeat domains excessively. Ensure anchor texts match context naturally.
  - Use rel="nofollow" where required.

SECTION 11: ADVANCED CONTENT ELEMENTS
Include where relevant: Comparison table, Pros & Cons table, FAQ section (minimum 10–15 FAQs), Real-life examples, Use-case explanations.

SECTION 12: CTA (MANDATORY)
Include strong CTA: WhatsApp button and Email contact button.

SECTION 13: E-E-A-T OPTIMIZATION
- Human-written feel, local references (e.g., ${targetLocation || 'Trichy, Tamil Nadu, India'}).
- Trust signals: experience tone, real-world context.

UI DESIGN & VISUAL EXPERIENCE ENGINE:

SECTION 1: DESIGN STYLE
- Modern, clean, premium business website style. High-converting landing page look. Avoid plain layouts.

SECTION 2: COLOR THEME
- Generate a professional color palette: Primary, Secondary, Accent, Background (light/gradient), Text colors. Apply consistently.

SECTION 3: LAYOUT STRUCTURE
- Proper spacing (padding/margin), max-width container, Grid/Flex layout, clear visual hierarchy. Use Cards, Columns, Feature blocks, Icon+Text.

SECTION 4: COMPONENT DESIGN
- Buttons: Rounded/sharp, gradient/solid, hover effects (color shift/glow/scale).
- Cards: Shadows, hover animation (lift), max-width/border-radius.
- Sections: Alternate backgrounds, divider shapes (optional).

SECTION 5: ANIMATIONS & INTERACTIONS (CSS ONLY)
- Hover Effects: Buttons scale/color change, Cards translateY/shadow.
- Fade/Float animations using CSS transition/keyframes. (e.g., transition: all 0.3s ease;)

SECTION 6: ICONS & VISUALS
- Use SVG/Bootstrap-style vector icons where relevant. Keep consistent.

SECTION 7: RESPONSIVE DESIGN
- Mobile-friendly. Stack columns on small screens. Maintain readability.

SECTION 8: HERO SECTION
- Strong H1, Subheading, CTA button, Background (image/gradient/overlay).

SECTION 9: CTA DESIGN
- WhatsApp (green style), Email (contrast color). Strong hover animations.

SECTION 11: BLOG POST/PAGE DESIGN
- Clean reading layout, good line spacing, highlighted headings, content blocks, styled FAQs, styled comparison tables.

SECTION 12: VISUAL CONSISTENCY
- Maintain same style across all 13 sections. Premium look. Content+Design must work together.

FINAL RULE:
Content + Design must work together. Output must look like a professionally designed website section, not a plain HTML article.

SECTION 14: OUTPUT FORMAT
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
[Followed immediately by the FULL platform-compatible HTML code]

DO NOT output the metadata outside of this HTML comment block.`;

    const prompt = `
    Request Context:
    ${identifier}
    Description: ${description}
    Focus Keyword: ${focusKeyword}
    
    Outline:
    ${JSON.stringify(outline, null, 2)}
    
    Image Directives:
    ${imageUrls.map((url, i) => {
      if (url) return `Section ${i + 1}: Use exactly this URL "${url}"`;
      if (generatedImages[i]) return `Section ${i + 1}: Image will be uploaded correctly. Use WP placeholder (e.g., src="/wp-content/uploads/2026/04/section-${i+1}-image.jpg").`;
      return `Section ${i + 1}: Auto-fetch a relevant image from Unsplash/Pexels/Pixabay via standard placeholder.`;
    }).join('\n')}
    
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
      setError(`Failed to generate article: ${e instanceof Error ? e.message : 'Stream failed.'}`);
    } finally {
      setIsGeneratingArticle(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-red-800 text-sm">Action Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-semibold text-slate-700">Title: Description</label>
              <ContentUpload onExtract={(text) => setDescription(prev => prev ? prev + '\n\n' + text : text)} />
            </div>
            <textarea 
              rows={4}
              className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter comprehensive description (accepts 1000+ words). Or upload a file context."
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Shop owners & contractors"
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Location</label>
              <input 
                className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Trichy, Tamil Nadu, India"
                value={targetLocation}
                onChange={e => setTargetLocation(e.target.value)}
              />
            </div>
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Image Prompt (Editable)</p>
                    <textarea 
                      className="w-full text-sm bg-blue-50 text-blue-800 p-3 rounded-lg italic border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                      value={imagePrompts[i]}
                      onChange={e => {
                        const newPrompts = [...imagePrompts];
                        newPrompts[i] = e.target.value;
                        setImagePrompts(newPrompts);
                      }}
                    />
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleGenerateVisualImage(i)}
                        disabled={isGeneratingImageMap[i]}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition disabled:opacity-50"
                      >
                        {isGeneratingImageMap[i] ? <Loader2 className="w-4 h-4 animate-spin" /> : (generatedImages[i] ? <RefreshCw className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />)}
                        {generatedImages[i] ? 'Regenerate Built-In Image' : 'Generate AI Image'}
                      </button>
                    </div>

                    {generatedImages[i] && (
                      <div className="mt-3 max-w-xs relative border border-slate-200 rounded-lg overflow-hidden group">
                        <img src={generatedImages[i]} alt={`Section ${i+1}`} className="w-full h-auto block" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => handleDownloadImage(i)}
                            className="bg-white text-slate-900 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-50 shadow-lg"
                          >
                            <Download className="w-4 h-4" /> Download Image
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 items-center mt-3 bg-slate-100 p-3 rounded-xl border border-slate-200">
                      <ImageIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                      <div className="w-full">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Final Media URL (Required for Article)</label>
                        <input 
                          type="text" 
                          placeholder="Paste WordPress Media URL here (Overrides AI placeholder)" 
                          className="w-full text-sm p-2 rounded-md border border-slate-300 bg-white"
                          value={imageUrls[i]}
                          onChange={e => {
                            const newUrls = [...imageUrls];
                            newUrls[i] = e.target.value;
                            setImageUrls(newUrls);
                          }}
                        />
                      </div>
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
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">External Links Context (Optional)</label>
                <LinkUpload 
                  type="external" 
                  onExtract={(text) => setExternalLinks(prev => prev ? prev + '\n' + text : text)} 
                />
              </div>
              <textarea 
                rows={4}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-slate-50 placeholder:text-slate-400"
                placeholder="Paste CSV, lists, or context for external links... Or use the Upload button."
                value={externalLinks}
                onChange={e => setExternalLinks(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Internal Links Context (Optional)</label>
                <LinkUpload 
                  type="internal" 
                  onExtract={(text) => setInternalLinks(prev => prev ? prev + '\n' + text : text)} 
                />
              </div>
              <textarea 
                rows={4}
                className="w-full text-sm p-3 rounded-lg border border-slate-300 bg-slate-50 placeholder:text-slate-400"
                placeholder="Paste CSV, lists, or context for internal links... Or use the Upload button."
                value={internalLinks}
                onChange={e => setInternalLinks(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-4">
             <button 
                onClick={() => handleGenerateArticle('wordpress')}
                disabled={isGeneratingArticle}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl font-bold text-base hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGeneratingArticle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code className="w-5 h-5" />}
                Generate for WordPress
              </button>
              <button 
                onClick={() => handleGenerateArticle('blogger')}
                disabled={isGeneratingArticle}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl font-bold text-base hover:bg-orange-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isGeneratingArticle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Generate for Google Blogger
              </button>
          </div>
        </div>
      )}

      {(generatedArticle || isGeneratingArticle) && (
        <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
           <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
             <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Final Output {generatedPlatform && <span className="text-sm font-normal text-slate-400">({generatedPlatform === 'wordpress' ? 'WordPress' : 'Google Blogger'})</span>}
             </h3>
             {generatedArticle && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    const blob = new Blob([generatedArticle], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${pageType.replace(/\s+/g, '-')}-article.html`;
                    link.click();
                  }}
                  className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                  title="Download HTML Document"
                >
                  <FileDown className="w-4 h-4" /> Download HTML
                </button>
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
              </div>
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
