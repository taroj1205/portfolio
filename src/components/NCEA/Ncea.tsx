'use client'
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import RankScore from '@/components/NCEA/RankScore';
import { Link } from "@/lib/next-intl";
import Graph from '@/components/NCEA/PersonalGraph';

const NCEA: React.FC = () => {
    const t = useTranslations('about');

    const lang = useLocale();

    return (
        <div className='flex flex-col items-center max-w-full'>
            {lang === 'ja' && (
                <Link href="https://www.edukiwi.com/highschool/ncea-ue/" target="_blank"
                    rel="noopener noreferrer" className='flex justify-center items-center'>
                    https://www.edukiwi.com/highschool/ncea-ue/
                </Link>
            )}
            <p className='text-lg font-bold text-center'>{t('ncea.currentRankScore')}<RankScore className="bg-green-400 dark:bg-green-800 bg-opacity-20 dark:bg-opacity-20" /></p>
            <div className='flex items-center justify-center flex-col h-full w-full'>
                <Graph />
            </div>
        </div>
    );
};

export default NCEA;