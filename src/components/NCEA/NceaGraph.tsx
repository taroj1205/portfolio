import React, { useMemo, useRef } from 'react';
import Chart from 'chart.js/auto';
import ncea from '../doc/ncea';
import { useTheme } from 'next-themes';
import { useLocale, useTranslations } from 'next-intl';

const Graph: React.FC = () => {
    const { theme, setTheme } = useTheme();
    const pieChartRef = useRef<Chart | null>(null);
    const pieBarChartRef = useRef<Chart | null>(null);
    const barChartRef = useRef<Chart | null>(null);
    const t = useTranslations();
    const lang = useLocale();

    // Prepare data for pie chart
    const rankScores = useMemo(() => {
        return Object.entries(ncea).map(([subject, assessments]) => {
            let totalRankScore = 0;
            Object.values(assessments).forEach((details) => {
                if (details.achievement === 'Achieved') {
                    totalRankScore += parseInt(details.credits, 10) * 2;
                } else if (details.achievement === 'Merit') {
                    totalRankScore += parseInt(details.credits, 10) * 3;
                } else if (details.achievement === 'Excellence') {
                    totalRankScore += parseInt(details.credits, 10) * 4;
                }
            });
            return { subject, totalRankScore };
        });
    }, []);

    const rankCredits = useMemo(() => {
        const credits = {
            Achieved: 0,
            Merit: 0,
            Excellence: 0,
        };

        Object.values(ncea).forEach((assessments) => {
            Object.values(assessments).forEach((details) => {
                const creditsValue = parseInt(details.credits, 10);
                if (details.achievement === 'Achieved') {
                    credits.Achieved += creditsValue;
                } else if (details.achievement === 'Merit') {
                    credits.Merit += creditsValue;
                } else if (details.achievement === 'Excellence') {
                    credits.Excellence += creditsValue;
                }
            });
        });

        return credits;
    }, []);

    React.useEffect(() => {
        if (pieChartRef.current) {
            pieChartRef.current.destroy();
        }
        if (pieBarChartRef.current) {
            pieBarChartRef.current.destroy();
        }
        if (barChartRef.current) {
            barChartRef.current.destroy();
        }

        const ctxPie = document.getElementById('rankScorePieChart') as HTMLCanvasElement;
        const rankScorePieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: rankScores.map((subject) => subject.subject),
                datasets: [
                    {
                        label: 'Rank Scores',
                        data: rankScores.map((subject) => subject.totalRankScore),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF',
                        ],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 13,
                            },
                            color: theme === 'dark' ? '#fff' : '#000',
                        },
                    },
                    title: {
                        display: true,
                        text: lang === 'ja' ? 'ランクスコア' : 'Rank Score',
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 16,
                            weight: 'bold',
                        },
                        color: theme === 'dark' ? '#fff' : '#000',
                    },
                },
                maintainAspectRatio: false,
            }
        });

        const ctxPieBar = document.getElementById('rankCreditsPieBarChart') as HTMLCanvasElement;
        const rankCreditsPieBarChart = new Chart(ctxPieBar, {
            type: 'pie',
            data: {
                labels: Object.keys(rankCredits),
                datasets: [
                    {
                        label: 'Credits',
                        data: Object.values(rankCredits),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                        ],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 13,
                            },
                            color: theme === 'dark' ? '#fff' : '#000',
                        },
                    },
                    title: {
                        display: true,
                        text: lang === 'ja' ? 'クレジット' : 'Credits',
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 16,
                            weight: 'bold',
                        },
                        color: theme === 'dark' ? '#fff' : '#000',
                    },
                },
                maintainAspectRatio: false,
            },
        });


        const ctxBar = document.getElementById('rankCreditsBarChart') as HTMLCanvasElement;
        const rankCreditsBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: Object.keys(rankCredits),
                datasets: [
                    {
                        label: 'Credits',
                        data: Object.values(rankCredits),
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                        ],
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: lang === 'ja' ? 'クレジット' : 'Credits',
                        font: {
                            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                            size: 16,
                            weight: 'bold',
                        },
                        color: theme === 'dark' ? '#fff' : '#000',
                    },
                },
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 13,
                            },
                            color: theme === 'dark' ? '#fff' : '#000',
                        },
                        grid: {
                            color: theme === 'dark' ? '#c4c4c4' : '#e5e5e5',
                        },
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                                size: 13,
                            },
                        },
                        grid: {
                            color: theme === 'dark' ? '#c4c4c4' : '#e5e5e5',
                        },
                    },
                },
            },
        });

        pieChartRef.current = rankScorePieChart as Chart;
        pieBarChartRef.current = rankCreditsPieBarChart as Chart;
        barChartRef.current = rankCreditsBarChart as Chart;
    }, [theme, lang, rankScores, rankCredits]);

    return (
        <div className="w-full max-w-3xl py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-0 lg:gap-4">
            <div className='max-w-7xl w-fit'>
                <canvas id="rankScorePieChart"></canvas>
            </div>
            <div className='max-w-6xl w-fit'>
                <canvas id="rankCreditsPieBarChart"></canvas>
            </div>
            <div className='max-w-5xl w-fit ml-0 mr-2'>
                <canvas id="rankCreditsBarChart"></canvas>
            </div>
        </div>
    );
};

export default Graph;