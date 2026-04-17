import { useState } from 'react';
import { LayoutDashboard, FileText, FileCode, CheckCircle, Search, Menu, Settings } from 'lucide-react';
import ArticleGenerator from './components/ArticleGenerator';
import SeoOptimizer from './components/SeoOptimizer';
import SeoTitleGenerator from './components/SeoTitleGenerator';

export type TabType = 'STATIC_PAGE' | 'SINGLE_POST' | 'SEO_OPTIMIZER' | 'SEO_TITLE';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('STATIC_PAGE');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">SEO Architect</h1>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-slate-100 rounded-md">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col md:sticky md:top-0 md:h-screen md:overflow-y-auto z-10`}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
            SEO Architect
          </h1>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-2 px-1">WordPress Code Gen</p>
        </div>

        <nav className="flex-1 px-4 pb-6 space-y-1 mt-4 md:mt-0">
          <MenuButton 
            active={activeTab === 'STATIC_PAGE'} 
            onClick={() => {setActiveTab('STATIC_PAGE'); setSidebarOpen(false);}} 
            icon={<FileText className="w-5 h-5" />} 
            label="Static Page Generator" 
          />
          <MenuButton 
            active={activeTab === 'SINGLE_POST'} 
            onClick={() => {setActiveTab('SINGLE_POST'); setSidebarOpen(false);}} 
            icon={<FileCode className="w-5 h-5" />} 
            label="Single Post Generator" 
          />
          <MenuButton 
            active={activeTab === 'SEO_OPTIMIZER'} 
            onClick={() => {setActiveTab('SEO_OPTIMIZER'); setSidebarOpen(false);}} 
            icon={<CheckCircle className="w-5 h-5" />} 
            label="SEO Optimizer" 
          />
          <MenuButton 
            active={activeTab === 'SEO_TITLE'} 
            onClick={() => {setActiveTab('SEO_TITLE'); setSidebarOpen(false);}} 
            icon={<Search className="w-5 h-5" />} 
            label="SEO Title Generator" 
          />
        </nav>
        
        <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
          v2026 AI Generation
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50 relative min-w-0">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {activeTab === 'STATIC_PAGE' && <ArticleGenerator mode="STATIC_PAGE" />}
          {activeTab === 'SINGLE_POST' && <ArticleGenerator mode="SINGLE_POST" />}
          {activeTab === 'SEO_OPTIMIZER' && <SeoOptimizer />}
          {activeTab === 'SEO_TITLE' && <SeoTitleGenerator />}
        </div>
      </main>
    </div>
  );
}

function MenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-left
        ${active 
          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-500/20' 
          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        }
      `}
    >
      <span className={`${active ? 'text-blue-600' : 'text-slate-400'}`}>{icon}</span>
      {label}
    </button>
  );
}
