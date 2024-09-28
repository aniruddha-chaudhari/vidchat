import Link from 'next/link';

function Home() {
  return (
    <div>
      <h1>Welcome to Our Application</h1>
      <p>Get started by signing up or logging in.</p>
      <div className="flex gap-4 items-center flex-col sm:flex-row">
        <Link href="/signup">
          <a className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Sign Up
          </a>
        </Link>
        <Link href="/login">
          <a className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5">
            Log In
          </a>
        </Link>
      </div>
    </div>
  );
}

export default Home;