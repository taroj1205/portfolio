'use client'
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/client';
import Link from 'next-intl/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaSearch, FaImage } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const GoogleSearch: React.FC = () => {
    const t = useTranslations('search');
    const format = useFormatter();
    const [query, setQuery] = useState<string>();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [startIndex, setStartIndex] = useState(1);
    const [searchTime, setSearchTime] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const [defaultSet, setDefaultSet] = useState(false);
    const router = useRouter();
    const lang = useLocale();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = useCallback(async (start: number) => {
        console.log(GOOGLE_API_KEY);
        if (!query || query.length === 0 || !GOOGLE_API_KEY || !GOOGLE_CX) {
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&num=10&start=${start}&lr=lang_${lang}`);
            console.log(`https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${query}&num=10&start=${start}&lr=lang_${lang}`);
            const data = await response.json();
            if (data.error) {
                console.error(data.error);
                toast.error(data.error.message, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: 'colored',
                });
                setLoading(false);
                return;
            }
            else if (data.items) {
                setResults(data.items);
                setTotalResults(data.searchInformation.totalResults);
                setStartIndex(data.queries.request[0].startIndex);
                setSearchTime(data.searchInformation.formattedSearchTime);
                const urlParams = new URLSearchParams();
                urlParams.set('q', query);
                urlParams.set('page', String(start));
                router.replace(`/apps/search?${urlParams.toString()}`);
                setDefaultSet(true);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'colored',
            });
        }
        setLoading(false);
    }, [lang, query, router]);

    useEffect(() => {
        inputRef.current?.focus();
        if (defaultSet) {
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get("q");
        const pageQuery = urlParams.get("page");
        console.log(searchQuery)
        setLoading(false);
        if (searchQuery) {
            setQuery(searchQuery);
            if (inputRef.current) {
                inputRef.current.value = searchQuery;
            }
            handleSearch(Number(pageQuery));
        } else { setDefaultSet(true) }
    }, [defaultSet, handleSearch]);

    const handlePageClick = (start: number) => {
        handleSearch(start);
    };

    const handlePageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPage = Number(event.target.value);
        handleSearch(selectedPage);
    };

    return (
        <div className="bg-white dark:bg-gray-900 pt-12 p-4 rounded-lg shadow-md h-full">
            <div className="flex items-center mb-2">
                <input
                    type="text"
                    placeholder="Search Google"
                    onChange={(e) => { setQuery(e.target.value) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(1); } }}
                    className={`w-full rounded-lg py-2 px-4 mr-2 ${defaultSet ? 'cursor-text' : 'cursor-not-allowed'} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                    style={{ height: '2.5rem' }}
                    ref={inputRef}
                    autoFocus
                    disabled={!defaultSet}
                />
                <button
                    onClick={() => handleSearch(1)}
                    className={`${defaultSet ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed'} text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                    style={{ height: '2.5rem' }}
                >
                    <FaSearch />
                </button>
            </div>
            {loading ? (
                <div className="flex flex-col space-y-4 mt-4">
                    {[1, 2, 3, 4, 5].map((_, index) => (
                        <div key={index} className="flex space-x-4">
                            <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                    <div className="mt-4">
                        {results.map((result, index) => (
                            <Link href={result.link} target="_blank" rel="noopener noreferrer" key={result.link}>
                                <div className="mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                                    {result.pagemap?.cse_image ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={result.pagemap.cse_image[0].src} alt={result.title} className="w-32 h-32 object-cover mr-4" />
                                    ) : (
                                        <div className="w-32 h-32 flex items-center justify-center mr-4">
                                            <FaImage className="text-gray-400" size={48} />
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-lg font-medium text-blue-500 hover:underline">{result.title}</h3>
                                        <p className="text-gray-500" dangerouslySetInnerHTML={{ __html: result.snippet }}></p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        <div className="flex justify-between mt-4">
                            {results.length > 0 && (
                                <>
                                    <p className="text-gray-500">{t('results', { startIndex, endIndex: startIndex + results.length - 1, totalResults })}</p>
                                    <p className="text-gray-500">{t('searchTime', { searchTime: format.relativeTime(searchTime) })}</p>
                                </>
                            )}
                        </div>
                        <div className="flex justify-center mt-4">
                            {startIndex > 1 && (
                                <button onClick={() => handlePageClick(startIndex - 10)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 mr-2">
                                    {t('previous')}
                                </button>
                            )}
                            {startIndex + results.length < totalResults && (
                                <button onClick={() => handlePageClick(startIndex + 10)} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                                    {t('next')}
                                </button>
                            )}
                            {results.length > 0 && (
                                <select onChange={handlePageSelect} className="ml-2 border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                                    {Array.from({ length: Math.min(Math.ceil(totalResults / 10), 20) }, (_, i) => {
                                        const start = i * 10 + 1;
                                        const end = Math.min(start + 9, totalResults);
                                        const optionValue = start;
                                        const optionText = `${start}-${end}`;
                                        return (
                                            <option key={i + 1} value={optionValue}>{optionText}</option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>
                    </div>
            )}
            {results.length === 0 && !loading ? (
                <div className="flex flex-col items-center justify-center mt-4 cursor-pointer" onClick={() => { inputRef.current?.focus() }}>
                    <FaSearch size={64} className="text-gray-400 mb-4" />
                    <p className="text-gray-500">{t('startSearch')}</p>
                </div>
            ) : null}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
};

export default GoogleSearch;