'use client'
import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import RankScore from '@/components/NCEA/RankScore';
import { Link } from "@/lib/next-intl";
import Graph from '@/components/NCEA/PersonalGraph';
import { FaChevronDown } from 'react-icons/fa';
import { Accordion, AccordionItem } from '@nextui-org/react';

const NCEA: React.FC = () => {
    const t = useTranslations('about');

    const lang = useLocale();

    return (
        <div className='flex flex-col items-center max-w-full w-[52rem]'>
            <Accordion defaultExpandedKeys={["1"]} className="w-full">
                <AccordionItem key="1" indicator={<FaChevronDown className="text-xl w-full" />} aria-label={t('ncea.title')} title={
                    <h2 className='text-3xl float-left font-bold text-gray-900 dark:text-white'>
                        {t('ncea.title')}
                    </h2>
                } subtitle={t('expand')} className='font-bold text-gray-900 px-4 dark:text-white'>
                    {lang === 'ja' && (
                        <Link href="https://www.edukiwi.com/highschool/ncea-ue/" target="_blank"
                            rel="noopener noreferrer" className='flex justify-center items-center'>
                            https://www.edukiwi.com/highschool/ncea-ue/
                        </Link>
                    )}
                    <p className='text-lg font-bold mt-2 text-center'>{t('ncea.currentRankScore')}<RankScore /></p>
                    <div className='flex items-center justify-center flex-col'>
                        <Graph />
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default NCEA;