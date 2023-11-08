"use client";
import { allPosts } from "contentlayer/generated";
import React, { useEffect, useState } from "react";
import { Link, usePathname } from "@/lib/next-intl";
import { useLocale } from "next-intl";

const TableContents = () => {
	const locale = useLocale();
	const pathname = usePathname();
	let path = pathname.replace("/posts/", "") as string;

	if (pathname === "/about") {
		path = "about";
	}
	const post = allPosts.find(
		(post) =>
			post._raw.sourceFileDir === locale && post.fileName.trim() === path.trim()
	) as any;
	if (!post) return undefined;

	const renderList = (headings: any[], level: number) => {
		const items = [];
		while (headings.length > 0) {
			const heading = headings[0];
			if (heading.level > level) {
				const subList = renderList(headings, level + 1);
				if (subList) {
					items[items.length - 1].children = subList;
				}
			} else if (heading.level < level) {
				return items;
			} else {
				items.push({
					...heading,
					children: null,
				});
				headings.shift();
			}
		}
		return items;
	};

	const renderListItem = (item: any) => {
		return (
			<li key={`#${item.slug}`}>
				<Link
					data-level={item.level}
					href={`#${item.slug}`}
					onClick={(e) => {
						e.preventDefault();
						const element = document.getElementById(item.slug);
						if (element) {
							window.scrollTo({
								top: element.getBoundingClientRect().top + window.scrollY - 70,
								behavior: "smooth",
							});
						}
					}}
					className={`transition-colors duration-200 !text-gray-600 dark:!text-gray-300 hover:!text-blue-500 dark:hover:!text-blue-400 !no-underline hover:!no-underline dark:hover:!no-underline overflow-hidden overflow-ellipsis whitespace-nowrap`}>
					{item.text}
				</Link>
				{item.children &&
					(item.level === 1 ? (
						<ol className="list-[lower-roman] list-inside pl-4">
							{item.children.map(renderListItem)}
						</ol>
					) : item.level === 2 ? (
						<ol className="list-[lower-alpha] list-inside pl-4">
							{item.children.map(renderListItem)}
						</ol>
					) : (
						<ol className="list-decimal list-inside pl-4">
							{item.children.map(renderListItem)}
						</ol>
					))}
			</li>
		);
	};

	const listItems = renderList([...post.headings], 1);

	return (
		<div id="table-of-contents" className="toc bg-white dark:bg-gray-800 px-6 pb-4 rounded-lg shadow-lg">
			<p className="text-2xl font-semibold py-4 text-gray-800 dark:text-white">
				{locale === "ja" ? "目次" : "Table of Contents"}
			</p>
			<ol className="space-y-2 list-decimal list-inside">
				{listItems.map(renderListItem)}
			</ol>
		</div>
	);
};

export default TableContents;
