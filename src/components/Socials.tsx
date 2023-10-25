import Link from 'next/link';
import { BsArrowLeft, BsArrowRight } from 'react-icons/bs';
import { FaTwitter, FaInstagram, FaFacebook, FaLinkedin, FaGithub } from 'react-icons/fa';

const socialData = [
    {
        name: 'Twitter',
        url: 'https://twitter.com/taroj1205',
        icon: <FaTwitter />,
        color: '#1DA1F2'
    },
    {
        name: 'Instagram',
        url: 'https://instagram.com/taroj1205',
        icon: <FaInstagram />,
        color: '#E4405F'
    },
    {
        name: 'Facebook',
        url: 'https://www.facebook.com/taroj1205',
        icon: <FaFacebook />,
        color: '#1877F2'
    },
    {
        name: 'LinkedIn',
        url: 'https://www.linkedin.com/in/taroj/',
        icon: <FaLinkedin />,
        color: '#0A66C2'
    },
    {
        name: 'GitHub',
        url: 'https://github.com/taroj1205',
        icon: <FaGithub />,
        color: '#333'
    }
];

export default function Socials () {
    return (
        <div className="flex space-x-2">
            {socialData.map((social, index) => (
                <Link
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-lg text-gray-500 ${social.url.includes('instagram') ? 'hover:text-pink-500' : social.url.includes('linkedin') ? 'hover:text-blue-600' : social.url.includes('github') ? 'hover:text-black dark:hover:text-white' : 'hover:text-blue-500'} transition-colors duration-300`}
                >
                    {social.icon}
                </Link>
            ))}
        </div>
    );
};
