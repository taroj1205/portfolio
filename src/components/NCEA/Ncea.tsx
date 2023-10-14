'use client'
import React, { useState } from 'react';
import ncea from '../doc/ncea';
import { useLocale, useTranslations } from 'next-intl';
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';
import RankScore from '@/components/NCEA/RankScore';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
const locales = ['en', 'ja'] as const;
const { Link, useRouter, usePathname, redirect } = createSharedPathnamesNavigation({ locales });
import Graph from '@/components/NCEA/PersonalGraph';
import { useSpring, animated } from 'react-spring';
import { FaChevronDown } from 'react-icons/fa';

const NCEA: React.FC = () => {
    const t = useTranslations('about');
    const lang = useLocale();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const springProps = useSpring({
        maxHeight: isCollapsed ? 0 : 1000,
        opacity: isCollapsed ? 0 : 1,
        config: { duration: 300 },
    });

    const handleCollapseClick = () => {
        setIsCollapsed(!isCollapsed);
    };

    return (
        <div className='flex flex-col items-center'>
            <button
                className="w-full cursor-pointer text-left max-w-2xl py-2"
                onClick={handleCollapseClick}
            >
                <h2 className='flex justify-between items-center text-3xl font-bold text-gray-900 px-4 dark:text-white'>
                    {t('ncea.title')}
                    <FaChevronDown className={`h-6 w-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                </h2>
            </button>
            {lang === 'ja' && (
                <Link href="https://www.edukiwi.com/highschool/ncea-ue/" target="_blank"
                    rel="noopener noreferrer" className='flex items-center'>
                    https://www.edukiwi.com/highschool/ncea-ue/
                </Link>
            )}
            <animated.div
                style={springProps}
            >
                <p className='text-lg font-bold mt-2 text-center'>{t('ncea.currentRankScore')}<RankScore /></p>
                <div className='flex items-center justify-center flex-col'>
                    <Graph />
                </div>
                {/* <div
                    className="max-w-full w-full sm:w-fit"
                >
                    <Table className="w-fit table-auto rounded-lg border-collapse whitespace-nowrap transition-shadow duration-300 shadow-md hover:shadow-lg text-base md:text-lg">
                        <Thead>
                            <Tr className="bg-teal-700 text-white text-left">
                                <Th className="py-2 px-4 rounded-tl-lg">{t('ncea.subjects')}</Th>
                                <Th className="py-2 px-4">{t('ncea.credits')}</Th>
                                <Th className="py-2 px-4 rounded-tr-lg">{t('ncea.achievement')}</Th>
                            </Tr>
                        </Thead>
                        <Tbody className="text-black dark:text-white">
                            {Object.entries(ncea).map(([subject, assessments]) => (
                                <React.Fragment key={subject}>
                                    {Object.entries(assessments).map(([assessment, details]) => (
                                        <Tr
                                            key={`${subject}-${assessment}`}
                                            className={
                                                Object.keys(ncea).indexOf(subject) % 2 === 0
                                                    ? 'bg-gray-100 dark:bg-gray-800'
                                                    : 'bg-gray-200 dark:bg-gray-950'
                                            }
                                        >
                                            <Td className="py-2 px-3 text-left">{subject} {assessment}</Td>
                                            <Td className="py-2 px-3 text-right">{details.credits}</Td>
                                            <Td className="py-2 px-3 text-left">{details.achievement}</Td>
                                        </Tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </Tbody>
                    </Table>
                </div> */}
            </animated.div>
        </div>
    );
};

export default NCEA;