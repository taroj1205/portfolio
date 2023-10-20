'use client'
import { useTranslations } from "next-intl";
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';
import { Tooltip } from "react-tooltip";
import { useTheme } from "next-themes";

export default function SchoolHistory() {
    const t = useTranslations('about');
    const { resolvedTheme } = useTheme();
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
        <div className="education max-w-full flex flex-col items-center">
            <button
                className={`w-full cursor-pointer py-2 max-w-2xl`}
                onClick={handleCollapseClick}
            >
                <h2 className='flex justify-between items-center text-3xl font-bold text-gray-900 px-4 dark:text-white'>
                    {t('education.schoolHistory')}
                    <FaChevronDown className={`h-6 w-6 text-gray-500 dark:text-gray-400 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
                </h2>
            </button>
            <animated.div
                className="overflow-x-auto w-full"
                style={springProps}
            >
                <Table className="w-full max-w-4xl table-auto rounded-lg border-collapse whitespace-nowrap shadow-md hover:shadow-lg text-base md:text-lg">
                    <Thead>
                        <Tr className="bg-teal-700 text-white">
                            <Th className="py-2 px-4 rounded-tl-lg">
                                {t('education.headings.period')}
                            </Th>
                            <Th className="py-2 px-4">
                                {t('education.headings.schoolName')}
                            </Th>
                            <Th className="py-2 px-4 rounded-tr-lg">
                                {t('education.headings.location')}
                            </Th>
                        </Tr>
                    </Thead>
                    <Tbody className="text-black dark:text-white">
                        {Array.from(Array(11).keys()).map((index) => (
                            <Tr
                                key={index}
                                className={
                                    index % 2 === 0
                                        ? 'bg-gray-100 dark:bg-gray-800'
                                        : 'bg-gray-200 dark:bg-gray-950'
                                }
                                style={{ Transition: 'background-color 0.3s' }}
                            >
                                <Td className="py-2 px-4 cursor-pointer"
                                    data-tooltip-content={`${t(`education.schools.${index}.start`)} - ${t(`education.schools.${index}.end`)}`}
                                    data-tooltip-id={`tooltip-${index}-period`}
                                    data-tooltip-place="top-start"
                                    data-tooltip-delay-hide={0}
                                    data-tooltip-delay-show={0}
                                >
                                    {t(`education.schools.${index}.duration`)}
                                </Td>
                                <Tooltip id={`tooltip-${index}-period`} />
                                <Td className={`py-2 px-4 flex items-center ${index === 7 ? '' : 'cursor-pointer'}`}
                                    data-tooltip-content={t(`education.schools.${index}.grade`)}
                                    data-tooltip-id={`tooltip-${index}-grade`}
                                    data-tooltip-place="top-start"
                                    data-tooltip-delay-hide={0}
                                    data-tooltip-delay-show={0}
                                    data-tooltip-hidden={index === 7}
                                >
                                    {t(`education.schools.${index}.name`)}
                                </Td>
                                <Tooltip id={`tooltip-${index}-grade`} data-tooltip-content={t(`education.schools.${index}.grade`)} />
                                <Td className={`py-2 px-4 cursor-pointer ${index === 10 ? 'rounded-br-lg' : ''}`}
                                    data-tooltip-content={t(`education.schools.${index}.location.region`)}
                                    data-tooltip-id={`tooltip-${index}-location`}
                                    data-tooltip-place="top-start"
                                    data-tooltip-variant={resolvedTheme}
                                    data-tooltip-delay-hide={0}
                                    data-tooltip-delay-show={0}
                                >
                                    {t(`education.schools.${index}.location.country`)}
                                </Td>
                                <Tooltip id={`tooltip-${index}-location`} data-tooltip-content={t(`education.schools.${index}.location.region`)} />
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </animated.div>
        </div>
    );
}