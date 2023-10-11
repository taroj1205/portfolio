'use client'
import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/client';
import Link from 'next-intl/link';
import { useSearchParams } from 'next/navigation';
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
    const [loading, setLoading] = useState(true);
    const [startIndex, setStartIndex] = useState(1);
    const [searchTime, setSearchTime] = useState(0);
    const [totalResults, setTotalResults] = useState(0);
    const [timeInfo, setTimeInfo] = useState<Date>(new Date);
    const [defaultSet, setDefaultSet] = useState(false);
    const router = useRouter();
    const lang = useLocale();
    const inputRef = useRef<HTMLInputElement>(null);
    const params = useSearchParams();

    const handleSearch = useCallback(async (start: number) => {
        console.log(GOOGLE_API_KEY);
        if (!query || query.length === 0 || !GOOGLE_API_KEY || !GOOGLE_CX) {
            return;
        }
        setLoading(true);
        const startTime = new Date().getTime();
        try {
            const urlParams = new URLSearchParams();
            urlParams.set('q', query);
            urlParams.set('page', String(start));
            router.replace(`/apps/search?${urlParams.toString()}`);
            const cacheKey = `${query}_${start}_${lang}`;
            const cacheValue = localStorage.getItem('search');
            if (cacheValue) {
                console.log("result cached")
                const cacheData = JSON.parse(cacheValue);
                const cachedResult = cacheData[cacheKey];
                if (cachedResult) {
                    setResults(cachedResult.items);
                    setTotalResults(cachedResult.totalResults);
                    setStartIndex(cachedResult.startIndex);
                    // setSearchTime(cachedResult.searchTime);
                    setTimeInfo(cachedResult.time);
                    setDefaultSet(true);
                    setLoading(false);
                    return;
                }
            }
            const response = await fetch(`/api/search?q=${query}&num=10&start=${start}&lang=${lang}`);
            const data = await response.json();
            if (data.code) {
                console.log(data.message);
                toast.error(data.message, {
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
            else if (data.result) {
                if (data.error) throw new Error(data.error);
                const datas = data.result;
                setResults(datas.items);
                setTotalResults(datas.searchInformation.totalResults);
                setStartIndex(datas.queries.request[0].startIndex);
                // setSearchTime(datas.searchInformation.formattedSearchTime);
                console.log(data.time)
                setTimeInfo(data.time);
                setDefaultSet(true);
                const cacheValue = localStorage.getItem('search');
                const cacheData = cacheValue ? JSON.parse(cacheValue) : {};
                cacheData[cacheKey] = {
                    items: datas.items,
                    totalResults: datas.searchInformation.totalResults,
                    startIndex: datas.queries.request[0].startIndex,
                    searchTime: datas.searchInformation.formattedSearchTime,
                    time: data.time,
                };
                localStorage.setItem('search', JSON.stringify(cacheData));
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
        } finally {
            setLoading(false);
            setDefaultSet(true);
            const endTime = new Date().getTime();
            console.log((endTime - startTime) / 1000);
            setSearchTime((endTime - startTime) / 1000);
        }
    }, [lang, query, router]);

    useEffect(() => {
        inputRef.current?.focus();
        if (defaultSet) {
            return;
        }
        const searchQuery = params.get("q");
        let pageQuery = Number(Math.max(Number(params.get('page')) || 1, 1) || 1);
        pageQuery = Math.floor((pageQuery - 1) / 10) * 10 + 1;
        console.log(searchQuery)
        if (searchQuery) {
            setQuery(searchQuery);
            if (inputRef.current) {
                inputRef.current.value = searchQuery;
            }
            handleSearch(Number(pageQuery));
        } else {
            setDefaultSet(true)
            setLoading(false);
        }
    }, [defaultSet, handleSearch, params]);

    const handlePageClick = (start: number) => {
        handleSearch(start);
    };

    const handlePageSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPage = Number(event.target.value);
        handleSearch(selectedPage);
    };

    return (
        <div className="bg-white dark:bg-gray-900 pt-12 p-4 rounded-lg">
            <div className="flex items-center mb-2">
                <input
                    type="text"
                    placeholder="Search Google"
                    onChange={(e) => { setQuery(e.target.value) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { handleSearch(1); } }}
                    className={`w-full rounded-lg py-2 px-4 mr-2 ${defaultSet ? 'cursor-text' : 'cursor-wait'} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
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
                <div className="grid grid-cols-repeat-auto-fit gap-4">
                    {[1, 2, 3, 4, 5].map((_, index) => (
                        <div key={index} className="flex flex-row space-y-4 space-x-2">
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
                <>
                    <div className="flex flex-col md:flex-row items-center justify-center md:justify-between mt-4">
                        {results.length > 0 && (
                            <>
                                <p className="text-gray-500">{t('results', { startIndex, endIndex: startIndex + results.length - 1, totalResults })}</p>
                                <p
                                    className="text-gray-500"
                                    onClick={() => timeInfo && console.log(new Date(timeInfo))}
                                >
                                    {t('lastUpdated', { time: format.relativeTime(new Date(timeInfo), new Date(new Date().getTime())) })}
                                </p>
                                <p className="text-gray-500">{t('searchTime', { searchTime })}</p>
                            </>
                        )}
                    </div>
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
                                <select
                                    onChange={handlePageSelect}
                                    className="ml-2 border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    value={Number(params.get('page')) || 1}
                                >
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
                </>
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