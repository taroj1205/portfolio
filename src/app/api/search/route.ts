import { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';

type SearchResult = {
    link: string;
    title: string;
    snippet: string;
    pagemap?: {
        cse_image?: {
            src: string;
        }[];
    };
};

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CX = process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q');
    const query = q?.trim();
    let start = Math.max(Number(searchParams.get('start')) || 1, 1);
    start = Math.floor((start - 1) / 10) * 10 + 1;
    const lang = searchParams.get('lang') || 'en';
    const num = searchParams.get('num') || '10';
    
    if (!query || typeof query !== 'string' || query.length === 0 || !GOOGLE_API_KEY || !GOOGLE_CX) {
        return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check if the search results are cached in the Supabase table
    const { data: cachedResults, error: cacheError } = await supabase
        .from('search')
        .select('result, created_at, updated_at')
        .eq('query', query)
        .eq('start', start)
        .eq('lang', lang)
        .single();

    if (cacheError) {
        console.error(cacheError);
    }

    if (cachedResults) {
        return Response.json({ result: cachedResults.result, time: cachedResults.updated_at || cachedResults.created_at}, { status: 200 });
    }

    try {
        const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&num=${num}&start=${start}&lr=lang_${lang}`);
        const data = await response.json();
        console.log(data.error)
        if (data.error) {
            console.error(data.error.code);
            if (data.error.code === 429) {
                const errorData = data.error.message.replace(/project_number:\d+/g, 'project_number:****');
                const message = lang === 'ja' ? 'リクエストが多すぎます。後でもう一度お試しください。' : 'Too many requests. Please try again later.';
                return Response.json({ code: data.error.code, message, details: errorData }, { status: 429 });
            }
            return Response.json({ error: data.error.message }, { status: 500 });
        }
        else if (data) {
            console.log(data.searchInformation)
            // Store the search results in the Supabase table
            const { data: insertData, error: insertError } = await supabase
                .from('search')
                .insert({ query, start, lang, result: data }) as { data: any, error: any };

            if (insertError) {
                console.error(insertError);
            }

            console.log(data);

            return Response.json({ result: data, time: new Date().getTime() }, { status: 200 });
        }
        return Response.json({ error: 'Unknown error' }, { status: 500 });
    } catch (error: any) {
        console.error(error);
        if (error.status === 429) {
            const errorData = error.message.replace(/project_number:\d+/g, 'project_number:****');
            const message = lang === 'ja' ? 'リクエストが多すぎます。後でもう一度お試しください。' : 'Too many requests. Please try again later.';
            return Response.json({ code: error.status, message, details: errorData }, { status: 429 });
        }
        return Response.json({ error: error.message }, { status: 500 });
    }
}