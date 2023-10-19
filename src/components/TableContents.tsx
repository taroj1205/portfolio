import { allPosts } from 'contentlayer/generated';
import { useParams } from 'next/navigation';
import React from 'react';
import { headers } from "next/headers";
import Link from 'next/link';

const TableContents = () => {
  const headerList = headers();
  const locale = headerList.get('x-current-locale') as string;
  const path = headerList.get('x-slug')?.replace('/posts/', '') as string;
  const post = allPosts.find(post => post._raw.sourceFileDir === locale && post.slug.trim() === path.trim()) as any;
  console.log(post)
  if (!post) return undefined;
  return (
    <div className="bg-white dark:bg-gray-800 px-6 pb-4 pt-1 rounded-lg shadow-lg">
      <h3 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{locale === 'ja'? '目次' : 'Table of Contents'}</h3>
      <div className="space-y-2">
        {post.headings.map((heading: { level: number; text: string; slug: string }) => {
          const levelStyle = heading.level === 1 ? 'text-lg font-semibold' : 'text-base';
          console.log(heading.level)
          return (
            <div key={`#${heading.slug}`} style={{ marginLeft: `${(heading.level - 1) * 10}px`}} className={`pl-2 border-l-2 border-gray-200 dark:border-gray-600`}>
              <Link data-level={heading.level} href={`/${locale}/posts/${path.trim()}/#${heading.slug}`} className={`text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 line-clamp-1 ${levelStyle}`}>
                {heading.text}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableContents;