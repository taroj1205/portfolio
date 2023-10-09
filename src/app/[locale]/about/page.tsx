'use client'
import SchoolHistory from '@/components/SchoolHistory';
import { SiNextdotjs, SiReact, SiTailwindcss } from 'react-icons/si';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { IconType } from 'react-icons';
import Contacts from '@/components/Contacts';
import MySkills from '@/components/MySkills';

import NCEA from '@/components/NCEA/Ncea';

const SkillItem = ({ icon: Icon, label, color }: { icon: IconType; label: string; color: string }) => (
    <div
        className={`flex flex-col text-white shadow-md items-center justify-center my-2 cursor-pointer transition duration-300 transform hover:scale-105 p-4 rounded-lg`}
        style={{ backgroundColor: color }}
    >
        <Icon className="w-16 h-16 mb-2" />
        <span className="text-lg text-center font-semibold">{label}</span>
    </div>
);

const MadeWith = () => {
    const t = useTranslations('index');

    const skills = [
        { icon: SiReact, label: 'React.js', color: '#0e7696' }, // Blue for React
        { icon: SiNextdotjs, label: 'Next.js', color: '#000000' }, // Black for Next.js
        { icon: SiTailwindcss, label: 'Tailwind', color: '#4C51BF' } // Blue for Tailwind CSS
    ];

    return (
        <div className="my-8">
            <h2 className="text-2xl md:text-4xl font-bold">{t('madeWith')}</h2>
            <div className="grid grid-cols-3 gap-4 max-w-sm">
                {skills.map((skill, index) => (
                    <SkillItem key={index} icon={skill.icon} label={skill.label} color={skill.color} />
                ))}
            </div>
        </div>
    );
};

export default function About() {
    const t = useTranslations('about');

    return (
        <div className='flex flex-col items-center justify-center min-h-full bg-gray-100 dark:bg-gray-900 mb-12'>
            <div className="max-w-5xl w-full px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-center pb-4">
                    <h1 className="mt-6 text-4xl font-extrabold">
                        {t('title')}
                    </h1>
                    {/* <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                        {t('subtitle')}
                    </p> */}
                </div>
                <div className="flex items-center justify-center">
                    <Image
                        src="/images/profile/profile.webp"
                        alt="Profile Picture"
                        width={200}
                        height={200}
                        className="rounded-lg object-fit"
                        priority
                    />
                </div>
                <div className="max-w-2xl text-md mx-auto mt-8 text-left">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('about me')}
                    </p>
                    <p className="text-gray-600 my-4 dark:text-gray-400">
                        {t('events and dev')}
                    </p>
                </div>

                <div className='mb-1 max-w-3xl mx-auto'>
                    <h2 className="text-black dark:text-white text-2xl md:text-3xl lg:text-4xl mt-6 mb-2 font-bold">
                        {t('contact')}
                    </h2>
                    <Contacts />
                </div>
            </div>
            <section className='max-w-7xl w-full'>
                <div className='md:flex md:flex-col md:items-center md:justify-center'>
                    <SchoolHistory />
                </div>
                <div className='md:flex md:flex-col md:items-center md:justify-center'>
                    <NCEA />
                </div>
            </section >
            <section className='max-w-7xl w-full'>
                <div className='max-w-5xl w-full flex items-center flex-col'>
                    <MadeWith />
                </div>
            </section>
        </div >
    );
}