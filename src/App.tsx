import React, { useState } from 'react';
import { Header } from './components/Header';
import { TVSimulator } from './components/TVSimulator/TVSimulator';
import { CustomerPortal } from './components/CustomerPortal/CustomerPortal';
import { AdminPanel } from './components/AdminPanel/AdminPanel';
import { CodeExplorer } from './components/CodeExplorer/CodeExplorer';
import { ArchitectureView } from './components/ArchitectureView/ArchitectureView';
import { SetupDatabase } from './components/SetupDatabase';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'customer-portal' | 'admin' | 'code' | 'architecture' | 'setup-db'>('setup-db');

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-[#6A00FF] selection:text-white">
      {/* Top Header Navigation */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Body */}
      <main className="flex-1">
        {activeTab === 'simulator' && (
          <TVSimulator onOpenCustomerPortal={() => setActiveTab('customer-portal')} />
        )}
        {activeTab === 'customer-portal' && <CustomerPortal />}
        {activeTab === 'admin' && <AdminPanel />}
        {activeTab === 'code' && <CodeExplorer />}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'setup-db' && <SetupDatabase />}
      </main>

      {/* Footer Info Bar */}
      <footer className="bg-[#111111] border-t border-white/10 py-2 px-4 text-center text-xs text-gray-500 font-mono flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#9C4DFF] animate-pulse" />
          <span>MÓDULO 18 — PORTAL DO USUÁRIO FINAL, COMPRA DE LICENÇAS & ARQUITETURA DEFINITIVA CONCLUÍDO</span>
        </div>
        <div>
          <span>Android TV • Fire TV • Portal do Cliente • Painel Admin Web SaaS</span>
        </div>
      </footer>
    </div>
  );
}
