'use client'
import { useTranslations } from "next-intl";
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { Tooltip } from "react-tooltip";
import { Accordion, AccordionItem } from "@nextui-org/react";

export default function SchoolHistory() {
    const t = useTranslations('about');
    return (
        <div className="education max-w-full w-[45rem] flex flex-col items-center">
            <Accordion defaultExpandedKeys={["1"]} className="w-full">
                <AccordionItem key="1" indicator={<FaChevronDown className="text-xl w-full" />} aria-label={t('education.schoolHistory')} title={
                    <h2 className='text-3xl float-left font-bold text-gray-900 dark:text-white'>
                        {t('education.schoolHistory')}
                    </h2>
                } subtitle={t('collapse')} className='font-bold text-gray-900 dark:text-white'>
                <div
                    className="overflow-x-auto w-full font-normal"
                >
                    <table className="w-full max-w-4xl table-auto rounded-lg border-collapse whitespace-nowrap shadow-md hover:shadow-lg text-base md:text-lg">
                        <thead>
                            <tr className="bg-teal-700 text-white">
                                <th className="py-2 px-4 rounded-tl-lg">
                                    {t('education.headings.period')}
                                </th>
                                <th className="py-2 px-4">
                                    {t('education.headings.schoolName')}
                                </th>
                                <th className="py-2 px-4 rounded-tr-lg">
                                    {t('education.headings.location')}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="text-black dark:text-white">
                            {Array.from(Array(11).keys()).map((index) => (
                                <tr
                                    key={index}
                                    className={
                                        index % 2 === 0
                                            ? 'bg-gray-100 dark:bg-gray-800'
                                            : 'bg-gray-200 dark:bg-gray-950'
                                    }
                                    style={{ transition: 'background-color 0.3s' }}
                                >
                                    <td className="py-2 px-4 cursor-pointer"
                                        data-tooltip-content={`${t(`education.schools.${index}.start`)} - ${t(`education.schools.${index}.end`)}`}
                                        data-tooltip-id={`tooltip-${index}-period`}
                                        data-tooltip-place="top-start"
                                        data-tooltip-delay-hide={0}
                                        data-tooltip-delay-show={0}
                                    >
                                        {t(`education.schools.${index}.duration`)}
                                    </td>
                                    <Tooltip id={`tooltip-${index}-period`} />
                                    <td className={`py-2 px-4 flex items-center ${index === 7 ? '' : 'cursor-pointer'}`}
                                        data-tooltip-content={t(`education.schools.${index}.grade`)}
                                        data-tooltip-id={`tooltip-${index}-grade`}
                                        data-tooltip-place="top-start"
                                        data-tooltip-delay-hide={0}
                                        data-tooltip-delay-show={0}
                                        data-tooltip-hidden={index === 7}
                                    >
                                        {t(`education.schools.${index}.name`)}
                                    </td>
                                    <Tooltip id={`tooltip-${index}-grade`} data-tooltip-content={t(`education.schools.${index}.grade`)} />
                                    <td className={`py-2 px-4 cursor-pointer ${index === 10 ? 'rounded-br-lg' : ''}`}
                                        data-tooltip-content={t(`education.schools.${index}.location.region`)}
                                        data-tooltip-id={`tooltip-${index}-location`}
                                        data-tooltip-place="top-start"
                                        data-tooltip-delay-hide={0}
                                        data-tooltip-delay-show={0}
                                    >
                                        {t(`education.schools.${index}.location.country`)}
                                    </td>
                                    <Tooltip id={`tooltip-${index}-location`} data-tooltip-content={t(`education.schools.${index}.location.region`)} />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </AccordionItem>
            </Accordion>
        </div>
    );
}