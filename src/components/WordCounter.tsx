import { allPosts } from 'contentlayer/generated'
import { headers } from 'next/headers';

const WordCounter = () => {
    const headerList = headers();
    const locale = headerList.get('x-current-locale') as string;
    const slug = headerList.get('x-slug') as string;
    console.log("slug", slug)
    const post = allPosts.find(post => post.locale === locale && post.slug.trim() === slug.replace('/posts/', '')) as any;

    const regXCounter = /{\/\* counter \*\/}([\s\S]+?){\/\* \/counter \*\/}/g;
    const match = regXCounter.exec(post.body.raw.toString());
    const text = match ? removeHeadingsAndQuotes(match[1].trim()) : '';
    const words = text.trim().split(/\s+/).length;
    const characters = text.length;

    console.log("Words:", words);
    console.log("Charactesrs:", characters);

    function removeHeadingsAndQuotes(text: string) {
        text = text.replace(/^#.*$/gm, '');
        text = text.replace(/^>\s*/gm, '');
        return text;
    }

    return words;
}

export default WordCounter;