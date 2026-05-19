import React from 'react';
import { db } from '@/lib/db';
import { Users, CreditCard, Cloud, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

export default async function AdminDashboard() {
  // Fetch actual stats from DB
  const userCount = await db.user.count();
  const premiumUserCount = await db.user.count({ where: { plan: 'PREMIUM' } });
  const comicCount = await db.comic.count();
  const syncedComicCount = await db.comic.count({ where: { syncStatus: 'SYNCED' } });
  
  // Calculate fake MRR based on premium count
  const mrr = premiumUserCount * 9.99;

  const stats = [
    { label: 'Total Users', value: userCount, icon: <Users size={20} />, color: 'blue' },
    { label: 'Premium Users', value: premiumUserCount, icon: <CreditCard size={20} />, color: 'purple' },
    { label: 'Est. Monthly MRR', value: `$${mrr.toFixed(2)}`, icon: <TrendingUp size={20} />, color: 'green' },
    { label: 'Total Comics Stored', value: comicCount, icon: <BookOpen size={20} />, color: 'orange' },
    { label: 'Cloud Synced', value: syncedComicCount, icon: <Cloud size={20} />, color: 'indigo' },
  ];

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-4xl font-black tracking-tighter italic mb-2">Admin Command Center</h1>
        <p className="text-neutral-500 font-medium uppercase tracking-widest text-xs">Mission Control for Comet SaaS</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-neutral-900 border border-white/5 p-6 rounded-3xl shadow-xl">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-${stat.color}-500/10 text-${stat.color}-400`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black tracking-tighter italic">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-black mb-6 italic tracking-tighter">Recent Conversions</h3>
          <div className="space-y-6">
            {/* Mock recent conversions */}
            <ActivityItem name="SpiderFan99" action="Subscribed to Voyager" time="2 hours ago" />
            <ActivityItem name="IronReader" action="Subscribed to Voyager" time="5 hours ago" />
            <ActivityItem name="StanTheMan" action="Uploaded 50 comics" time="8 hours ago" />
          </div>
        </div>

        {/* System Health */}
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-black mb-6 italic tracking-tighter">System Health</h3>
          <div className="space-y-6">
            <HealthItem label="Database" status="Operational" />
            <HealthItem label="Stripe Webhooks" status="Operational" />
            <HealthItem label="S3/R2 Storage" status="Operational" />
            <HealthItem label="ComicVine API" status="Rate Limited" warning />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ name, action, time }: { name: string, action: string, time: string }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
      <div className="flex flex-col">
        <span className="font-bold text-sm">{name}</span>
        <span className="text-xs text-neutral-500">{action}</span>
      </div>
      <span className="text-[10px] font-black uppercase text-neutral-600">{time}</span>
    </div>
  );
}

function HealthItem({ label, status, warning }: { label: string, status: string, warning?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-bold text-sm text-neutral-400">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${warning ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
        <span className={`text-xs font-black uppercase tracking-widest ${warning ? 'text-orange-400' : 'text-green-400'}`}>
          {status}
        </span>
      </div>
    </div>
  );
}
