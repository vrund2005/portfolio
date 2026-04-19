import { FiArrowLeft } from 'react-icons/fi'

function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 text-center text-white">
      <div className="max-w-lg">
        <p className="text-sm font-semibold uppercase text-indigo-300">404</p>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-6xl">Page not found</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          The page you opened does not exist in this portfolio.
        </p>
        <a
          href="/"
          className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-500 px-6 font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-1 hover:bg-indigo-400"
        >
          <FiArrowLeft />
          Back Home
        </a>
      </div>
    </main>
  )
}

export default NotFound
