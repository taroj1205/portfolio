'use client'
import { useTranslations } from 'next-intl';
import { FaBlog, FaCog, FaCubes, FaGithub, FaMedium, FaSearch, FaUser, FaYoutube } from 'react-icons/fa';
import Image from 'next/image';
import { TbMessageChatbot } from 'react-icons/tb';
import { Link } from '@/lib/next-intl';
import { PiNotePencilBold } from 'react-icons/pi';

const apps = [
  // {
  //   icon: <AiFillHome />,
  //   link: '/',
  //   name: 'Home',
  //   description: 'Visit my home page to learn more about me and my work.',
  //   backgroundColor: 'bg-blue-400 dark:bg-blue-800'
  // },
  // {
  //   icon: <FaUser />,
  //   link: '/posts/about',
  //   name: 'About',
  //   backgroundColor: 'bg-green-400 dark:bg-green-800'
  // },
  // {
  //   icon: <FaCubes />,
  //   link: '/apps',
  //   name: 'Apps',
  //   backgroundColor: 'bg-red-400 dark:bg-red-800'
  // },
  {
    icon: <PiNotePencilBold />,
    link: 'https://note.com/taroj1205',
    name: 'Note',
    backgroundColor: 'bg-purple-400 hover:bg-purple-500 dark:bg-purple-800 dark:hover:bg-purple-900'
  },
  {
    icon: <FaBlog />,
    link: 'https://taroj1205.hatenablog.com',
    name: 'Hatena Blog',
    backgroundColor: 'bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-800 dark:hover:bg-yellow-900'
  },
  {
    icon: <FaGithub />,
    link: 'https://github.com/taroj1205',
    name: 'GitHub',
    backgroundColor: 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-black'
  },
  {
    icon: <FaYoutube />,
    link: 'https://www.youtube.com/@taroj-ic8zi',
    name: 'YouTube',
    backgroundColor: 'bg-red-400 hover:bg-red-500 dark:bg-red-800 dark:hover:bg-red-900'
  },
  {
    icon: <FaMedium />,
    link: 'https://taroj1205.medium.com/',
    name: 'Medium',
    backgroundColor: 'bg-teal-200 hover:bg-teal-300 dark:bg-teal-700 dark:hover:bg-teal-800'
  },
  {
    icon: <TbMessageChatbot />,
    link: 'https://chat-taroj.vercel.app/',
    name: 'Chat',
    backgroundColor: 'bg-blue-400 hover:bg-blue-500 dark:bg-blue-800 dark:hover:bg-blue-900'
  }
  // {
  //   icon: <FaSearch />,
  //   link: '/apps/search',
  //   name: 'Search',
  //   backgroundColor: 'bg-orange-400 dark:bg-orange-800'
  // }
];


export default function Home() {
  const t = useTranslations('index');
  return (
    <div className='flex flex-col items-center justify-center'>
      <div className="max-w-5xl w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center pb-12">
          <div className='text-9xl'><Image src="/images/profile/pfp.webp" alt="Logo" width={100} height={100} /></div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('welcome')}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            {t('welcomeMessage')}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pb-6 max-w-3xl">
          {apps.map((app) => (
            <Link key={app.link} href={app.link} className={`flex flex-col items-center w-48 justify-center ${app.backgroundColor} rounded-lg shadow-md`}>
              <div className='h-full'>
                <div className="h-32 flex items-center justify-center text-6xl text-black dark:text-white">
                  {app.icon}
                </div>
                <div className="px-4 py-2 text-center">
                  <h2 className="text-lg font-medium text-black dark:text-white">
                    {t(`apps.${app.name.toString().toLowerCase()}.name`)}
                  </h2>
                  <p className="mt-2 text-sm text-gray-950 dark:text-gray-200 whitespace-break-spaces">
                    {t(`apps.${app.name.toString().toLowerCase()}.description`)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}