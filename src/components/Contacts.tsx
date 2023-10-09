'use client'
import { FaFacebook, FaInstagram, FaYoutube, FaDiscord, FaTwitter, FaLinkedin } from 'react-icons/fa';
import { Tooltip } from 'react-tooltip';
import copy from 'copy-to-clipboard';
import { IconType } from 'react-icons';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ContactLinkProps {
    hover: string;
    icon: JSX.Element & { type: IconType };
    label: string;
    href: string;
}

const ContactLink = ({ hover, icon, label, href }: ContactLinkProps) => {
    return (
        <div className="flex items-center">
            <a
                className={`text-lg flex items-center rounded-lg p-1 w-full transition-colors duration-300 ${hover}`}
                href={href}
            >
                {icon}
                <span className="ml-2">{label}</span>
            </a>
        </div>
    );
};

function Contacts() {
    const t = useTranslations();
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        copy(text);
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    };

    return (
        <section>
            <div className="mt-6 grid grid-cols-2 gap-2 max-w-full w-64 font-semibold rounded-lg">
                <ContactLink
                    hover="hover:bg-blue-600 hover:text-white text-blue-600"
                    icon={<FaFacebook className="mr-1" />}
                    label="Facebook"
                    href="https://facebook.com/taroj1205"
                />
                <ContactLink
                    hover="hover:bg-pink-600 hover:text-white text-pink-600"
                    icon={<FaInstagram className="mr-1" />}
                    label="Instagram"
                    href="https://instagram.com/taroj1205"
                />
                <ContactLink
                    hover="hover:text-white hover:bg-red-600 text-red-600"
                    icon={<FaYoutube className="mr-1" />}
                    label="YouTube"
                    href="https://www.youtube.com/@user-le6xc5nx5k"
                />
                <div className="flex items-center">
                    <button
                        className={`text-lg flex items-center rounded-lg p-1 w-full transition-colors duration-300 hover:text-white hover:bg-[#7289DA] text-[#4c5c96] dark:text-[#7289DA] dark:hover:text-white`} // changed text color to #4c5c96
                        data-tooltip-content="Copy"
                        data-tooltip-place="top"
                        data-tooltip-id="Copy"
                        style={{ cursor: 'pointer' }}
                        aria-label='Copy discord id'
                        onClick={() => handleCopy('taroj1205')}
                    >
                        <FaDiscord className="mr-1" />
                        <span className="ml-2">Discord</span>
                    </button>
                    <Tooltip
                        id="Copy"
                        content={copied ? t('copied') : ''}
                    />
                </div>
                <ContactLink
                    hover="hover:bg-blue-500 hover:text-white text-blue-600 dark:text-blue-500 dark:hover:text-white"
                    icon={<FaTwitter className="mr-1" />}
                    label="Twitter"
                    href="https://twitter.com/taroj1205"
                />
                <ContactLink
                    hover="hover:bg-indigo-600 hover:text-white text-indigo-600"
                    icon={<FaLinkedin className="mr-1" />}
                    label="LinkedIn"
                    href="https://www.linkedin.com/in/taroj1205/"
                />
            </div>
        </section>
    );
}

export default Contacts;