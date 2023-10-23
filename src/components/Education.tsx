'use client'
import { Accordion, AccordionItem } from "@nextui-org/react";
import NCEA from "./NCEA/Ncea";
import SchoolHistory from "./SchoolHistory";
import { FaChevronDown } from 'react-icons/fa';
import { useTranslations } from "next-intl";

const Education = () => {
    const t = useTranslations('about');

    return (
        <Accordion defaultExpandedKeys={["1", "2"]} selectionMode="multiple" className="max-w-full">
            <AccordionItem key="1" indicator={<FaChevronDown className="text-xl w-full" />} aria-label={t('education.schoolHistory')} title={
                <h2 className='text-3xl float-left font-bold text-gray-900 dark:text-white'>
                    {t('education.schoolHistory')}
                </h2>
            } subtitle={t('collapse')} className='font-bold text-gray-900 dark:text-white'>
                <SchoolHistory />
            </AccordionItem>
            <AccordionItem key="2" indicator={<FaChevronDown className="text-xl w-full" />} aria-label={t('ncea.title')} title={
                <h2 className='text-3xl float-left font-bold text-gray-900 dark:text-white'>
                    {t('ncea.title')}
                </h2>
            } subtitle={t('collapse')} className='font-bold text-gray-900 dark:text-white'>
                <NCEA />
            </AccordionItem>
        </Accordion>
    )
}

export default Education;