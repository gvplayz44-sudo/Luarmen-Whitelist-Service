import React, { useState, useEffect } from 'react';
import { Shield, Key, Users, Zap, FileCode2, Settings, LogOut, Plus, Eye, Trash2, Cog, Check, X, KeyRound, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PlanBadge from './PlanBadge';

const ACCENT = "#facc15";
const ACCENT_DARK = "#eab308";
const GLOW = "0 0 0 1px rgba(250,204,21,0.35), 0 2px 8px -2px rgba(250,204,21,0.35), 0 8px 24px -6px rgba(250,204,21,0.4), 0 16px 48px -12px rgba(250,204,21,0.35)";
const GLOW_SM = "0 0 0 1px rgba(250,204,21,0.35), 0 2px 6px -1px rgba(250,204,21,0.4), 0 6px 16px -4px rgba(250,204,21,0.35)";

interface DashboardProps {
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const [view, setView] = useState("dashboard");
  const [scripts, setScripts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_scripts: 0, total_users: 0, total_downloads: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any>(null);
  const [showLoader, setShowLoader] = useState(false);
  const [selectedScript, setSelectedScript] = useState<string>("");
  const [whitelistUsername, setWhitelistUsername] = useState("");
  
  const isOwner = user?.plan === 'owner';
  const canUpload = user?.plan !== 'free';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [scriptsRes, usersRes, statsRes] = await Promise.all([
        fetch(`/api/scripts?api_key=${user.api_key}`),
        fetch(`/api/owner/all-users?api_key=${user.api_key}`),
        fetch(`/api/stats?api_key=${user.api_key}`),
      ]);
      if (scriptsRes.ok) setScripts((await scriptsRes.json()).scripts || []);
      if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (e) {
      console.error('Failed to load data', e);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('luarmen_user');
    navigate('/');
  };

  const handleNewScript = () => {
    setEditing({ isNew: true, name: "New Script", code: "-- Paste your Lua script here...\nlocal function main()\n\tprint('Hello World!')\nend\nmain()", opts: { freeForAll: false, silent: false, heartbeat: true, lightning: false, v4Loader: true, verified: false } });
  };

  const handleSaveScript = async (data: any) => {
    if (!data.name || !data.code) {
      alert('Please fill in both fields');
      return;
    }
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: user.api_key,
          script_name: data.name,
          source_code: data.code,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert('✅ Script uploaded!');
        setEditing(null);
        loadData();
      } else {
        alert('❌ ' + (result.error || 'Upload failed'));
      }
    } catch (e) {
      alert('❌ Upload failed');
    }
  };

  const handleDeleteScript = async (id: string) => {
    if (!confirm('Delete this script? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/script/${id}?api_key=${user.api_key}`, { method: 'DELETE' });
      if (res.ok) {
        alert('✅ Script deleted');
        loadData();
      } else {
        alert('❌ Failed to delete script');
      }
    } catch (e) {
      alert('❌ Error deleting script');
    }
  };

  const handleGenerateKey = async () => {
    if (!selectedScript) {
      alert('Please select a script');
      return;
    }
    if (!whitelistUsername) {
      alert('Please enter a username');
      return;
    }
    try {
      const res = await fetch('/api/owner/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: user.api_key,
          user_id: whitelistUsername,
          plan: 'premium',
          duration_days: 30,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Key generated and user whitelisted!');
        setWhitelistUsername('');
        loadData();
      } else {
        alert('❌ ' + (data.error || 'Failed to generate key'));
      }
    } catch (e) {
      alert('❌ Error generating key');
    }
  };

  const Sidebar = () => {
    const items = [
      { id: "dashboard", label: "Dashboard", icon: Shield },
      { id: "scripts", label: "Scripts", icon: FileCode2 },
    ];
    
    if (canUpload) {
      items.push({ id: "whitelist", label: "Whitelist", icon: KeyRound });
    }
    
    if (isOwner) {
      items.push({ id: "users", label: "Users", icon: Users });
    }
    
    items.push({ id: "settings", label: "Settings", icon: Settings });

    return (
      <div className="w-72 bg-[#0a0e1a] border-r border-slate-800 flex flex-col h-full">
        <div className="flex items-center gap-4 px-6 py-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(250,204,21,0.15)", boxShadow: GLOW }}>
            <Shield size={30} color={ACCENT} />
          </div>
          <div>
            <div className="font-bold text-2xl" style={{ color: ACCENT }}>Luarmen</div>
            <div className="text-sm text-slate-500 -mt-1">Script Protection</div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {items.map((it) => {
            const Icon = it.icon;
            const active = view === it.id;
            return (
              <button
                key={it.id}
                onClick={() => setView(it.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-base transition-colors ${active ? "bg-[#111827]" : "hover:bg-[#0f1420]"}`}
                style={{ color: active ? ACCENT : "#94a3b8", boxShadow: active ? GLOW_SM : "none" }}
              >
                <Icon size={22} />
                <span className="flex-1 text-left">{it.label}</span>
                {active && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ACCENT, boxShadow: "0 0 8px 2px rgba(250,204,21,0.7)" }} />}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-6 border-t border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold" style={{ backgroundColor: "rgba(250,204,21,0.15)", color: ACCENT, boxShadow: GLOW_SM }}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <div className="text-base text-slate-200">{user?.username || 'User'}</div>
            <div className="text-sm" style={{ color: ACCENT }}>{user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1) || 'Free'} Plan</div>
          </div>
          <button onClick={handleLogout}><LogOut size={18} className="text-slate-500 hover:text-slate-300" /></button>
        </div>
      </div>
    );
  };

  const StatCard = ({ label, value, icon: Icon, iconColor, accentBorder }: any) => (
    <div className="flex-1 rounded-2xl border p-7 flex items-center justify-between" style={{ backgroundColor: "#0c1120", borderColor: accentBorder ? "rgba(250,204,21,0.4)" : "#1e293b", boxShadow: accentBorder ? GLOW : "none" }}>
      <div>
        <div className="text-base text-slate-400 mb-2">{label}</div>
        <div className="text-4xl font-bold text-white">{value}</div>
      </div>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentBorder ? "rgba(250,204,21,0.15)" : "rgba(148,163,184,0.1)", boxShadow: accentBorder ? GLOW_SM : "none" }}>
        <Icon size={24} color={iconColor} />
      </div>
    </div>
  );

  const ScriptRow = ({ script, onOpen, onDelete }: any) => (
    <div className="flex items-center justify-between px-5 py-4 rounded-xl border" style={{ backgroundColor: "#0a0e1a", borderColor: "#1e293b" }}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(250,204,21,0.12)", boxShadow: GLOW_SM }}>
          <Shield size={22} color={ACCENT_DARK} />
        </div>
        <div>
          <div className="text-white font-medium text-base">{script.script_name || 'Unnamed'}</div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>{new Date(script.created_at).toLocaleDateString()}</span>
            <span style={{ color: script.enabled ? "#4ade80" : "#f87171" }}>{script.enabled ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-slate-400">
        <div className="flex items-center gap-1 text-sm">
          <Eye size={16} /> {script.downloads || 0}
          <span className="text-xs ml-1 text-slate-500">executions</span>
        </div>
        <button onClick={onOpen} className="hover:text-white"><Cog size={18} /></button>
        <button onClick={onDelete} className="hover:text-red-400"><Trash2 size={18} /></button>
      </div>
    </div>
  );

  const Toggle = ({ checked, onChange }: any) => (
    <button onClick={() => onChange(!checked)} className="w-14 h-7 rounded-full relative transition-colors flex-shrink-0" style={{ backgroundColor: checked ? ACCENT : "#334155", boxShadow: checked ? GLOW_SM : "none" }}>
      <span className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: checked ? "translateX(28px)" : "translateX(2px)" }} />
    </button>
  );

  const OptionRow = ({ icon: Icon, label, desc, checked, onChange, locked }: any) => (
    <div className="flex items-start gap-5 py-5 border-b border-slate-800 last:border-b-0">
      <Toggle checked={checked} onChange={onChange} />
      <div>
        <div className="flex items-center gap-2 text-white text-base font-medium">
          {Icon && <Icon size={16} color={ACCENT} />}
          {label}
        </div>
        <div className="text-sm text-slate-500 mt-1">{desc}</div>
      </div>
    </div>
  );

  const ScriptEditor = ({ initial, onCancel, onSave }: any) => {
    const [name, setName] = useState(initial?.name || "New Script");
    const [code, setCode] = useState(initial?.code || "-- Paste your Lua script here...");
    const [opts, setOpts] = useState(initial?.opts || { freeForAll: false, silent: false, heartbeat: true, lightning: false, v4Loader: true, verified: false });
    const setOpt = (key: string) => (val: boolean) => setOpts((o: any) => ({ ...o, [key]: val }));

    return (
      <div className="p-10">
        <div className="rounded-2xl border" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b", boxShadow: GLOW }}>
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-800">
            <input value={name} onChange={(e) => setName(e.target.value)} className="bg-transparent text-white font-bold text-2xl outline-none" />
            <div className="flex items-center gap-3">
              <button onClick={() => onSave({ name, code, opts })} className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(74,222,128,0.15)" }}><Check size={20} className="text-green-400" /></button>
              <button onClick={onCancel} className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(248,113,113,0.15)" }}><X size={20} className="text-red-400" /></button>
            </div>
          </div>
          <div className="px-8">
            <OptionRow label="Free for All Mode" desc="Allows anyone to execute your script." checked={opts.freeForAll} onChange={setOpt("freeForAll")} />
            <OptionRow label="Silent Mode" desc="Disables Luarmen console outputs." checked={opts.silent} onChange={setOpt("silent")} />
            <OptionRow label="Heartbeat" desc="Heartbeating makes your script more secure." checked={opts.heartbeat} onChange={setOpt("heartbeat")} />
            <OptionRow icon={Zap} label="Lightning Mode" desc="Removes some inline security checks." checked={opts.lightning} onChange={setOpt("lightning")} />
            <OptionRow icon={Shield} label="Prefer V4 Loader" desc="Encrypts the file in http traffic & local cache." checked={opts.v4Loader} onChange={setOpt("v4Loader")} />
          </div>
          <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white text-sm font-medium"><FileCode2 size={16} color={ACCENT} /> Lua Script Code</div>
          </div>
          <div className="px-6 pb-6">
            <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={9} spellCheck={false} className="w-full rounded-lg p-4 font-mono text-sm text-slate-300 outline-none resize-none" style={{ backgroundColor: "#0a0e1a", border: "1px solid #1e293b" }} />
            <button onClick={() => onSave({ name, code, opts })} className="w-full mt-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2" style={{ backgroundColor: ACCENT, color: "#1a1400" }}>
              ⬆ OBFUSCATE &amp; PROTECT
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UserCard = ({ user: u, onUpdate }: any) => {
    const [plan, setPlan] = useState(u.plan || 'free');
    const [isUpdating, setIsUpdating] = useState(false);
    const isOwnerUser = u.plan === 'owner' || u.username === 'yathush';

    const handlePlanChange = async (newPlan: string) => {
      if (isOwnerUser) { alert('Cannot modify owner'); return; }
      setIsUpdating(true);
      try {
        const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
        const res = await fetch('/api/update-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: userData.api_key, user_id: u.id, new_plan: newPlan }),
        });
        if (res.ok) { setPlan(newPlan); alert('Plan updated'); onUpdate?.(); } else alert('Failed to update plan');
      } catch (e) { alert('Error'); }
      setIsUpdating(false);
    };

    const handleWhitelist = async () => {
      if (isOwnerUser) { alert('Cannot modify owner'); return; }
      const days = prompt('Days to whitelist (leave blank for permanent)');
      const duration = days ? parseInt(days) : 0;
      if (days && isNaN(duration)) return;
      try {
        const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
        const res = await fetch('/api/owner/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: userData.api_key, user_id: u.id, plan: 'premium', duration_days: duration }),
        });
        if (res.ok) { alert('Whitelisted'); onUpdate?.(); } else alert('Failed');
      } catch (e) { alert('Error'); }
    };

    const handleBlacklist = async () => {
      if (isOwnerUser) { alert('Cannot modify owner'); return; }
      const reason = prompt('Reason for blacklist');
      if (reason === null) return;
      try {
        const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
        const res = await fetch('/api/owner/blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: userData.api_key, user_id: u.id, reason: reason || 'No reason' }),
        });
        if (res.ok) { alert('Blacklisted'); onUpdate?.(); } else alert('Failed');
      } catch (e) { alert('Error'); }
    };

    const handleUnblacklist = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
        const res = await fetch(`/api/owner/blacklist?api_key=${userData.api_key}&user_id=${u.id}`, { method: 'DELETE' });
        if (res.ok) { alert('Unblacklisted'); onUpdate?.(); } else alert('Failed');
      } catch (e) { alert('Error'); }
    };

    const handleDelete = async () => {
      if (!confirm('Delete user? This cannot be undone.')) return;
      try {
        const userData = JSON.parse(localStorage.getItem('luarmen_user') || '{}');
        const res = await fetch(`/api/owner/delete-user?api_key=${userData.api_key}&user_id=${u.id}`, { method: 'DELETE' });
        if (res.ok) { alert('Deleted'); onUpdate?.(); } else alert('Failed');
      } catch (e) { alert('Error'); }
    };

    return (
      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: "#0a0e1a", borderColor: "#1e293b", marginBottom: '8px' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">{u.username}</span>
            <PlanBadge plan={plan} />
            {isOwnerUser && <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: ACCENT, color: '#000' }}>👑 OWNER</span>}
          </div>
          {u.blacklisted && <div className="text-sm text-red-400">🚫 Blacklisted</div>}
          {u.whitelisted && !u.blacklisted && <div className="text-sm text-green-400">✅ Whitelisted</div>}
        </div>
        <div className="flex gap-2 flex-wrap">
          {!isOwnerUser && (
            <>
              <select value={plan} onChange={(e) => handlePlanChange(e.target.value)} disabled={isUpdating} className="bg-[#1a1e2e] text-white text-xs px-2 py-1 rounded border border-slate-700">
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="pro">Pro</option>
              </select>
              {!u.whitelisted && !u.blacklisted && <button onClick={handleWhitelist} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#4ade80', color: '#000' }}>✅ Whitelist</button>}
              {u.blacklisted ? <button onClick={handleUnblacklist} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#4ade80', color: '#000' }}>🔓 Unblacklist</button> : <button onClick={handleBlacklist} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#f87171', color: '#fff' }}>🚫 Blacklist</button>}
              <button onClick={handleDelete} className="text-xs px-3 py-1 rounded" style={{ backgroundColor: '#f87171', color: '#fff' }}>🗑 Delete</button>
            </>
          )}
          {isOwnerUser && <span className="text-xs px-3 py-1 rounded" style={{ backgroundColor: 'rgba(250,204,21,0.2)', color: ACCENT }}>🔒 Protected</span>}
        </div>
      </div>
    );
  };

  const DashboardView = () => (
    <div className="p-10">
      <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>
      <div className="flex gap-6 mb-8">
        <StatCard label="Protected Scripts" value={stats.total_scripts || 0} icon={Shield} iconColor={ACCENT} accentBorder />
        <StatCard label="Total Users" value={stats.total_users || 0} icon={Users} iconColor="#4ade80" />
        <StatCard label="Total Downloads" value={stats.total_downloads || 0} icon={Key} iconColor="#94a3b8" />
        <StatCard label="Plan" value={user?.plan?.charAt(0).toUpperCase() + user?.plan?.slice(1) || 'Free'} icon={Zap} iconColor="#fbbf24" />
      </div>
      <div className="rounded-2xl border p-8" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 font-semibold text-white text-lg"><FileCode2 size={22} color={ACCENT} /> Your Scripts</div>
            <div className="text-base text-slate-400 mt-1">Manage and configure your protected scripts</div>
          </div>
          {canUpload && <button onClick={handleNewScript} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-base" style={{ backgroundColor: ACCENT, color: "#1a1400", boxShadow: GLOW }}><Plus size={18} /> New Script</button>}
        </div>
        {scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl border border-slate-700 flex items-center justify-center mb-5"><FileCode2 size={32} className="text-slate-600" /></div>
            <div className="text-white font-medium text-lg mb-1">No scripts yet</div>
            <div className="text-base" style={{ color: ACCENT }}>Create your first script to get started with protection.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {scripts.map((s) => <ScriptRow key={s.id} script={s} onOpen={() => setEditing(s)} onDelete={() => handleDeleteScript(s.id)} />)}
          </div>
        )}
      </div>
    </div>
  );

  const ScriptsView = () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Scripts</h1>
      <div className="rounded-xl border p-6" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b" }}>
        <div className="flex items-center justify-between mb-6">
          <div><div className="flex items-center gap-2 font-semibold text-white"><FileCode2 size={18} color={ACCENT} /> Your Scripts</div></div>
          {canUpload && <button onClick={handleNewScript} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm" style={{ backgroundColor: ACCENT, color: "#1a1400" }}><Plus size={16} /> New Script</button>}
        </div>
        {scripts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-xl border border-slate-700 flex items-center justify-center mb-4"><FileCode2 size={26} className="text-slate-600" /></div>
            <div className="text-white font-medium mb-1">No scripts yet</div>
            <div className="text-sm" style={{ color: ACCENT }}>Create your first script to get started with protection.</div>
          </div>
        ) : (
          <div className="space-y-2">
            {scripts.map((s) => <ScriptRow key={s.id} script={s} onOpen={() => setEditing(s)} onDelete={() => handleDeleteScript(s.id)} />)}
          </div>
        )}
      </div>
    </div>
  );

  const WhitelistView = () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Whitelist</h1>
      <div className="rounded-xl border p-6" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b" }}>
        <div className="flex items-center gap-2 font-semibold text-white mb-1"><KeyRound size={18} color={ACCENT} /> Whitelist Keys</div>
        <div className="text-sm text-slate-400 mb-5">Generate and manage license keys for your scripts</div>
        <div className="flex gap-3 mb-6">
          <div className="relative">
            <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)} className="appearance-none px-4 py-2.5 pr-9 rounded-lg text-sm text-white outline-none" style={{ backgroundColor: "#0a0e1a", border: "1px solid #1e293b", minWidth: 180 }}>
              <option value="">Select script...</option>
              {scripts.map((s) => <option key={s.id} value={s.id}>{s.script_name || 'Unnamed'}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
          </div>
          <input value={whitelistUsername} onChange={(e) => setWhitelistUsername(e.target.value)} placeholder="Username..." className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white outline-none" style={{ backgroundColor: "#0a0e1a", border: "1px solid #1e293b" }} />
          <button onClick={handleGenerateKey} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap" style={{ backgroundColor: ACCENT, color: "#1a1400" }}><Plus size={16} /> Generate Key</button>
        </div>
        <div className="grid grid-cols-6 gap-4 text-xs text-slate-500 uppercase tracking-wide pb-3 border-b border-slate-800">
          <div className="flex items-center gap-1"><KeyRound size={12} /> License Key</div><div>Script</div><div>Username</div><div>Expires</div><div>Status</div><div>Actions</div>
        </div>
        {users.filter(u => u.whitelisted && !u.blacklisted).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500"><KeyRound size={30} className="mb-4 text-slate-700" /><div className="text-sm">No whitelist keys yet. Generate your first key above.</div></div>
        ) : (
          users.filter(u => u.whitelisted && !u.blacklisted).map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 border-b border-slate-800 text-sm">
              <span className="font-mono text-slate-300">{u.api_key || 'N/A'}</span>
              <span className="text-slate-400">{u.username}</span>
              <span className="text-slate-400">{u.whitelist_expires ? new Date(u.whitelist_expires).toLocaleDateString() : 'Never'}</span>
              <span className="text-green-400">Active</span>
              <button className="text-slate-500 hover:text-white">...</button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const UsersView = () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>
      <div className="rounded-xl border p-6" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b" }}>
        <div className="flex items-center gap-2 font-semibold text-white mb-1"><Users size={18} color={ACCENT} /> All Users</div>
        <div className="text-sm text-slate-400 mb-5">Manage user plans, whitelist, blacklist, and delete users</div>
        <div className="space-y-2">
          {users.map((u) => <UserCard key={u.id} user={u} onUpdate={loadData} />)}
        </div>
      </div>
    </div>
  );

  const SettingsView = () => (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <div className="rounded-xl border p-6" style={{ backgroundColor: "#0c1120", borderColor: "#1e293b" }}>
        <div className="flex items-center gap-2 font-semibold text-white mb-1"><Settings size={18} color={ACCENT} /> Coming Soon</div>
        <div className="text-sm text-slate-400">Settings page is under development.</div>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;

  return (
    <div className="flex h-screen w-full" style={{ backgroundColor: "#0a0e1a", fontFamily: "system-ui, sans-serif" }}>
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <ScriptEditor
            initial={editing.isNew ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={handleSaveScript}
          />
        ) : view === "dashboard" ? (
          <DashboardView />
        ) : view === "scripts" ? (
          <ScriptsView />
        ) : view === "whitelist" ? (
          <WhitelistView />
        ) : view === "users" ? (
          <UsersView />
        ) : (
          <SettingsView />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
