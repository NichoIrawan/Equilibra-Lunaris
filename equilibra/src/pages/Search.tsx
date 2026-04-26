import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, ChevronLeft } from 'lucide-react';
import { useProjects } from '../controllers/useProjects';
import { taskService } from '../services/taskService';
import { SurfaceCard } from '../design-system/SurfaceCard';
import { Badge } from '../design-system/Badge';
import { useAuth } from '../auth/useAuth';
import type { Task } from '../models';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { leadProjects, collaboratingProjects, loading: projectsLoading } = useProjects();
  const allProjects = [...leadProjects, ...collaboratingProjects];
  
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = React.useState(true);
  
  React.useEffect(() => {
    if (user?.db_user?.id) {
      taskService.getMyTasks(user.db_user.id).then(t => {
        setTasks(t);
        setTasksLoading(false);
      });
    } else {
      setTasksLoading(false);
    }
  }, [user]);

  const filteredProjects = useMemo(() => {
    if (!query) return [];
    return allProjects.filter(p => p.name?.toLowerCase().includes(query.toLowerCase()));
  }, [allProjects, query]);

  const filteredTasks = useMemo(() => {
    if (!query) return [];
    return tasks.filter(t => t.title?.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, query]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value;
      if (val.trim()) {
        setSearchParams({ q: val });
      } else {
        setSearchParams({});
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-lg bg-[#151A22] border border-[#374151] flex items-center justify-center text-slate-400 hover:text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 max-w-xl relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            defaultValue={query}
            onKeyDown={handleSearch}
            placeholder="Search projects and tasks..." 
            className="w-full bg-[#151A22] border border-[#374151] rounded-lg pl-10 pr-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#3B82F6]" 
          />
        </div>
      </div>

      <div>
        <h1 className="text-[24px] font-bold text-white mb-2">Search Results {query ? `for "${query}"` : ''}</h1>
        <p className="text-slate-400 text-[14px]">Found {filteredProjects.length} projects and {filteredTasks.length} tasks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SurfaceCard title="Projects" subtitle={`${filteredProjects.length} matching projects`}>
          {projectsLoading ? (
            <div className="p-4 text-slate-500">Loading...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-[#374151] rounded-xl">No projects found.</div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="p-4 rounded-xl bg-[#151A22] border border-[#374151] hover:border-[#3B82F6] cursor-pointer transition-all"
                >
                  <h3 className="text-white font-bold text-[14px]">{p.name}</h3>
                  <p className="text-slate-400 text-[12px] mt-1 line-clamp-2">{p.issue || 'No description'}</p>
                  <div className="mt-3">
                     <Badge variant={p.status === 'Blocked' || p.status === 'Stalled' ? 'critical' : 'default'} className="!text-[10px]">{p.status || 'Active'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard title="My Tasks" subtitle={`${filteredTasks.length} matching tasks`}>
          {tasksLoading ? (
            <div className="p-4 text-slate-500">Loading...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-[#374151] rounded-xl">No tasks found.</div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => navigate(`/projects/${t.project_id}`)}
                  className="p-4 rounded-xl bg-[#151A22] border border-[#374151] hover:border-[#3B82F6] cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-bold text-[14px]">{t.title}</h3>
                    <Badge variant={t.weight > 5 ? 'warning' : 'default'} className="!text-[10px]">{t.type}</Badge>
                  </div>
                  <p className="text-slate-400 text-[12px] mt-1 line-clamp-2">{t.description || 'No description'}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" className="!text-[10px]">{t.status || 'TODO'}</Badge>
                    <span className="text-slate-500 text-[10px]">Project #{t.project_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
};
