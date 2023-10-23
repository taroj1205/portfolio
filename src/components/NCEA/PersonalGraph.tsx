'use client'
import { Bar, Pie } from 'react-chartjs-2';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import ncea, { NceaData } from '@/components/doc/ncea';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useEffect, useState } from 'react';
import { FaExchangeAlt } from 'react-icons/fa';
import { useTheme } from 'next-themes';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import { useLocale, useTranslations } from 'next-intl';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const calculateRankScore = (data: NceaData) => {
    const rankScores: { [key: string]: number } = {};

    Object.entries(data).forEach(([subject, standards]) => {
        let rankScore = 0;
        Object.values(standards).forEach(standard => {
            const credits = parseInt(standard.credits, 10);
            switch (standard.achievement) {
                case 'Achieved':
                    rankScore += credits * 2;
                    break;
                case 'Merit':
                    rankScore += credits * 3;
                    break;
                case 'Excellence':
                    rankScore += credits * 4;
                    break;
            }
        });
        rankScores[subject] = rankScore;
    });

    return rankScores;
};

const calculateSubjectCredits = (data: NceaData) => {
    const subjectCredits: { [key: string]: { achieved: number, merit: number, excellence: number } } = {};

    Object.entries(data).forEach(([subject, standards]) => {
        let achieved = 0;
        let merit = 0;
        let excellence = 0;

        Object.values(standards).forEach(standard => {
            const credits = parseInt(standard.credits, 10);
            switch (standard.achievement) {
                case 'Achieved':
                    achieved += credits;
                    break;
                case 'Merit':
                    merit += credits;
                    break;
                case 'Excellence':
                    excellence += credits;
                    break;
            }
        });

        subjectCredits[subject] = { achieved, merit, excellence };
    });

    return subjectCredits;
};

const calculateCredits = (data: NceaData) => {
    let achieved = 0;
    let merit = 0;
    let excellence = 0;

    Object.values(data).forEach(subject => {
        Object.values(subject).forEach(standard => {
            const credits = parseInt(standard.credits, 10);
            switch (standard.achievement) {
                case 'Achieved':
                    achieved += credits;
                    break;
                case 'Merit':
                    merit += credits;
                    break;
                case 'Excellence':
                    excellence += credits;
                    break;
            }
        });
    });

    return { achieved, merit, excellence };
};

const Graphs: React.FC = () => {
    const [showRankScore, setShowRankScore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState(0);
    const credits = calculateCredits(ncea);
    const rankScores = calculateRankScore(ncea);
    const subjectCredits = calculateSubjectCredits(ncea);
    const [key, setKey] = useState(Math.random());
    const { resolvedTheme, theme } = useTheme();
    const t = useTranslations('apps.graphs');
    const lang = useLocale();

    useEffect(() => {
        setKey(Math.random());
    }, [resolvedTheme]);

    const pieData = {
        labels: [t('achieved'), t('merit'), t('excellence')],
        datasets: [
            {
                data: [credits.achieved, credits.merit, credits.excellence],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }
        ]
    };

    const rankScorePieData = {
        labels: Object.keys(rankScores),
        datasets: [
            {
                data: Object.values(rankScores),
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
            }
        ]
    };

    const creditsBarData = {
        labels: [t('achieved'), t('merit'), t('excellence')],
        datasets: [
            {
                label: t('credits'),
                data: [credits.achieved, credits.merit, credits.excellence],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                borderColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                borderWidth: 1
            }
        ]
    };

    const subjectBarData = {
        labels: Object.keys(subjectCredits),
        datasets: [
            {
                label: t('achieved'),
                data: Object.values(subjectCredits).map(c => c.achieved),
                backgroundColor: '#FF6384',
            },
            {
                label: t('merit'),
                data: Object.values(subjectCredits).map(c => c.merit),
                backgroundColor: '#36A2EB',
            },
            {
                label: t('excellence'),
                data: Object.values(subjectCredits).map(c => c.excellence),
                backgroundColor: '#FFCE56',
            }
        ]
    };

    const handleIconClick = () => {
        setDisplayMode((displayMode + 1) % 3);
    };

    const getTooltipText = () => {
        switch (displayMode) {
            case 0: return t('switchToDistributionStacked');
            case 1: return t('switchToDistributionNonStacked');
            case 2: return t('switchToTotalCredits');
        }
    };

    useEffect(() => {
        setIsLoading(false);
    }, [theme]);


    return (
        <div key={key} className="max-w-full h-full flex-wrap flex flex-col justify-center items-center lg:space-x-4 overflow-x-hidden">
                <div className="w-full h-full flex flex-col justify-center items-center max-w-screen">
                    <h2 className="text-center mb-2 flex flex-row items-center justify-center w-full">
                        <span className={`${lang === 'ja' ? 'w-[250px]' : 'w-[350px]'} flex justify-between items-center whitespace-normal`}>
                            {t('distributionOfAchievements')} {showRankScore ? `(${t('rankScore')})` : `(${t('totalCredits')})`}
                            <FaExchangeAlt
                                className="ml-2 cursor-pointer"
                                onClick={() => setShowRankScore(!showRankScore)}
                                data-tooltip-content={showRankScore ? t('switchToCredits') : t('switchToRankScore')}
                                data-tooltip-id="Switch Pie"
                            />
                        </span>
                    </h2>
                    <ReactTooltip id="Switch Pie" content={showRankScore ? t('switchToCredits') : t('switchToRankScore')} />
                <div className="h-[300px] max-w-[90%] w-[300px] md:w-[400px]">
                        {isLoading ? <Skeleton className="animate-pulse" count={1} height={300} /> : (
                            showRankScore ?
                                <Pie
                                    data={rankScorePieData}
                                    options={{
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            },
                                        },
                                        maintainAspectRatio: false
                                    }} />
                                :
                                <Pie
                                    data={pieData}
                                    options={
                                        {
                                            plugins: {
                                                legend: {
                                                    labels: {
                                                        color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                    }
                                                },
                                            },
                                            maintainAspectRatio: false
                                        }
                                    }
                                />
                        )}
                    </div>
                </div>
                <div className="w-full h-full flex flex-col justify-center items-center max-w-screen">
                    <h2 className="text-center mb-2 flex flex-row items-center justify-center w-full">
                        <span className={`${lang === 'ja' ? 'w-[270px]' : 'w-[350px]'} flex justify-between items-center whitespace-normal`}>
                            {displayMode === 0 ? t('totalCreditsEarned') : `${t('achievementsForSubject')} (${displayMode === 1 ? t('stacked') : t('nonStacked')})`}
                            <FaExchangeAlt
                                className="ml-2 cursor-pointer"
                                onClick={handleIconClick}
                                data-tooltip-content={getTooltipText()}
                                data-tooltip-id="Switch Bar"
                            />
                        </span>
                    </h2>
                    <ReactTooltip id="Switch Bar" content={getTooltipText()} />
                    <div className="h-[300px] max-w-[90%] w-[300px] md:w-[400px]">
                        {isLoading ? <Skeleton className="animate-pulse" count={1} height={300} /> : (
                            displayMode === 0 ?
                                <Bar
                                    data={creditsBarData}
                                    options={{
                                        scales: {
                                            x: {
                                                ticks: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            },
                                            y: {
                                                ticks: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            }
                                        },
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            },
                                        }
                                    }}
                                />
                                :
                                <Bar
                                    data={subjectBarData}
                                    options={{
                                        scales: {
                                            x: {
                                                stacked: displayMode === 1,
                                                ticks: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            },
                                            y: {
                                                stacked: displayMode === 1,
                                                ticks: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            }
                                        },
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                labels: {
                                                    color: resolvedTheme === 'dark' ? '#c4c4c4' : '#000',
                                                }
                                            },
                                        }
                                    }}
                                />
                        )}
                    </div>
                </div>
            </div>
    );
};

export default Graphs;