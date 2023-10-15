'use client'
import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useState } from 'react';
import { FaUpload } from 'react-icons/fa';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const STORAGE_BUCKET = 'generator';

const GeneratorPage: React.FC = () => {
    const [imageUrl, setImageUrl] = useState<string>();
    const [url, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const saveToLocalStorage = (url: string, title: string, description: string) => {
        const generatorData = {
            url,
            title,
            description
        };
        localStorage.setItem('generator', JSON.stringify(generatorData));
    };

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUrl(event.target.value);
        saveToLocalStorage(event.target.value, title, description);
    };

    const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(event.target.value);
        saveToLocalStorage(url, event.target.value, description);
    };

    const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setDescription(event.target.value);
        saveToLocalStorage(url, title, event.target.value);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsLoading(true);
        try {
            if (event.target.files && event.target.files[0]) {
                const file = event.target.files[0];
                const fileExtension = file.name.split('.').pop() || '';
                // name to be current time with milliseconds
                const file_name = Date.now();

                const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(`${file_name}.${fileExtension}`, file, {
                    cacheControl: '3600',
                    upsert: true,
                });
                if (error) {
                    console.error('Error while uploading image:', error);
                    return;
                }
                const publicUrl = `https://xtfywqvybzosyisgztuw.supabase.co/storage/v1/object/public/${STORAGE_BUCKET}/${file_name}.${fileExtension}`;
                console.log(publicUrl);
                setImageUrl(publicUrl as string);

                // Get a list of files in the bucket
                const { data: files, error: listError } = await supabase.storage.from(STORAGE_BUCKET).list();

                if (listError) {
                    console.error('Error while listing files:', listError);
                    return;
                }

                // Filter out files that are more than a day old
                const oldFiles = files?.filter(file => {
                    const fileTime = Number(file.name.split('.')[0]);
                    return Date.now() - fileTime > 24 * 60 * 60 * 1000;
                });

                // Delete the old files
                if (oldFiles && oldFiles.length > 0) {
                    const { error: removeError } = await supabase.storage.from(STORAGE_BUCKET).remove(oldFiles.map(file => file.name));

                    if (removeError) {
                        console.error('Error while removing old files:', removeError);
                    }
                }
            }
        } catch (error) {
            console.error('Error while uploading image:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl) {
            return;
        }
        setIsLoading(true);
        // Make the GET request.
        fetch(`/api/og/image?url=${imageUrl}&articleUrl=${url}&title=${title}&description=${description}&imagePositionX=${position.x}&imagePositionY=${position.y}`)
            .then((response) => {
                if (response.ok) {
                    // Assuming the response contains the image URL.
                    return response.blob();
                } else {
                    // Handle the error here.
                    console.error('Error while fetching image:', response.statusText);
                }
            })
            .then((data) => {
                // Update the image state with the image URL from the response.
                if (data) {
                    const imageUrl = URL.createObjectURL(data);
                    setImageUrl(imageUrl);
                }
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error:', error);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        const generatorData = localStorage.getItem('generator');
        if (generatorData) {
            const parsedGeneratorData = JSON.parse(generatorData);
            setUrl(parsedGeneratorData.url);
            setTitle(parsedGeneratorData.title);
            setDescription(parsedGeneratorData.description);
        }
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="max-w-lg w-full bg-gray-100 dark:bg-gray-950 shadow-lg rounded-lg overflow-hidden">
                <div className="relative pb-2/3">
                    <label htmlFor="file-upload" className="w-full h-full cursor-pointer">
                        {isLoading ? (
                            <div className="w-full h-full min-h-[10rem] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <span className="text-gray-400">Loading...</span>
                            </div>
                        ) : imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full min-h-[10rem] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <FaUpload color="gray" />
                                <span className="text-gray-400 ml-2">No image selected</span>
                            </div>
                        )}
                        <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    </label>
                </div>
                <form className="p-4" onSubmit={handleGenerateClick}>
                    <div className="mb-4">
                        <label htmlFor="url" className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Article URL
                        </label>
                        <input type="text" autoComplete='on' required={true} id="url" placeholder="Enter article URL" value={url} onChange={handleUrlChange} className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="title" className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Title
                        </label>
                        <input type="text" id="title" autoComplete='on' placeholder="Enter title" value={title} onChange={handleTitleChange} className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 w-full" />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="description" className="block font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <input type="text" id="description" autoComplete='on' placeholder="Enter description" value={description} onChange={handleDescriptionChange} className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 w-full" />
                    </div>
                    <div className="flex items-center justify-end">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg mr-4">
                            Generate
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GeneratorPage;