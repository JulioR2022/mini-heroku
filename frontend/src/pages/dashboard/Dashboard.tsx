// Dashboard.tsx
// React + TypeScript + TailwindCSS

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-black text-white font-sans">
      {/* Sidebar */}
      <aside className="w-[320px] border-r border-zinc-800 flex flex-col justify-between">
        <div>
          {/* Workspace */}
          <div className="h-14 border-b border-zinc-800 flex items-center px-5">
            <div className="w-8 h-8 rounded-full bg-yellow-200 text-black flex items-center justify-center text-sm font-semibold">
              M
            </div>

            <div className="ml-3 flex items-center gap-2">
              <span className="text-lg font-medium">My Workspace</span>
              <span className="text-zinc-500">⌄</span>
            </div>
          </div>

          {/* Main navigation */}
          <nav className="mt-5">
            <div className="mx-3 rounded bg-purple-700 px-4 py-3 text-lg font-medium">
              Projects
            </div>

            <div className="px-7 py-4 space-y-5 text-zinc-300">
              <p>Blueprints</p>
              <p>Environment Groups</p>
            </div>
          </nav>

          {/* Sections */}
          <div className="px-7 mt-10">
            <p className="text-zinc-500 uppercase text-sm tracking-[0.2em] mb-5">
              Integrations
            </p>

            <div className="space-y-5 text-zinc-300">
              <p>Observability</p>
              <p>Webhooks</p>
              <p>Notifications</p>
            </div>
          </div>

          <div className="px-7 mt-12">
            <p className="text-zinc-500 uppercase text-sm tracking-[0.2em] mb-5">
              Networking
            </p>

            <div className="space-y-5 text-zinc-300">
              <p>Private Links</p>

              <div className="flex items-center gap-2">
                <span>Dedicated IPs</span>

                <span className="bg-purple-700 text-xs px-2 py-[2px] rounded">
                  New
                </span>
              </div>
            </div>
          </div>

          <div className="px-7 mt-12">
            <p className="text-zinc-500 uppercase text-sm tracking-[0.2em] mb-5">
              Workspace
            </p>

            <div className="space-y-5 text-zinc-300">
              <p>Billing</p>
              <p>Settings</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-zinc-800 px-7 py-6 space-y-5 text-zinc-300">
          <p>Changelog</p>
          <p>Invite a friend</p>
          <p>Contact support</p>
          <p>Render Status</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {/* Topbar */}
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-8">
          <div className="text-lg font-medium">Projects</div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 border border-zinc-700 px-3 py-2 rounded">
              <span className="text-zinc-400">⌕</span>
              <span className="text-zinc-400">Search</span>
            </div>

            {/* Buttons */}
            <button className="border border-zinc-700 px-5 py-2 rounded hover:bg-zinc-900 transition">
              + New
            </button>

            <button className="border border-zinc-700 px-5 py-2 rounded hover:bg-zinc-900 transition">
              Upgrade
            </button>

            <div className="w-8 h-8 rounded-full bg-pink-200 text-black flex items-center justify-center text-sm font-semibold">
              2
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="p-14">
          <h1 className="text-6xl font-semibold mb-16">Overview</h1>

          {/* Top actions */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-4xl font-semibold">Projects</h2>

            <div className="flex items-center gap-6">
              <span className="text-purple-400">Invite your team</span>

              <button className="bg-white text-black px-6 py-3 rounded font-medium">
                + New
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="flex gap-8">
            {/* Project Card */}
            <div className="w-[430px] h-[190px] border border-zinc-700 p-6">
              <h3 className="text-2xl font-medium mb-10">My project</h3>

              <div className="inline-flex items-center gap-2 bg-green-800 text-green-100 px-4 py-3 rounded">
                <span>✓</span>
                <span>All services are up and running</span>
              </div>
            </div>

            {/* Create Project */}
            <div className="w-[430px] h-[190px] border border-dashed border-zinc-700 flex items-center justify-center text-2xl text-zinc-300">
              + Create new project
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}