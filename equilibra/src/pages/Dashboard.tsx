import React from 'react';
import {
  Search,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Bell,
} from 'lucide-react';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { Button } from '../design-system/Button';
import { UrgentActions } from '../components/dashboard/UrgentActions';
import { MyQueue } from '../components/dashboard/MyQueue';
import { CriticalWatchlist } from '../components/dashboard/CriticalWatchlist';
import { ScheduleCalendar } from '../components/dashboard/ScheduleCalendar';
import { useAuth } from '../auth/useAuth';
import { getDisplayName } from '../auth/displayName';
import { useProjects } from '../controllers/useProjects';

import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { leadProjects, collaboratingProjects } = useProjects();
  const displayName = user ? getDisplayName(user) : '…';

  // Get first project for calendar display
  const allProjects = [...leadProjects, ...collaboratingProjects];
  const primaryProject = allProjects.length > 0 ? allProjects[0] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
      {/* Header & Banner */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[#3B82F6] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-pulse" /> Overview • Personal Space
            </span>
            <h1 className="text-[32px] font-bold text-white leading-tight">Halo, {displayName}.</h1>
            <p className="text-[14px] italic text-slate-400 mt-1">Hari ini terasa seimbang.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input placeholder="Search..." className="bg-[#151A22] border border-[#374151] rounded-lg pl-10 pr-4 py-2.5 text-[12px] text-white w-64 focus:outline-none focus:border-[#3B82F6]" />
            </div>
            <button className="p-2.5 rounded-lg bg-[#151A22] border border-[#374151] text-slate-400 hover:text-white"><Bell size={18} /></button>
          </div>
        </div>

        {/* Action Banner (Matches Reference layout) */}
        <div className="bg-[#151A22] border border-[#374151] rounded-2xl p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <button className="w-8 h-8 rounded-lg bg-[#1F2937] text-slate-400 flex items-center justify-center hover:text-white border border-[#374151]"><ChevronLeft size={16} /></button>
            <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 p-3 rounded-xl flex-shrink-0">
              <Zap className="text-[#3B82F6]" size={24} />
            </div>
            <div>
              <h4 className="text-white font-medium text-[16px]">Meeting <span className="text-[#3B82F6] italic font-semibold">Sprint Review</span> besok belum memiliki agenda. Generate otomatis?</h4>
              <p className="text-slate-400 text-[10px] mt-1.5 uppercase font-bold tracking-widest">Equilibra Assistant • Meeting Prep</p>
            </div>
            <button className="w-8 h-8 rounded-lg bg-[#1F2937] text-slate-400 flex items-center justify-center hover:text-white border border-[#374151]"><ChevronRight size={16} /></button>
          </div>
          <Button variant="white">Generate Agenda</Button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Calendar - Left Column */}
        <div className="xl:col-span-8 flex flex-col h-full relative z-10">
          {primaryProject ? (
            <ScheduleCalendar
              projectId={primaryProject.id}
              onTaskClick={(task) => navigate(`/projects/${task.project_id}`)}
            />
          ) : (
            <SurfaceCard title="Schedule Sync" subtitle="Global Timeline" className="h-full flex flex-col">
              <div className="flex items-center justify-center flex-1 text-slate-400">
                <p>No projects found. Create a project to see scheduled tasks.</p>
              </div>
            </SurfaceCard>
          )}
        </div>

        {/* Action Columns - Right Column */}
        <div className="xl:col-span-4 space-y-6 flex flex-col min-h-0 max-h-[750px] relative z-0">
          <UrgentActions className="flex-1 min-h-0" onNavigateProject={(id) => navigate(`/projects/${id}`)} />
          <MyQueue className="flex-1 min-h-0" />
        </div>
      </div>

      {/* Critical Watchlist - Bottom Row */}
      <CriticalWatchlist onNavigate={(id) => navigate(`/projects/${id}`)} />
    </div>
  );
};
