import { useTranslations } from "next-intl";
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'
import { useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { useSpring, animated } from 'react-spring';

export default function SchoolHistory() {
    const t = useTranslations('about');
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
                                {t('education.headings.start')}
                            </Th>
                            <Th className="py-2 px-4">
                                {t('education.headings.end')}
                            </Th>
                            <Th className="py-2 px-4">
                                {t('education.headings.schoolName')}
                            </Th>
                            <Th className="py-2 px-4">
                                {t('education.headings.grade')}
                            </Th>
                            <Th className="py-2 px-4">
                                {t('education.headings.duration')}
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
                                <Td className={`py-2 px-4 ${index === 10 ? 'rounded-bl-lg' : ''}`}>
                                    {t(`education.schools.${index}.start`)}
                                </Td>
                                <Td className="py-2 px-4">
                                    {t(`education.schools.${index}.end`)}
                                </Td>
                                <Td className="py-2 px-4 flex items-center">
                                    {t(`education.schools.${index}.name`)}
                                </Td>
                                <Td className="py-2 px-4">
                                    {t(`education.schools.${index}.grade`)}
                                </Td>
                                <Td className="py-2 px-4">
                                    {t(`education.schools.${index}.duration`)}
                                </Td>
                                <Td className={`py-2 px-4 ${index === 10 ? 'rounded-br-lg' : ''}`}>
                                    {t(`education.schools.${index}.location`)}
                                </Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </animated.div>
        </div>
    );
}