// components/PageContent.tsx
import { Page } from "@/types/page";
import SocialShare from "./SocialShare";
import Link from "next/link";
import { Home } from "lucide-react";

interface PageContentProps {
  page: Page;
}

export default function PageContent({ page }: PageContentProps) {
  return (
    <main className="w-full lg:w-8/12 px-4">
      {/* Breadcrumbs */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              <Home className="w-4 h-4 mr-2" />
              Beranda
            </Link>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                className="w-3 h-3 text-gray-400 mx-1"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 9 4-4-4-4"
                />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                {page.title}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <article className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
        <div className="prose prose-lg max-w-none text-gray-600">
          <div dangerouslySetInnerHTML={{ __html: page.content || "" }} />
        </div>
        <div className="mt-8 pt-4 border-t">
          <SocialShare
            url={typeof window !== "undefined" ? window.location.href : ""}
            title={page.title}
          />
        </div>
      </article>
    </main>
  );
}
