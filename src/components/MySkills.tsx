import React from 'react';
import { SiReact, SiNextdotjs, SiNodedotjs, SiTypescript, SiMysql, SiSqlite, SiPython, SiFlask, SiExpress, SiTailwindcss } from 'react-icons/si';
import { IconType } from 'react-icons';
import { useTranslations } from 'next-intl';

const SkillItem = ({ icon: Icon, label, color }: { icon: IconType; label: string; color: string }) => (
    <div
        className="flex flex-col items-center my-2 cursor-pointer transition duration-300 transform hover:scale-105 w-40"
        style={{ backgroundColor: color, color: 'white', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' }}
    >
        <Icon className="w-16 h-24 mb-1" />
        <span className="text-xl font-semibold s">{label}</span>
    </div>
);

const MySkills = () => {
    const t = useTranslations('skill');

    const skills = [
        { icon: SiReact, label: t('react'), color: '#0e7696' },
        { icon: SiNextdotjs, label: t('nextjs'), color: '#000000' },
        { icon: SiNodedotjs, label: t('nodejs'), color: '#336633' },
        { icon: SiExpress, label: t('express'), color: '#000000' },
        { icon: SiTypescript, label: t('typescript'), color: '#3178c6' },
        { icon: SiMysql, label: t('mysql'), color: '#4479a1' },
        { icon: SiSqlite, label: t('sqlite3'), color: '#003b57' },
        { icon: SiPython, label: t('python'), color: '#3776ab' },
        { icon: SiFlask, label: t('flask'), color: '#0074D9' },
        { icon: SiTailwindcss, label: t('tailwind'), color: '#4C51BF' }
    ];

    return (
        <>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 text-gray-800 dark:text-white">{t('title')}</h2>
            <div className="w-full max-auto flex items-center justify-center flex-wrap gap-6 space-x-2">
                {skills.map((skill, index) => (
                    <SkillItem key={index} icon={skill.icon} label={skill.label} color={skill.color} />
                ))}
            </div>
        </>
    );
};

export default MySkills;