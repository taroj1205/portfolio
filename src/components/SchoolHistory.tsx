import { useTranslations } from "next-intl";
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css'

export default function SchoolHistory() {
    const t = useTranslations('about');

    return (
        <div className="education max-w-full">
            <h2 className='text-3xl font-bold text-gray-900 px-4 dark:text-white mb-4'>{t('education.schoolHistory')}</h2>
            <div className="overflow-x-auto w-full">
                <Table className="w-full max-w-4xl table-auto rounded-lg border-collapse whitespace-nowrap transition-shadow duration-300 shadow-md hover:shadow-lg text-base md:text-lg">
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
            </div>
        </div>
    );
}
